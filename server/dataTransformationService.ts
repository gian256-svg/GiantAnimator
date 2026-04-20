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
    const newHeaders = data.headers.map(h => {
      const clean = _.camelCase(h);
      columnMapping[h] = clean;
      return h; // Mantemos o label original no header para UI
    });

    // 3. Outlier detection centralizado no tableParserService (3-sigma).
    // Aqui apenas logamos o número de linhas após limpeza.
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

    return p;
  }
};
