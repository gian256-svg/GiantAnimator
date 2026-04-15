import React from 'react';
import { ChartCompositionProps, ChartData } from './types';
import { BarChart }  from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { PieChart }  from './charts/PieChart';

function normalizeChartData(raw: any): ChartData {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

  const labels = Array.isArray(parsed?.labels)
    ? parsed.labels.map((v: any) => String(v))
    : Array.isArray(parsed?.categories)
    ? parsed.categories.map((v: any) => String(v))
    : [];

  const datasets = Array.isArray(parsed?.datasets)
    ? parsed.datasets.map((s: any) => ({
        label: s.label ?? s.name ?? "",
        color: s.color ?? s.stroke ?? "#29ABE2",
        data: (Array.isArray(s.data) ? s.data : Array.isArray(s.values) ? s.values : []).map(Number),
      }))
    : Array.isArray(parsed?.series)
    ? parsed.series.map((s: any) => ({
        label: s.label ?? s.name ?? "",
        color: s.color ?? s.stroke ?? "#29ABE2",
        data: (Array.isArray(s.data) ? s.data : Array.isArray(s.values) ? s.values : []).map(Number),
      }))
    : [];

  if (!labels.length || !datasets.length) {
    throw new Error("[normalizeChartData] Dados ausentes/inválidos: " + JSON.stringify({ labels, datasets }));
  }

  return {
    ...parsed,
    type: parsed?.type || parsed?.chartType || 'bar',
    labels,
    datasets
  } as ChartData;
}

export const ChartRenderer: React.FC<ChartCompositionProps> = (props) => {
  console.log("[REMOTION_INPUT_PROPS]", JSON.stringify(props, null, 2));

  // Normalização defensiva 
  const safeData = normalizeChartData(props.data);

  switch (safeData.type) {
    case 'bar':
    case 'histogram':
      return (
        <BarChart 
          data={safeData} 
          animation={props.animation} 
          theme={safeData.theme}
          backgroundColor={safeData.backgroundColor}
          textColor={safeData.textColor}
        />
      );

    case 'line':
    case 'area':
      return (
        <LineChart 
          data={safeData} 
          animation={props.animation} 
          theme={safeData.theme}
          backgroundColor={safeData.backgroundColor}
          textColor={safeData.textColor}
        />
      );

    case 'pie':
    case 'donut':
      return (
        <PieChart 
          data={safeData} 
          animation={props.animation} 
          theme={safeData.theme}
          backgroundColor={safeData.backgroundColor}
          textColor={safeData.textColor}
        />
      );

    default:
      console.warn(`[ChartRenderer] Tipo desconhecido: "${safeData.type}" — usando BarChart como fallback`);
      return <BarChart data={safeData} animation={props.animation} />;
  }
};
