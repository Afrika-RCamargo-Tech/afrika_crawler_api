import { connectToDatabase, disconnectDatabase } from '../src/database';
import { UpdateModel } from '../src/models/Update';
import { writeFileSync } from 'fs';

async function generateSummary() {
  await connectToDatabase();

  // Total de updates
  const totalUpdates = await UpdateModel.countDocuments();

  // Últimos 20 updates por data
  const recentUpdates = await UpdateModel.find()
    .sort({ date: -1 })
    .limit(20)
    .select('tool version date description');

  // Contagem por ferramenta
  const updatesByTool = await UpdateModel.aggregate([
    {
      $group: {
        _id: '$tool',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Gerar markdown para o GitHub Actions Summary
  let summary = '# 📊 Afrika Crawler - Update Summary\n\n';
  
  summary += `## 📈 Statistics\n\n`;
  summary += `- **Total Updates**: ${totalUpdates}\n`;
  summary += `- **Last Run**: ${new Date().toISOString()}\n\n`;

  summary += `### Updates by Tool\n\n`;
  summary += `| Tool | Count |\n`;
  summary += `|------|-------|\n`;
  for (const item of updatesByTool) {
    summary += `| ${item._id} | ${item.count} |\n`;
  }
  summary += '\n';

  summary += `## 🆕 Last 20 Updates\n\n`;
  summary += `| Date | Tool | Version |\n`;
  summary += `|------|------|----------|\n`;
  
  for (const update of recentUpdates) {
    const dateStr = update.date.toISOString().split('T')[0];
    const versionShort = update.version.length > 60 
      ? update.version.substring(0, 60) + '...' 
      : update.version;
    summary += `| ${dateStr} | ${update.tool} | ${versionShort} |\n`;
  }

  // Escrever no GITHUB_STEP_SUMMARY (variável de ambiente do GitHub Actions)
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    writeFileSync(summaryFile, summary);
    console.log('✅ Summary gerado e adicionado ao GitHub Actions');
  } else {
    // Se não estiver no GitHub Actions, apenas imprime
    console.log(summary);
  }

  await disconnectDatabase();
}

generateSummary().catch((error) => {
  console.error('❌ Erro ao gerar summary:', error);
  process.exit(1);
});
