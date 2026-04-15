/**
 * Tipagem comum para o Pipeline e Remotion.
 */
export interface ChartData {
  label: string;
  value: number;
}

export interface ChartAnalysis {
  componentId: string;
  props: any; // Props variam drasticamente entre os 31 componentes
  reasoning: string;
  suggestedName?: string; // Três palavras sem espaço resumindo o gráfico
}

export interface ChartProps {
  data: any[];
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  seriesColors?: string[];
  borderRadius?: number;
  showValueLabels?: boolean;
}

export interface FileAnalysis {
  rowCount:       number;
  labels:         string[];
  datasets:       Array<{ label: string; values: number[] }>;
  suggestedChart: string;
  title:          string;
  subtitle?:      string;
  unit?:          string;
}
