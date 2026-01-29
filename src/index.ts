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
    let globalIndex = 0;
    const totalUpdates = updates.length;
    const numDigits = totalUpdates.toString().length;

    for (const update of updates) {
      globalIndex++;
      
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
          console.log('│');
        }
        
        currentCategory = category;
        console.log(`├── 📂 ${category}`);
      }

      let updateType: 'new' | 'updated' | 'unchanged' = 'unchanged';
      let statusIcon = '○';

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
          statusIcon = '📝';
          updatedCount++;
        } else {
          updateType = 'unchanged';
          statusIcon = '○';
          unchangedCount++;
        }
      } else {
        await UpdateModel.create(newData);
        updateType = 'new';
        statusIcon = '✨';
        newCount++;
      }

      // Formatar número com zeros à esquerda
      const numberStr = globalIndex.toString().padStart(numDigits, '0');
      
      // Formatar data
      const updateDate = new Date(update.date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
      
      // Truncar versão se muito longa
      const maxLength = 50;
      const truncated = versionOnly.length > maxLength 
        ? versionOnly.substring(0, maxLength - 3) + '...' 
        : versionOnly;
      
      // Exibir linha do update
      console.log(`│   ├── [${numberStr}] ${statusIcon} ${updateDate} - ${truncated}`);
      if (update.link) {
        console.log(`│   │       🔗 ${update.link}`);
    }

    console.log('│');
    console.log(`📊 Summary: ${newCount} new, ${updatedCount} updated, ${unchangedCount} unchanged\n`);
  }

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Crawler finalizado com sucesso                            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  await disconnectDatabase();
  process.exit(0);
}

run();