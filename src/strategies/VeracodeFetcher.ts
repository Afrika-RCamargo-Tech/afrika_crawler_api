import axios from 'axios';
import * as cheerio from 'cheerio';
import type { IUpdateFetcher, SimpleUpdateData } from '../interfaces/IUpdateFetcher';

export class VeracodeFetcher implements IUpdateFetcher {
  readonly toolName = 'Veracode';
  
  // URLs de updates do Veracode
  private readonly urls = [
    'https://docs.veracode.com/updates/r/Veracode_CLI_Updates',
    'https://docs.veracode.com/updates/r/c_all_was',
    'https://docs.veracode.com/updates/r/EASM_updates',
    'https://docs.veracode.com/updates/r/Fix_updates',
    'https://docs.veracode.com/updates/r/c_all_int',
    'https://docs.veracode.com/updates/r/Package_firewall_updates',
    'https://docs.veracode.com/updates/r/c_all_platform',
    'https://docs.veracode.com/updates/r/c_all_sca',
    'https://docs.veracode.com/updates/r/c_all_static',
    'https://docs.veracode.com/updates/r/c_all_training',
    'https://docs.veracode.com/updates/r/VRM_updates'
  ];

  async fetchUpdates(): Promise<SimpleUpdateData[]> {
    console.log(`[${this.toolName}] Iniciando raspagem...`);
    const allUpdates: SimpleUpdateData[] = [];

    try {
      // Buscar updates de cada URL
      for (const url of this.urls) {
        console.log(`[${this.toolName}] Buscando: ${url}`);
        const updates = await this.fetchUpdatesFromUrl(url);
        allUpdates.push(...updates);
      }

      console.log(`[${this.toolName}] Total encontrado: ${allUpdates.length}`);
      return allUpdates;
    } catch (error) {
      console.error(`[${this.toolName}] Erro:`, error);
      return allUpdates;
    }
  }

  private async fetchUpdatesFromUrl(url: string): Promise<SimpleUpdateData[]> {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const updates: SimpleUpdateData[] = [];

      // Pegar o título da página (categoria)
      const pageTitle = $('h1').first().text().trim();

      // Encontrar todos os headings h2 que contém as datas
      $('h2').each((_, dateElement) => {
        const dateText = $(dateElement).text().trim();
        
        // Verificar se é um heading de data (formato: "January 20, 2026")
        const dateMatch = dateText.match(/^([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})/);
        if (!dateMatch) return;

        const [, month, day, year] = dateMatch;
        const monthMap: { [key: string]: number } = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
          'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        // Criar data em UTC para garantir consistência independente do timezone
        const date = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day)));
        
        // Pegar todos os headings h3 que vêm depois dessa data até o próximo h2
        let currentElement = $(dateElement).next();
        
        while (currentElement.length && currentElement.prop('tagName') !== 'H2') {
          if (currentElement.prop('tagName') === 'H3') {
            const titleElement = currentElement;
            const title = titleElement.text().trim()
              .replace(/Direct link to.*$/i, '') // Remove o "Direct link to..." do final
              .replace(/#$/, '') // Remove # do final
              .trim();
            
            // Pegar o parágrafo seguinte como descrição
            let description = '';
            let nextElem = titleElement.next();
            
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
}