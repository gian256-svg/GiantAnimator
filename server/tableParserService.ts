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
            let content = "";
            try { content = buffer.toString('utf-8'); } catch { content = buffer.toString('latin1'); }

            const delimiter = detectDelimiter(content);
            console.log(`📌 [Parser] CSV Detectado. Delimitador: "${delimiter}"`);
            
            try {
                // Tentativa 1: XLSX
                workbook = XLSX.read(content, { type: 'string', FS: delimiter });
            } catch (err) {
                console.error("⚠️ [Parser] XLSX falhou. Usando Fallback Manual...", err);
                // Fallback: Leitura manual pura
                const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
                const headers = lines[0].split(delimiter).map(h => h.trim());
                const rows = lines.slice(1).map(line => {
                    const values = line.split(delimiter);
                    const obj: any = {};
                    headers.forEach((h, i) => {
                        let v = (values[i] || "").trim();
                        const num = Number(v.replace(/[%\$]|R\$/g, '').replace(',', '.'));
                        obj[h] = !isNaN(num) && v !== "" ? num : v;
                    });
                    return obj;
                });

                const summary = internalGenerateSummary(rows, headers);
                return {
                    headers,
                    rows,
                    summary,
                    shape: internalDetectShape(summary),
                    detectedDelimiter: delimiter
                };
            }

            (workbook as any)._detectedDelimiter = delimiter;
        } else {
            // .xlsx, .xls, .ods
            workbook = XLSX.readFile(filePath);
        }

        // Usa a primeira aba
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        console.log(`📖 [Parser] Lendo aba: ${sheetName}`);

        // Converte para array de objetos com limpeza agressiva
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { 
            defval: '', 
            blankrows: false, 
            raw: false 
        });

        // Limpeza de chaves e valores (Remover %, $, etc dos nomes das colunas e valores)
        const rows = rawRows.map(row => {
            const newRow: Record<string, string | number> = {};
            for (const key in row) {
                // Limpa a chave (header)
                const cleanKey = key.trim();
                let val = row[key];
                
                if (typeof val === 'string') {
                    val = val.trim();
                    // Se parece um número com %, limpa e converte
                    if (val.includes('%') || val.includes('$') || val.includes('R$')) {
                        const cleanedVal = val.replace(/[%\$]|R\$/g, '').replace(',', '.').trim();
                        if (!isNaN(Number(cleanedVal)) && cleanedVal !== '') {
                            val = Number(cleanedVal);
                        }
                    } else {
                        // Tenta converter qualquer string numérica
                        const num = Number(val.replace(',', '.'));
                        if (!isNaN(num) && val !== '') val = num;
                    }
                }
                newRow[cleanKey] = val;
            }
            return newRow;
        });

        console.log(`✅ [Parser] ${rows.length} linhas processadas.`);

        if (!rows || rows.length === 0) {
            throw new Error('Planilha vazia ou sem dados legíveis.');
        }

        const headers = Object.keys(rows[0]);
        console.log(`📊 [Parser] Colunas: ${headers.join(', ')}`);
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

        const summary = internalGenerateSummary(rows, headers);
        return {
            headers,
            rows,
            summary,
            shape: internalDetectShape(summary),
            detectedDelimiter: (workbook as any)._detectedDelimiter,
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
 * Funções auxiliares internas para garantir DRY entre Parse e Fallback
 */
function internalGenerateSummary(rows: any[], headers: string[]) {
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    let detectedUnit = '';

    headers.forEach(h => {
        const lower = h.toLowerCase();
        const isTimeHeader = lower.includes('ano') || lower.includes('year') || lower.includes('data') || lower.includes('date');
        
        let columnUnit = '';
        const isNumeric = rows.slice(0, 10).every(row => {
            const v = row[h];
            if (v === undefined || v === null || v === '') return true;
            if (typeof v === 'number') return true;
            const s = String(v);
            const cleaned = s.replace(/[%\$]|R\$/g, '').replace(',', '.').trim();
            if (s.includes('%')) columnUnit = '%';
            else if (s.includes('$')) columnUnit = '$';
            return !isNaN(Number(cleaned)) && cleaned !== '';
        });

        if (isNumeric && !isTimeHeader) {
            numericColumns.push(h);
            if (columnUnit) detectedUnit = columnUnit;
        } else {
            categoricalColumns.push(h);
        }
    });

    if (!detectedUnit) {
        // Fallback: busca nos headers
        const headerText = headers.join(' ').toLowerCase();
        if (headerText.includes('%')) detectedUnit = '%';
        else if (headerText.includes('$') || headerText.includes('usd')) detectedUnit = '$';
        else if (headerText.includes('r$')) detectedUnit = 'R$';
    }

    return {
        totalRows: rows.length,
        totalCols: headers.length,
        numericColumns,
        categoricalColumns,
        unit: detectedUnit,
        sample: rows.slice(0, 5)
    };
}

function internalDetectShape(summary: any): 'wide' | 'long' {
    return summary.categoricalColumns.length >= 1 && summary.numericColumns.length >= 1
        ? 'wide'
        : 'long';
}

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
