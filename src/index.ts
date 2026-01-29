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

async function run() {
  await connectToDatabase();

  console.log("🚀 Iniciando Crawler...\n");

  for (const strategy of strategies) {
    console.log(`╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  📦 ${strategy.toolName.padEnd(58)}║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    const updates = await strategy.fetchUpdates();
    
    let newCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    
    // Agrupar por categoria para exibição hierárquica
    let currentCategory = '';
    let categoryNewCount = 0;
    let categoryUpdatedCount = 0;
    let itemsInCategory = 0;

    for (const update of updates) {
      // Cria ID único baseado em hash de tool + date + version
      const dateStr = update.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hashInput = `${strategy.toolName}:${dateStr}:${update.version}`;
      const uniqueId = createHash('sha256')
        .update(hashInput)
        .digest('hex')
        .substring(0, 16);

      // Verifica se já existe
      const existing = await UpdateModel.findOne({ uniqueId });
      
      const newData = {
        ...update,
        tool: strategy.toolName,
        uniqueId: uniqueId
      };

      // Extrai categoria do version
      const categoryMatch = update.version.match(/^([^-]+) -/);
      const category = categoryMatch ? categoryMatch[1].trim() : 'General';
      const versionOnly = update.version.replace(/^[^-]+ - /, '');

      // Se mudou de categoria, exibe header da nova categoria
      if (category !== currentCategory) {
        // Se tinha categoria anterior, fecha ela
        if (currentCategory) {
          console.log('');
        }
        
        currentCategory = category;
        categoryNewCount = 0;
        categoryUpdatedCount = 0;
        itemsInCategory = 0;
        console.log(`├── 📂 ${category}`);
      }

      let updateType: 'new' | 'updated' | 'skipped' = 'skipped';

      // Processa o update
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
          updateType = 'updated';
          updatedCount++;
          categoryUpdatedCount++;
        } else {
          unchangedCount++;
        }
      } else {
        await UpdateModel.create(newData);
        updateType = 'new';
        newCount++;
        categoryNewCount++;
      }

      // Exibir apenas se for novo ou atualizado
      if (updateType !== 'skipped') {
        itemsInCategory++;
        const icon = updateType === 'new' ? '✨' : '📝';
        const truncated = versionOnly.length > 55 
          ? versionOnly.substring(0, 52) + '...' 
          : versionOnly;
        
        // Limitar a 5 itens por categoria para não poluir
        if (itemsInCategory <= 5) {
          console.log(`│   ├── ${icon} ${truncated}`);
        } else if (itemsInCategory === 6) {
          console.log(`│   └── ... (showing first 5, ${categoryNewCount + categoryUpdatedCount - 5} more in this category)`);
        }
      }
    }

    console.log('');
    console.log(`📊 Summary: ${newCount} new, ${updatedCount} updated, ${unchangedCount} unchanged\n`);
  }

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Crawler finalizado com sucesso                            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  await disconnectDatabase();
  process.exit(0);
}

run();