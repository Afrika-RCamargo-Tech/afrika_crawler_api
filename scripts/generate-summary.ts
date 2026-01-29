import { connectToDatabase, disconnectDatabase } from '../src/database';
import { UpdateModel } from '../src/models/Update';
import { writeFileSync } from 'fs';

async function generateSummary() {
  try {
    await connectToDatabase();

    // Total de updates
    const totalUpdates = await UpdateModel.countDocuments();

    // Últimos 20 updates por data
    const recentUpdates = await UpdateModel.find()
      .sort({ date: -1 })
      .limit(20)
      .select('tool version date description createdAt');

    // Contagem por ferramenta
    const updatesByTool = await UpdateModel.aggregate([
      {
        $group: {
          _id: '$tool',
          count: { $sum: 1 },
          latest: { $max: '$date' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Updates das últimas 24 horas
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUpdates = await UpdateModel.countDocuments({
      createdAt: { $gte: yesterday }
    });

    // Update mais recente
    const latestUpdate = await UpdateModel.findOne().sort({ date: -1 });
    const daysSinceLastUpdate = latestUpdate 
      ? Math.floor((Date.now() - latestUpdate.date.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Gerar markdown profissional para o GitHub Actions Summary
    let summary = '# 🚀 Afrika Crawler - Execution Summary\n\n';
    
    summary += '> Security Tools Updates Monitor - Automated Crawling Report\n\n';
    summary += '---\n\n';
    
    // Status Badge
    summary += '## ✅ Execution Status\n\n';
    summary += '```diff\n';
    summary += '+ Crawler executed successfully\n';
    summary += '+ Database connection established\n';
    summary += '+ All data synchronized\n';
    summary += '```\n\n';

    // Métricas principais
    summary += '## 📊 Key Metrics\n\n';
    summary += '<table>\n';
    summary += '<tr>\n';
    summary += `<td align="center"><b>📦 Total Updates</b><br/><h2>${totalUpdates}</h2></td>\n`;
    summary += `<td align="center"><b>🆕 New (24h)</b><br/><h2>${newUpdates}</h2></td>\n`;
    summary += `<td align="center"><b>🔧 Tools</b><br/><h2>${updatesByTool.length}</h2></td>\n`;
    summary += `<td align="center"><b>📅 Days Since Last</b><br/><h2>${daysSinceLastUpdate}</h2></td>\n`;
    summary += '</tr>\n';
    summary += '</table>\n\n';

    // Informações de execução
    const now = new Date();
    summary += '## 🕐 Execution Details\n\n';
    summary += `- **⏰ Timestamp**: ${now.toUTCString()}\n`;
    summary += `- **🌍 Timezone**: UTC\n`;
    summary += `- **🔄 Workflow**: \`${process.env.GITHUB_WORKFLOW || 'Manual'}\`\n`;
    summary += `- **🏷️ Run**: #${process.env.GITHUB_RUN_NUMBER || 'N/A'}\n\n`;

    // Updates por ferramenta
    summary += '## 🛠️ Updates by Tool\n\n';
    summary += '<table>\n';
    summary += '<tr><th align="left">Tool</th><th align="center">Updates</th><th align="right">Latest Update</th></tr>\n';
    
    for (const item of updatesByTool) {
      const latestDate = new Date(item.latest).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      summary += `<tr><td><b>${item._id}</b></td><td align="center">${item.count}</td><td align="right">${latestDate}</td></tr>\n`;
    }
    summary += '</table>\n\n';

    // Últimos updates
    summary += '## 📋 Latest Updates (Top 20)\n\n';
    summary += '<details>\n';
    summary += '<summary>Click to expand</summary>\n\n';
    summary += '| Date | Tool | Version | Description |\n';
    summary += '|------|------|---------|-------------|\n';
    
    for (const update of recentUpdates) {
      const dateStr = new Date(update.date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
      const versionShort = update.version.length > 50 
        ? update.version.substring(0, 50) + '...' 
        : update.version;
      const descShort = update.description 
        ? (update.description.length > 60 ? update.description.substring(0, 60) + '...' : update.description)
        : '-';
      summary += `| ${dateStr} | **${update.tool}** | ${versionShort} | ${descShort} |\n`;
    }
    summary += '\n</details>\n\n';

    // Links úteis
    summary += '## 🔗 Quick Links\n\n';
    summary += '- 🌐 **Frontend**: [afrikacrawlerapi.vercel.app](https://afrikacrawlerapi.vercel.app)\n';
    summary += '- 📡 **API Health**: [/api](https://afrikacrawlerapi.vercel.app/api)\n';
    summary += '- 📊 **API Updates**: [/api/updates](https://afrikacrawlerapi.vercel.app/api/updates)\n';
    summary += '- 💾 **Repository**: [GitHub](https://github.com/' + (process.env.GITHUB_REPOSITORY || 'Afrika-RCamargo-Tech/afrika_crawler_api') + ')\n\n';

    // Footer
    summary += '---\n\n';
    summary += '<p align="center"><i>Generated automatically by Afrika Crawler • ' + now.toISOString() + '</i></p>\n';

    // Escrever no GITHUB_STEP_SUMMARY
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      writeFileSync(summaryFile, summary);
      console.log('✅ Professional summary generated and added to GitHub Actions');
    } else {
      console.log(summary);
    }

    await disconnectDatabase();
  } catch (error: any) {
    // Summary de erro
    let errorSummary = '# ❌ Afrika Crawler - Execution Failed\n\n';
    errorSummary += '```diff\n';
    errorSummary += '- Crawler execution encountered an error\n';
    errorSummary += '```\n\n';
    errorSummary += '## 🐛 Error Details\n\n';
    errorSummary += '```\n';
    errorSummary += error.message || 'Unknown error';
    errorSummary += '\n```\n\n';
    
    if (error.stack) {
      errorSummary += '<details>\n';
      errorSummary += '<summary>Stack Trace</summary>\n\n';
      errorSummary += '```\n' + error.stack + '\n```\n';
      errorSummary += '</details>\n\n';
    }

    errorSummary += '## 🔧 Troubleshooting\n\n';
    errorSummary += '- Check if `MONGODB_URI` secret is properly configured\n';
    errorSummary += '- Verify network connectivity to MongoDB Atlas\n';
    errorSummary += '- Review crawler logs above for more details\n';
    errorSummary += '- Check if the target websites are accessible\n\n';

    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      writeFileSync(summaryFile, errorSummary);
    }
    
    console.error('❌ Error generating summary:', error);
    process.exit(1);
  }
}

generateSummary().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
