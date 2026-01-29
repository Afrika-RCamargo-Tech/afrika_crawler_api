import { SdElementsFetcher } from '../src/strategies/SdElementsFetcher';

async function testSdElements() {
  console.log('🧪 Testando SD Elements Fetcher...\n');
  
  const fetcher = new SdElementsFetcher();
  const updates = await fetcher.fetchUpdates();
  
  console.log('\n=== RESULTADOS ===');
  console.log(`Total de releases encontrados: ${updates.length}\n`);
  
  for (const update of updates) {
    console.log(`📦 ${update.version}`);
    console.log(`   📅 ${update.date.toISOString().split('T')[0]}`);
    console.log(`   🔗 ${update.link}`);
    console.log(`   📝 ${update.description.substring(0, 100)}...`);
    console.log('');
  }
}

testSdElements().catch(console.error);
