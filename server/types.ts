/**
 * Tipagem comum para o Pipeline e Remotion.
 */
export interface ChartData {
  label: string;
  value: number;
}

export interface ChartAnalysis {
  componentId: 'BarChart' | 'LineChart' | 'PieChart';
  props: ChartProps;
  reasoning: string;
}

export interface ChartProps {
  data: ChartData[];
  title?: string;
  colors?: string[];
  borderRadius?: number;
  showValueLabels?: boolean;
}
