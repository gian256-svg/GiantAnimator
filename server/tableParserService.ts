// server/tableParserService.ts
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// ── Delimitadores suportados (mesmos do Rainbow CSV) ──────────────────────────
const SUPPORTED_DELIMITERS = [',', ';', '\t', '|'] as const;
type Delimiter = typeof SUPPORTED_DELIMITERS[number];

/**
 * Detecta automaticamente o delimitador de um CSV.
 * Analisa as primeiras 5 linhas e escolhe o delimitador
 * com maior consistência de contagem entre elas.
 */
function detectDelimiter(content: string): Delimiter {
  const lines = content.split('\n').slice(0, 5).filter(l => l.trim().length > 0);
  if (lines.length === 0) return ',';

  let bestDelimiter: Delimiter = ',';
  let bestScore = -1;

  for (const delim of SUPPORTED_DELIMITERS) {
    const counts = lines.map(l => l.split(delim).length - 1);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    // Score: quantidade média de splits com baixa variância
    if (avg > 0 && (max - min) <= 1) {
      const score = avg * 10 - (max - min);
      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = delim;
      }
    }
  }

  return bestDelimiter;
}

export interface NormalizedTableData {
    headers: string[];
    rows: Record<string, string | number>[];
    /** Formato inferido: "wide" (1 col categoria + N numéricas) ou "long" */
    shape: 'wide' | 'long';
    /** Delimitador detectado (para exibir na UI) */
    detectedDelimiter?: string;
    /** Resumo para o Gemini decidir o tipo de gráfico */
    summary: {
        totalRows: number;
        totalCols: number;
        numericColumns: string[];
        categoricalColumns: string[];
        sample: Record<string, string | number>[];
    };
}

export const tableParserService = {

    parse(filePath: string): NormalizedTableData {
        const ext = path.extname(filePath).toLowerCase();

        let workbook: XLSX.WorkBook;

        if (ext === '.csv') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const delimiter = detectDelimiter(content);

            // Para delimitadores não-padrão (;, tab, |), precisamos informar ao XLSX
            if (delimiter === ',') {
                workbook = XLSX.read(content, { type: 'string' });
            } else {
                // Converte para CSV com vírgula para o XLSX entender
                const normalized = content
                    .split('\n')
                    .map(line => {
                        // Divide por delimitador e re-junta com vírgula, preservando aspas
                        return line.split(delimiter)
                            .map(cell => {
                                const v = cell.trim();
                                return v.includes(',') ? `"${v}"` : v;
                            })
                            .join(',');
                    })
                    .join('\n');
                workbook = XLSX.read(normalized, { type: 'string' });
            }

            // Guarda o delimitador detectado para retornar ao chamador
            (workbook as any)._detectedDelimiter = delimiter;
        } else {
            // .xlsx, .xls, .ods
            workbook = XLSX.readFile(filePath);
        }

        // Usa a primeira aba
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converte para array de objetos
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
            sheet,
            { defval: 0 }
        );

        if (rows.length === 0) {
            throw new Error('Planilha vazia ou sem dados reconhecíveis.');
        }

        const headers = Object.keys(rows[0]);

        // Detecta colunas numéricas vs categóricas
        const numericColumns: string[] = [];
        const categoricalColumns: string[] = [];

        headers.forEach(h => {
            const values = rows.map(r => r[h]);
            const isNumeric = values.every(v => v !== '' && !isNaN(Number(v)));
            if (isNumeric) {
                numericColumns.push(h);
            } else {
                categoricalColumns.push(h);
            }
        });

        // Infere shape
        const shape: 'wide' | 'long' =
            categoricalColumns.length >= 1 && numericColumns.length >= 1
                ? 'wide'
                : 'long';

        return {
            headers,
            rows,
            shape,
            detectedDelimiter: (workbook as any)._detectedDelimiter,
            summary: {
                totalRows: rows.length,
                totalCols: headers.length,
                numericColumns,
                categoricalColumns,
                // Máximo 5 linhas de amostra para o prompt
                sample: rows.slice(0, 5),
            }
        };
    },

    /**
     * Converte dados normalizados para o formato que o Remotion espera:
     * { label: string, value: number }[]
     * Para múltiplas séries: { label: string, values: number[] }[]
     */
    toChartData(
        parsed: NormalizedTableData,
        labelColumn?: string,
        valueColumns?: string[]
    ): { label: string; value: number }[] | { label: string; values: number[] }[] {

        const labelCol = labelColumn ?? parsed.summary.categoricalColumns[0] ?? parsed.headers[0];
        const valCols  = valueColumns  ?? parsed.summary.numericColumns;

        if (valCols.length === 1) {
            // Série única → formato simples
            return parsed.rows.map(row => ({
                label: String(row[labelCol]),
                value: Number(row[valCols[0]])
            }));
        }

        // Múltiplas séries
        return parsed.rows.map(row => ({
            label: String(row[labelCol]),
            values: valCols.map((col: string) => Number(row[col]))
        }));
    }
};
