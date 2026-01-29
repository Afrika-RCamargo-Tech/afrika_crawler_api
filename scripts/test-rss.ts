/**
 * Script para testar o fetcher RSS híbrido do Veracode
 * Execução: bun run scripts/test-rss.ts
 */

import { VeracodeRssFetcher } from '../src/strategies/VeracodeRssFetcher';

async function testRss() {
  console.log('🧪 Testando Veracode RSS Hybrid Fetcher...\n');
  
  const fetcher = new VeracodeRssFetcher();
  
  try {
    const startTime = Date.now();
    const updates = await fetcher.fetchUpdates();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n📋 Resultados:');
    console.log(`   Total de updates encontrados: ${updates.length}`);
    console.log(`   Tempo de execução: ${duration}s`);
    console.log('');
    
    if (updates.length > 0) {
      // Agrupar por categoria
      const byCategory = new Map<string, typeof updates>();
      for (const update of updates) {
        const category = update.version.split(' - ')[0] || 'Outros';
        if (!byCategory.has(category)) {
          byCategory.set(category, []);
        }
        byCategory.get(category)!.push(update);
      }
      
      console.log('📊 Updates por categoria:');
      console.log('─'.repeat(50));
      for (const [category, items] of byCategory) {
        console.log(`   ${category}: ${items.length} updates`);
      }
      
      console.log('\n📝 Últimos 5 updates:');
      console.log('─'.repeat(80));
      
      // Ordenar por data decrescente
      const sorted = [...updates].sort((a, b) => b.date.getTime() - a.date.getTime());
      
      sorted.slice(0, 5).forEach((update, index) => {
        console.log(`\n[${index + 1}] ${update.version}`);
        console.log(`    📅 Data: ${update.date.toISOString().split('T')[0]}`);
        console.log(`    📄 Descrição: ${update.description.substring(0, 100)}${update.description.length > 100 ? '...' : ''}`);
      });
      
      console.log('\n' + '─'.repeat(80));
      console.log('\n✅ RSS Hybrid Fetcher funcionando corretamente!');
    } else {
      console.log('⚠️  Nenhum update encontrado.');
    }
  } catch (error) {
    console.error('❌ Erro ao testar:', error);
    process.exit(1);
  }
}

testRss();
