import axios from 'axios';
import * as cheerio from 'cheerio';
import type { IUpdateFetcher, SimpleUpdateData } from '../interfaces/IUpdateFetcher';

/**
 * Fetcher híbrido para Veracode: usa RSS para descobrir categorias,
 * depois faz crawling das páginas individuais para extrair os updates.
 * 
 * Vantagem: se a Veracode adicionar novas categorias, o sistema pega automaticamente.
 */
export class VeracodeRssFetcher implements IUpdateFetcher {
  readonly toolName = 'Veracode';
  
  private readonly rssUrl = 'https://docs.veracode.com/updates/rss.xml';
  
  // URLs a ignorar (páginas informativas, não de updates)
  private readonly ignoredUrls = [
    'c_release_notes' // Página "About product updates" - só informações gerais
  ];

  async fetchUpdates(): Promise<SimpleUpdateData[]> {
    console.log(`[${this.toolName}] Buscando categorias via RSS...`);
    
    try {
      // 1. Buscar RSS para descobrir URLs das categorias
      const { data: rssData } = await axios.get(this.rssUrl, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Afrika-Crawler/1.0'
        }
      });
      
      const categoryUrls = this.extractCategoryUrls(rssData);
      console.log(`[${this.toolName}] Encontradas ${categoryUrls.length} categorias via RSS`);
      
      // 2. Fazer crawling de cada categoria
      const allUpdates: SimpleUpdateData[] = [];
      
      for (const url of categoryUrls) {
        console.log(`[${this.toolName}] Buscando: ${url}`);
        const updates = await this.fetchUpdatesFromPage(url);
        allUpdates.push(...updates);
      }
      
      console.log(`[${this.toolName}] Total de updates encontrados: ${allUpdates.length}`);
      return allUpdates;
      
    } catch (error) {
      console.error(`[${this.toolName}] Erro ao buscar RSS:`, error);
      return [];
    }
  }

  /**
   * Extrai as URLs das categorias do feed RSS
   */
  private extractCategoryUrls(xmlData: string): string[] {
    const $ = cheerio.load(xmlData, { xmlMode: true });
    const urls: string[] = [];

    $('item').each((_, element) => {
      const link = $(element).find('link').first().text().trim();
      
      if (link && !this.ignoredUrls.some(ignored => link.includes(ignored))) {
        urls.push(link);
      }
    });

    return urls;
  }

  /**
   * Faz crawling de uma página de categoria para extrair os updates individuais
   */
  private async fetchUpdatesFromPage(url: string): Promise<SimpleUpdateData[]> {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Afrika-Crawler/1.0' }
      });
      const $ = cheerio.load(data);
      const updates: SimpleUpdateData[] = [];

      // Pegar o título da página (categoria)
      const pageTitle = $('h1').first().text().trim();

      // Encontrar todos os headings h2 que contém as datas
      $('h2').each((_, dateElement) => {
        const dateText = $(dateElement).text().trim();
        
        // Verificar se é um heading de data (formato: "January 20, 2026")
        const date = this.parseDate(dateText);
        if (!date) return;

        // Pegar todos os headings h3 que vêm depois dessa data até o próximo h2
        let currentElement = $(dateElement).next();
        
        while (currentElement.length && currentElement.prop('tagName') !== 'H2') {
          if (currentElement.prop('tagName') === 'H3') {
            const title = currentElement.text().trim()
              .replace(/Direct link to.*$/i, '')
              .replace(/#$/, '')
              .trim();
            
            // Pegar o parágrafo seguinte como descrição
            let description = '';
            const nextElem = currentElement.next();
            
            if (nextElem.prop('tagName') === 'P') {
              description = nextElem.text().trim();
            }

            if (title) {
              updates.push({
                version: `${pageTitle} - ${title}`,
                date: date,
                description: description,
                link: url
              });
            }
          }
          
          currentElement = currentElement.next();
        }
      });

      console.log(`[${this.toolName}] Encontrados ${updates.length} updates em ${url}`);
      return updates;
    } catch (error) {
      console.error(`[${this.toolName}] Erro ao buscar ${url}:`, error);
      return [];
    }
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Formato esperado: "January 20, 2026"
    const monthNameMatch = dateStr.match(/^([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (!monthNameMatch) return null;

    const [, month, day, year] = monthNameMatch;
    const monthMap: { [key: string]: number } = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11,
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Sept': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const monthIndex = monthMap[month!];
    if (monthIndex === undefined) return null;

    // Criar data ao meio-dia UTC para evitar problemas de timezone
    return new Date(Date.UTC(parseInt(year!), monthIndex, parseInt(day!), 12, 0, 0));
  }
}
