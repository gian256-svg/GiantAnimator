// server/dataTransformationService.ts
import _ from 'lodash';
import { type NormalizedTableData } from './tableParserService.js';

/**
 * Skill: Data Extraction & Transformation
 * Fornece ferramentas avançadas para manipular dados brutos antes da renderização.
 */
export const dataTransformationService = {
  /**
   * Limpa e normaliza dados detectando irregularidades
   */
  transform(data: NormalizedTableData): NormalizedTableData {
    console.log(`🧪 [Transformation] Processando ${data.rows.length} linhas...`);

    let transformedRows = [...data.rows];

    // 1. Remoção de linhas vazias ou corrompidas
    transformedRows = transformedRows.filter(row => {
      const values = Object.values(row);
      return values.some(v => v !== null && v !== undefined && v !== "");
    });

    // 2. Normalização de Nomes de Colunas (PascalCase para o componente)
    const columnMapping: Record<string, string> = {};
    data.headers.map(h => {
      const clean = _.camelCase(h);
      columnMapping[h] = clean;
      return h;
    });

    // 3. Outlier detection centralizado no tableParserService (3-sigma).
    console.log(`✅ [Transformation] ${transformedRows.length} linhas válidas após limpeza.`);

    return {
      ...data,
      rows: transformedRows,
      summary: {
          ...data.summary,
          totalRows: transformedRows.length
      }
    };
  },

  /**
   * Prepara os dados especificamente para o pipeline 4K (DPI scaling e units)
   */
  prepareFor4K(props: any): any {
    const p = { ...props };
    
    // Força Scale 1 se não definido (UHD compatibility)
    if (!p.scale) p.scale = 1;

    // Garante que cores sejam um array
    if (p.elementColors && !Array.isArray(p.elementColors)) {
        p.elementColors = [p.elementColors];
    }

    // 🛡️ Proteção de Transparência (Alpha Channel)
    if (p.backgroundType === 'transparent') {
        p.backgroundColor = 'transparent';
    } else if (p.backgroundColor === '#000000' || p.backgroundColor === '#000') {
        // Se a IA detectou preto puro, deixamos o tema decidir (evita P/B sem intenção)
        delete p.backgroundColor;
    }

    // 🇧🇷 Localização de Meses (EN -> PT-BR)
    return this.localizeLabels(p);
  },

  /**
   * Traduz automaticamente nomes e abreviações de meses para PT-BR
   */
  localizeLabels(props: any): any {
    const map: Record<string, string> = {
      'Jan': 'Jan', 'January': 'Jan',
      'Feb': 'Fev', 'February': 'Fev',
      'Mar': 'Mar', 'March': 'Mar',
      'Apr': 'Abr', 'April': 'Abr',
      'May': 'Mai',
      'Jun': 'Jun', 'June': 'Jun',
      'Jul': 'Jul', 'July': 'Jul',
      'Aug': 'Ago', 'August': 'Ago',
      'Sep': 'Set', 'Sept': 'Set', 'September': 'Set',
      'Oct': 'Out', 'October': 'Out',
      'Nov': 'Nov', 'November': 'Nov',
      'Dec': 'Dez', 'December': 'Dez'
    };

    const regex = new RegExp(`\\b(${Object.keys(map).join('|')})\\b`, 'gi');
    
    const translate = (text: any) => {
        if (typeof text !== 'string') return text;
        return text.replace(regex, (match) => {
            const key = Object.keys(map).find(k => k.toLowerCase() === match.toLowerCase());
            return key ? map[key] : match;
        });
    };

    if (props.labels) props.labels = props.labels.map((l: any) => translate(l));
    if (props.series) {
        props.series = props.series.map((s: any) => ({
            ...s,
            label: translate(s.label)
        }));
    }
    if (props.title) props.title = translate(props.title);
    if (props.subtitle) props.subtitle = translate(props.subtitle);
    if (props.xAxisTitle) props.xAxisTitle = translate(props.xAxisTitle);
    if (props.yAxisTitle) props.yAxisTitle = translate(props.yAxisTitle);

    return props;
  }
};
