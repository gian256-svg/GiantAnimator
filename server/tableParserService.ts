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
        unit?: string;
        sample: Record<string, string | number>[];
    };
}

export const tableParserService = {

    parse(filePath: string): NormalizedTableData {
        console.log(`📊 [Parser] Iniciando análise: ${path.basename(filePath)}`);
        const ext = path.extname(filePath).toLowerCase();

        let workbook: XLSX.WorkBook;

        if (ext === '.csv') {
            const buffer = fs.readFileSync(filePath);
            const content = buffer.toString('binary'); 
            const delimiter = detectDelimiter(content);
            console.log(`📌 [Parser] CSV Detectado. Delimitador: "${delimiter}"`);
            
            // Usamos o motor do XLSX com o Field Separator (FS) detectado
            workbook = XLSX.read(buffer, { 
                type: 'buffer', 
                FS: delimiter 
            });

            (workbook as any)._detectedDelimiter = delimiter;
        } else {
            // .xlsx, .xls, .ods
            workbook = XLSX.readFile(filePath);
        }

        // Usa a primeira aba
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        console.log(`📖 [Parser] Lendo aba: ${sheetName}`);

        // Converte para array de objetos
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
            sheet,
            { defval: 0, blankrows: false, raw: false }
        );
        console.log(`✅ [Parser] ${rows.length} linhas extraídas.`);

        if (!rows || rows.length === 0) {
            throw new Error('Não foi possível extrair dados desta planilha. Verifique se o arquivo possui cabeçalhos e valores numéricos.');
        }

        const headers = Object.keys(rows[0]);
        let detectedUnit = '';
        
        // Detecta colunas numéricas vs categóricas
        const numericColumns: string[] = [];
        const categoricalColumns: string[] = [];

        headers.forEach(h => {
            const values = rows.map(r => r[h]);
            
            // Tenta detectar se a coluna é numérica mesmo com símbolos (%, $, etc)
            let columnUnit = '';
            const isNumeric = values.every(v => {
                if (v === '' || v === null || v === undefined) return true;
                const s = String(v).trim();
                const cleaned = s.replace(/[%\$]|R\$/g, '').replace(',', '.').trim();
                if (s.includes('%')) columnUnit = '%';
                else if (s.includes('$')) columnUnit = '$';
                // Retorna true se for numérico apo's limpeza
                return !isNaN(Number(cleaned)) && cleaned !== '';
            });

            if (isNumeric) {
                numericColumns.push(h);
                if (columnUnit) detectedUnit = columnUnit;
            } else {
                categoricalColumns.push(h);
            }
        });

        // Se não detectou nos valores, tenta nos headers
        if (!detectedUnit) detectedUnit = detectUnitInHeaders(headers);

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
                unit: detectedUnit,
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

/**
 * Tenta detectar uma unidade de medida comum nos headers.
 */
function detectUnitInHeaders(headers: string[]): string {
  const units = ['%', '$', 'R$', '€', '£', 'bpm', 'kg', 'm', 'km', '°C', '°F'];
  for (const h of headers) {
    for (const u of units) {
      if (h.includes(`(${u})`) || h.includes(` ${u}`) || h.endsWith(u)) {
        return u;
      }
    }
  }
  return '';
}
