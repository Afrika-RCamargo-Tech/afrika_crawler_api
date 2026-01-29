import { connectToDatabase, disconnectDatabase } from './database';
import { VeracodeFetcher } from './strategies/VeracodeFetcher';
import { UpdateModel } from './models/Update';
import { createHash } from 'crypto';

// Lista de estratégias ativas
const strategies = [
  new VeracodeFetcher(),
  // new SaltFetcher(), 
  // new SdElementsFetcher()
];

interface UpdateResult {
  type: 'new' | 'updated' | 'skipped';
  category: string;
  version: string;
}

async function run() {
  await connectToDatabase();

  console.log("🚀 Iniciando Crawler...\n");

  for (const strategy of strategies) {
    const updates = await strategy.fetchUpdates();
    
    // Agrupar resultados por categoria para exibição organizada
    const results: { [category: string]: UpdateResult[] } = {};
    let newCount = 0;
    let updatedCount = 0;

    for (const update of updates) {
      // Cria ID único baseado em hash de tool + date + version
      const dateStr = update.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hashInput = `${strategy.toolName}:${dateStr}:${update.version}`;
      const uniqueId = createHash('sha256')
        .update(hashInput)
        .digest('hex')
        .substring(0, 16); // Usa apenas os primeiros 16 caracteres do hash

      // Verifica se já existe
      const existing = await UpdateModel.findOne({ uniqueId });
      
      const newData = {
        ...update,
        tool: strategy.toolName,
        uniqueId: uniqueId
      };

      // Extrai categoria do version (ex: "CLI updates - Veracode CLI v2.44.0" -> "CLI updates")
      const categoryMatch = update.version.match(/^([^-]+) -/);
      const category = categoryMatch ? categoryMatch[1].trim() : 'General';
      const versionOnly = update.version.replace(/^[^-]+ - /, '');

      if (!results[category]) {
        results[category] = [];
      }

      // Só atualiza se houver mudanças no conteúdo
      if (existing) {
        const hasChanges = 
          existing.description !== newData.description ||
          existing.link !== newData.link ||
          existing.version !== newData.version;
        
        if (hasChanges) {
          await UpdateModel.findOneAndUpdate(
            { uniqueId },
            newData,
            { new: true }
          );
          results[category].push({ type: 'updated', category, version: versionOnly });
          updatedCount++;
        } else {
          results[category].push({ type: 'skipped', category, version: versionOnly });
        }
      } else {
        // Novo registro
        await UpdateModel.create(newData);
        results[category].push({ type: 'new', category, version: versionOnly });
        newCount++;
      }
    }

    // Exibir resultados de forma organizada e profissional
    console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  📦 ${strategy.toolName.padEnd(58)}║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    const categories = Object.keys(results).sort();
    const totalCategories = categories.length;

    categories.forEach((category, catIndex) => {
      const isLastCategory = catIndex === totalCategories - 1;
      const categoryPrefix = isLastCategory ? '└──' : '├──';
      const itemPrefix = isLastCategory ? '    ' : '│   ';
      
      const categoryUpdates = results[category];
      const newInCategory = categoryUpdates.filter(u => u.type === 'new').length;
      const updatedInCategory = categoryUpdates.filter(u => u.type === 'updated').length;
      
      let categoryLabel = `📂 ${category}`;
      if (newInCategory > 0 || updatedInCategory > 0) {
        const badges = [];
        if (newInCategory > 0) badges.push(`✨ ${newInCategory} new`);
        if (updatedInCategory > 0) badges.push(`📝 ${updatedInCategory} updated`);
        categoryLabel += ` (${badges.join(', ')})`;
      }
      
      console.log(`${categoryPrefix} ${categoryLabel}`);

      // Mostrar apenas os novos e atualizados (não os skipped)
      const relevantUpdates = categoryUpdates.filter(u => u.type !== 'skipped');
      const displayLimit = 5; // Limitar exibição para não poluir
      const updatesToShow = relevantUpdates.slice(0, displayLimit);
      const remaining = relevantUpdates.length - displayLimit;

      updatesToShow.forEach((result, idx) => {
        const isLast = idx === updatesToShow.length - 1 && remaining <= 0;
        const updatePrefix = isLast ? '└──' : '├──';
        const icon = result.type === 'new' ? '✨' : '📝';
        const truncated = result.version.length > 55 
          ? result.version.substring(0, 52) + '...' 
          : result.version;
        console.log(`${itemPrefix}${updatePrefix} ${icon} ${truncated}`);
      });

      if (remaining > 0) {
        console.log(`${itemPrefix}└── ... and ${remaining} more`);
      }

      console.log('');
    });

    console.log(`📊 Summary: ${newCount} new, ${updatedCount} updated, ${updates.length - newCount - updatedCount} unchanged\n`);
  }

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Crawler finalizado com sucesso                            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  await disconnectDatabase();
  process.exit(0);
}

run();