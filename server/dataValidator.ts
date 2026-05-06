export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// "Product 1", "Item 3", "Series 2" etc. — requer dígito sequencial (não pega "Product Revenue" ou "Product A")
// Termos sem número só bloqueados quando são exatamente a palavra isolada (ex: "Label", "Value")
const GENERIC_LABEL_RE = /^(item|series|série|serie|product|produto)\s+\d+$|^(category|label|data|valor|group|grupo|option|element|type|class|value|measure|metric|variable|sample|entry|row|col|column|tag)(\s*\d+)?$/i;
const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// Known synthetic/template company names that indicate non-real data
const FAKE_TITLE_RE = /\b(acme|contoso|fabrikam|northwind|tailspin|adventureworks|widgetco|foobar)\b/i;

// Detecta padrões de mês/trimestre/ano em sequência (labels temporais)
const MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i;
const QUARTER_RE = /^q[1-4]/i;
const YEAR_RE = /^\d{4}$/;

const KEYWORD_ONLY_RE = /^(label|value|data|type|group|item|product|series|val|var)$/i;

function hasGenericLabels(labels: string[]): { genericCount: number; keywordDensity: number; genericList: string[] } {
  const genericList = labels.filter(l => l && GENERIC_LABEL_RE.test(String(l).trim()));
  const keywords = labels.filter(l => l && KEYWORD_ONLY_RE.test(String(l).trim()));
  
  return {
    genericCount: genericList.length,
    keywordDensity: labels.length > 0 ? keywords.length / labels.length : 0,
    genericList
  };
}

function hasDuplicates(labels: string[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const l of labels) {
    const k = String(l).trim().toLowerCase();
    if (seen.has(k)) dupes.push(l);
    else seen.add(k);
  }
  return dupes;
}


function isTemporalSequence(labels: string[]): boolean {
  return labels.every(l => MONTH_RE.test(l) || QUARTER_RE.test(l) || YEAR_RE.test(l));
}

function isYearSequenceOrdered(labels: string[]): boolean {
  const years = labels.map(l => parseInt(l, 10)).filter(n => !isNaN(n));
  if (years.length < 2) return true;
  for (let i = 1; i < years.length; i++) {
    if (years[i] < years[i - 1]) return false;
  }
  return true;
}

export function validateChartData(type: string, props: any): ValidationResult {
  const errors: string[] = [];

  // ── 1. Título ─────────────────────────────────────────────────────────────
  // Ausência de título é válida — gráficos sem título existem. Só bloqueia
  // títulos genéricos/sintéticos que indicam alucinação do modelo.
  if (props.title && props.title.trim().length > 0) {
    if (props.title.toLowerCase().includes("untitled") || props.title.trim().length < 3) {
      errors.push("Título genérico demais (alucinação provável).");
    } else if (FAKE_TITLE_RE.test(props.title)) {
      errors.push(`Título contém empresa sintética de template (dado não-real): "${props.title}".`);
    }
  }

  // ── 2. Labels genéricos ───────────────────────────────────────────────────
  // Apenas labels de eixo — series[].label é omitido intencionalmente porque
  // "Series 1 + Product 1-4" combinados inflariam o contador falsamente.
  const axisOnlyLabels: string[] = [
    ...(props.labels ?? []),
    ...(props.categories ?? []),
    ...(props.data?.map((d: any) => d.label).filter(Boolean) ?? []),
    ...(props.xLabels ?? []),
    ...(props.yLabels ?? []),
  ];
  const uniqueLabels = [...new Set(axisOnlyLabels)];
  const isTitleValid = props.title && !props.title.toLowerCase().includes("untitled") && !FAKE_TITLE_RE.test(props.title);
  const { genericCount, keywordDensity, genericList } = hasGenericLabels(uniqueLabels);
  const maxGeneric = isTitleValid ? 15 : 6;

  if (genericCount >= maxGeneric || keywordDensity > 0.8) {
    errors.push(`Labels genéricos (alucinação): ${genericList.slice(0, 4).join(', ')}`);
  }

  // ── 3. Labels duplicados ──────────────────────────────────────────────────
  const axisLabels: string[] = [...(props.labels ?? []), ...(props.categories ?? [])];
  const dupes = hasDuplicates(axisLabels);
  if (dupes.length > 0) {
    errors.push(`Labels duplicados no eixo (alucinação ou OCR incorreto): ${dupes.slice(0, 3).join(', ')}`);
  }

  // ── 4. Cores hex inválidas ────────────────────────────────────────────────
  if (props.seriesColors && Array.isArray(props.seriesColors)) {
    const badColors = props.seriesColors.filter((c: any) => typeof c !== 'string' || !HEX_COLOR_RE.test(c));
    if (badColors.length > 0) {
      errors.push(`seriesColors inválidas: ${badColors.slice(0, 3).join(', ')}`);
    }
  }

  // ── 5. Todos valores iguais (série plana = alucinação) ────────────────────
  const flattenValues = (s: any[]): number[] => s.flatMap(v => {
    const n = Number(v);
    return isNaN(n) ? [] : [n];
  });

  // ── 6. Valores NaN / nulos ────────────────────────────────────────────────
  const numericSeriesValues: number[] = props.series?.flatMap((s: any) => s.data ?? s.values ?? []) ?? [];
  const dataValues: number[] = props.data?.map((d: any) => d?.value ?? d) ?? [];
  const allNumeric = [...dataValues, ...numericSeriesValues];
  const nanCount = allNumeric.filter(v => v === null || v === undefined || (typeof v === 'number' && isNaN(v))).length;
  if (nanCount > 0) {
    errors.push(`${nanCount} valor(es) nulo(s) ou NaN na extração.`);
  }

  // ── 7. Outliers estatísticos — apenas quando claramente impossível ──────────
  // Removida detecção por 10× mediana: dados reais (OWID, financeiros) têm outliers
  // legítimos (ex: China vs Bangladesh em CO2, EUA vs média em PIB).
  // A auditoria visual do LLM já captura extracções erradas de escala.
  const cleanNumerics = flattenValues(allNumeric);

  // ── 8. Série completamente uniforme (todos valores iguais) ───────────────
  if (cleanNumerics.length >= 2) {
    const uniqueVals = new Set(cleanNumerics);
    if (uniqueVals.size === 1) {
      errors.push(`Todos os valores são idênticos (${cleanNumerics[0]}). Série provavelmente alucinada.`);
    }
  }

  // ── 9. yMin/yMax vs dados reais ─────────────────────────────────────────
  // Auto-corrige escala se Gemini misread os eixos; não bloqueia dados reais.
  if (cleanNumerics.length > 0 && props.yMin !== undefined && props.yMax !== undefined) {
    const yRange = props.yMax - props.yMin;
    if (yRange <= 0) {
      errors.push(`yMin (${props.yMin}) >= yMax (${props.yMax}): escala inválida.`);
    } else {
      const outOfRange = cleanNumerics.filter(v => v < props.yMin - yRange * 0.5 || v > props.yMax + yRange * 0.5);
      if (outOfRange.length > cleanNumerics.length * 0.3) {
        const dataMin = Math.min(...cleanNumerics);
        const dataMax = Math.max(...cleanNumerics);
        console.warn(`⚠️ [Reality Shield] SCALE_MISMATCH auto-corrigido: yMin ${props.yMin}→${dataMin}, yMax ${props.yMax}→${dataMax}`);
        props.yMin = dataMin < 0 ? dataMin * 1.1 : Math.min(dataMin * 0.9, 0);
        props.yMax = dataMax * 1.1;
      }
    }
  }

  // ── 10. Sequência temporal fora de ordem ──────────────────────────────────
  if (axisLabels.length >= 2 && isTemporalSequence(axisLabels)) {
    if (axisLabels.every(l => YEAR_RE.test(l)) && !isYearSequenceOrdered(axisLabels)) {
      errors.push(`Anos fora de ordem cronológica: ${axisLabels.join(', ')}`);
    }
  }

  // ══ VALIDAÇÕES POR TIPO ══════════════════════════════════════════════════

  // ── 11. BarChart / HorizontalBarChart ─────────────────────────────────────
  if (type === "BarChart" || type === "HorizontalBarChart") {
    const series = props.series ?? [];
    const labels = props.labels ?? [];
    if (series.length === 0) errors.push("Nenhuma série encontrada.");
    if (labels.length === 0) errors.push("Nenhum label de eixo encontrado.");

    series.forEach((s: any) => {
      const len = s.data?.length ?? 0;
      if (len !== labels.length) {
        errors.push(`Série '${s.label}': ${len} valores para ${labels.length} labels.`);
      }
      if (len > 0 && s.data.every((v: number) => v === 0)) {
        errors.push(`Série '${s.label}' contém apenas zeros.`);
      }
    });
  }

  // ── 12. LineChart / AreaChart ──────────────────────────────────────────────
  if (type === "LineChart" || type === "AreaChart") {
    const series = props.series ?? [];
    if (series.length === 0) errors.push("Nenhuma série encontrada.");

    const lengths = series.map((s: any) => s.data?.length ?? 0);
    if (lengths.length > 1 && new Set(lengths).size > 1) {
      errors.push(`Séries com tamanhos diferentes: ${lengths.join(', ')} pontos.`);
    }
    if (lengths.every((l: number) => l < 2)) {
      errors.push("Todas as séries têm menos de 2 pontos — gráfico não renderizável.");
    }
    // Labels count vs series length
    if (props.labels && series.length > 0) {
      const seriesLen = series[0].data?.length ?? 0;
      if (props.labels.length !== seriesLen) {
        errors.push(`Labels (${props.labels.length}) não correspondem aos pontos da série (${seriesLen}).`);
      }
    }
  }

  // ── 13. PieChart / DonutChart ──────────────────────────────────────────────
  if (type === "PieChart" || type === "DonutChart") {
    const data = props.data ?? [];
    if (data.length < 2) errors.push("Menos de 2 fatias — gráfico circular sem sentido.");

    const values = data.map((d: any) => Number(d.value) || 0);
    const total = values.reduce((a: number, b: number) => a + b, 0);
    if (total === 0) errors.push("Soma total é zero.");

    const negatives = values.filter((v: number) => v < 0);
    if (negatives.length > 0) errors.push(`PieChart com ${negatives.length} valor(es) negativo(s).`);

    // Percentual: soma deve ser ~100
    const allBelow100 = values.every((v: number) => v > 0 && v <= 100);
    if (allBelow100 && Math.abs(total - 100) > 5) {
      errors.push(`Soma dos percentuais = ${total.toFixed(1)}% (esperado ~100%).`);
    }

    // Nenhuma fatia pode ser >99% (dominância total = alucinação)
    const dominant = values.filter((v: number) => total > 0 && v / total > 0.99);
    if (dominant.length > 0) errors.push(`Uma fatia representa 99%+ do total — provável alucinação.`);
  }

  // ── 14. StackedBarChart ────────────────────────────────────────────────────
  if (type === "StackedBarChart") {
    const categories = props.categories ?? [];
    const series = props.series ?? [];
    if (categories.length === 0 || series.length === 0) {
      errors.push("Categorias ou séries ausentes.");
    }
    series.forEach((s: any) => {
      const len = s.values?.length ?? 0;
      if (len !== categories.length) {
        errors.push(`Série '${s.label}': ${len}/${categories.length} valores.`);
      }
    });
  }

  // ── 15. CandlestickChart ──────────────────────────────────────────────────
  if (type === "CandlestickChart") {
    const data = props.data ?? [];
    if (data.length === 0) errors.push("Nenhum candle encontrado.");
    data.forEach((d: any, i: number) => {
      if (d.high < d.open || d.high < d.close) {
        errors.push(`Candle[${i}] '${d.label}': high (${d.high}) menor que open/close — impossível.`);
      }
      if (d.low > d.open || d.low > d.close) {
        errors.push(`Candle[${i}] '${d.label}': low (${d.low}) maior que open/close — impossível.`);
      }
      if (d.high < d.low) {
        errors.push(`Candle[${i}] '${d.label}': high < low — dado corrompido.`);
      }
    });
  }

  // ── 16. HeatmapChart ──────────────────────────────────────────────────────
  if (type === "HeatmapChart") {
    const xL = props.xLabels?.length ?? 0;
    const yL = props.yLabels?.length ?? 0;
    const dataLen = props.data?.length ?? 0;
    const expected = xL * yL;
    if (expected > 0 && dataLen !== expected) {
      errors.push(`HeatmapChart: esperado ${expected} células (${xL}×${yL}), recebido ${dataLen}.`);
    }
  }

  // ── 17. ScatterPlot ───────────────────────────────────────────────────────
  if (type === "ScatterPlot") {
    const series = props.series ?? [];
    if (series.length === 0) errors.push("Nenhuma série no ScatterPlot.");
    series.forEach((s: any) => {
      const invalid = (s.data ?? []).filter((p: any) => p.x === undefined || p.y === undefined);
      if (invalid.length > 0) errors.push(`Série '${s.label}': ${invalid.length} pontos sem coordenadas x/y.`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
