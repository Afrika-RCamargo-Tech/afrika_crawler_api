import axios from 'axios';
import * as cheerio from 'cheerio';
import type { IUpdateFetcher, SimpleUpdateData } from '../interfaces/IUpdateFetcher';

/**
 * Fetcher para SD Elements Release Notes
 * Extrai os release notes da documentação oficial do SD Elements
 * URL: https://docs.sdelements.com/master/guide/docs/release_notes/
 */
export class SdElementsFetcher implements IUpdateFetcher {
  readonly toolName = 'SD Elements';
  
  private readonly releaseNotesUrl = 'https://docs.sdelements.com/master/guide/docs/release_notes/';
  
  // URLs das páginas de anos anteriores para busca completa
  private readonly yearUrls = [
    'https://docs.sdelements.com/master/guide/docs/release_notes/', // Current year
    'https://docs.sdelements.com/master/guide/docs/release_notes/2024.html',
    'https://docs.sdelements.com/master/guide/docs/release_notes/2023.html',
  ];

  async fetchUpdates(): Promise<SimpleUpdateData[]> {
    console.log(`[${this.toolName}] Buscando release notes...`);
    
    const allUpdates: SimpleUpdateData[] = [];
    
    for (const url of this.yearUrls) {
      try {
        console.log(`[${this.toolName}] Buscando: ${url}`);
        const updates = await this.fetchUpdatesFromPage(url);
        allUpdates.push(...updates);
      } catch (error) {
        console.error(`[${this.toolName}] Erro ao buscar ${url}:`, error);
      }
    }
    
    console.log(`[${this.toolName}] Total de updates encontrados: ${allUpdates.length}`);
    return allUpdates;
  }

  /**
   * Extrai os release notes de uma página específica
   */
  private async fetchUpdatesFromPage(url: string): Promise<SimpleUpdateData[]> {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; Afrika-Crawler/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 60000 // 60 segundos de timeout
    });
    
    console.log(`[${this.toolName}] Página carregada: ${url} (${data.length} bytes)`);
    
    const $ = cheerio.load(data);
    const updates: SimpleUpdateData[] = [];
    
    // Encontrar todos os headings de versão (h2 com IDs como "20254", "20253", etc)
    $('h2[id]').each((_, element) => {
      const h2 = $(element);
      const id = h2.attr('id');
      
      // Verificar se é um ID de versão (formato: 20241, 20242, etc)
      if (!id || !/^\d{4,5}$/.test(id)) {
        return;
      }
      
      // Extrair versão do texto (ex: "2025.4")
      const versionText = h2.text().replace('Anchor', '').trim();
      
      // Encontrar a data (próximo parágrafo após o heading)
      let dateElement = h2.next();
      while (dateElement.length && !dateElement.is('p')) {
        dateElement = dateElement.next();
      }
      const dateText = dateElement.text().trim();
      let date = this.parseDate(dateText);
      
      // Se não encontrar data no formato esperado, estimar baseado na versão
      if (!date) {
        date = this.estimateDateFromVersion(versionText);
        if (!date) {
          console.log(`[${this.toolName}] Data não encontrada para versão ${versionText}`);
          return;
        }
      }
      
      // Extrair as features principais
      const features = this.extractFeatures($, id);
      
      // Criar descrição resumida
      const description = this.createDescription(features);
      
      // Construir link correto
      const link = url + '#' + id;
      
      updates.push({
        version: versionText,
        date,
        description,
        link
      });
    });
    
    return updates;
  }

  /**
   * Extrai as features de uma versão específica
   */
  private extractFeatures($: cheerio.CheerioAPI, versionId: string): string[] {
    const features: string[] = [];
    
    // Encontrar o heading h2 da versão
    const versionHeading = $(`h2#${versionId}`);
    if (!versionHeading.length) return features;
    
    // Percorrer os elementos após o heading até encontrar o próximo h2
    let current = versionHeading.next();
    let foundFeaturesList = false;
    
    while (current.length && !current.is('h2')) {
      // Procurar por parágrafo com "New features and enhancements"
      if (current.is('p') && current.text().includes('New features and enhancements')) {
        foundFeaturesList = true;
        // O próximo elemento deve ser a lista de features
        const nextList = current.next();
        if (nextList.is('ul')) {
          nextList.children('li').each((index, li) => {
            if (index < 5) { // Limitar a 5 features
              // Primeiro filho p contém o título da feature
              const title = $(li).children('p').first().text().trim();
              if (title) {
                features.push(title);
              }
            }
          });
          break;
        }
      }
      
      // Fallback: se for uma lista ul logo após a data, extrair features diretamente
      if (!foundFeaturesList && current.is('ul')) {
        current.children('li').each((index, li) => {
          if (index < 5) {
            const title = $(li).children('p').first().text().trim() || $(li).text().split('\n')[0].trim();
            if (title && title.length < 100) {
              features.push(title);
            }
          }
        });
        if (features.length > 0) break;
      }
      
      current = current.next();
    }
    
    return features;
  }

  /**
   * Cria uma descrição resumida a partir das features
   */
  private createDescription(features: string[]): string {
    if (features.length === 0) {
      return 'New release with improvements and fixes.';
    }
    
    // Listar as principais features (limitar tamanho)
    const mainFeatures = features.slice(0, 3).map(f => {
      // Limitar cada feature a 50 caracteres
      return f.length > 50 ? f.substring(0, 47) + '...' : f;
    });
    
    let description = mainFeatures.join('; ');
    
    if (features.length > 3) {
      description += ` (+${features.length - 3} more)`;
    }
    
    return description;
  }

  /**
   * Faz o parse de datas no formato "Month Day, Year"
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Formatos suportados:
    // "January 10, 2026"
    // "September 27, 2025"
    const months: { [key: string]: number } = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    
    const regex = /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i;
    const match = regex.exec(dateStr);
    if (!match) return null;
    
    const monthStr = match[1];
    const dayStr = match[2];
    const yearStr = match[3];
    
    if (!monthStr || !dayStr || !yearStr) return null;
    
    const month = months[monthStr.toLowerCase()];
    
    if (month === undefined) return null;
    
    const day = Number.parseInt(dayStr, 10);
    const year = Number.parseInt(yearStr, 10);
    
    return new Date(year, month, day);
  }

  /**
   * Estima a data de release baseado no número da versão
   * Exemplo: 2023.4 = Q4 2023 = Dezembro 2023
   */
  private estimateDateFromVersion(version: string): Date | null {
    const match = /(\d{4})\.(\d+)/.exec(version);
    if (!match) return null;
    
    const year = Number.parseInt(match[1], 10);
    const quarter = Number.parseInt(match[2], 10);
    
    // Estimar mês baseado no trimestre
    // Q1 = Março, Q2 = Junho, Q3 = Setembro, Q4 = Dezembro
    const quarterMonths: { [key: number]: number } = {
      1: 2,  // Março
      2: 5,  // Junho
      3: 8,  // Setembro
      4: 11  // Dezembro
    };
    
    const month = quarterMonths[quarter];
    if (month === undefined) return null;
    
    // Usar o último dia do mês como data estimada
    return new Date(year, month, 15);
  }
}
