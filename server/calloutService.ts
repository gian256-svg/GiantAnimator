import { type ChartAnalysis } from './types.js';

export async function enrichAnalysisWithCallouts(analysis: ChartAnalysis): Promise<ChartAnalysis> {
  const series = analysis.props.series;
  if (!series || series.length === 0) return analysis;

  // Compute global max and min across all series mathematically
  let maxVal = -Infinity, minVal = Infinity;
  let maxSeriesIdx = 0, maxDataIdx = 0;
  let minSeriesIdx = 0, minDataIdx = 0;

  series.forEach((s: { data?: number[] }, sIdx: number) => {
    (s.data || []).forEach((v: number, dIdx: number) => {
      const n = Number(v);
      if (!isFinite(n)) return;
      if (n > maxVal) { maxVal = n; maxSeriesIdx = sIdx; maxDataIdx = dIdx; }
      if (n < minVal) { minVal = n; minSeriesIdx = sIdx; minDataIdx = dIdx; }
    });
  });

  if (!isFinite(maxVal) || !isFinite(minVal)) return analysis;

  const annotations: { seriesIndex: number; index: number; label: string }[] = [];

  if (maxVal !== minVal) {
    annotations.push({ seriesIndex: maxSeriesIdx, index: maxDataIdx, label: 'Máximo' });
    annotations.push({ seriesIndex: minSeriesIdx, index: minDataIdx, label: 'Mínimo' });
  } else {
    annotations.push({ seriesIndex: maxSeriesIdx, index: maxDataIdx, label: 'Máximo' });
  }

  analysis.props.annotations = annotations;
  console.log(`✅ [Destaques] Máximo idx=${maxDataIdx} (${maxVal}), Mínimo idx=${minDataIdx} (${minVal})`);

  return analysis;
}
