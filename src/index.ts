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

  console.log("🚀 Iniciando Crawler...");

  for (const strategy of strategies) {
    const updates = await strategy.fetchUpdates();

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
          console.log(`📝 Atualizado: ${strategy.toolName} - ${update.version.substring(0, 50)}...`);
        }
      } else {
        // Novo registro
        await UpdateModel.create(newData);
        console.log(`✨ Novo: ${strategy.toolName} - ${update.version.substring(0, 50)}...`);
      }
    }
  }

  console.log("🏁 Finalizado com sucesso.");
  await disconnectDatabase();
  process.exit(0);
}

run();