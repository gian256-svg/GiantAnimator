export interface ChartDataset {
  label: string;
  data: number[];
  color: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter' | 'radar' | 'histogram';
  orientation: 'vertical' | 'horizontal'; // ← NOVO CAMPO
  title: string | null;
  subtitle: string | null;                // ← NOVO CAMPO
  subtitleText: string | null;            // ← NOVO CAMPO (texto descritivo longo abaixo do título)
  footerText: string | null;              // ← NOVO CAMPO (ex: "Source: ...")
  titleFontSize: number;
  titleColor: string;
  titleFontFamily: string;
  xAxisLabel: string | null;
  yAxisLabel: string | null;
  axisColor: string;
  axisFontFamily: string;
  backgroundColor: string;
  labels: string[];
  datasets: ChartDataset[];
  showGridLines: boolean;
  showDataLabels: boolean;
  showLegend: boolean;
  valueSuffix: string | null;  // ← NOVO: ex: "%", "k", "M", null
  valuePrefix: string | null;  // ← NOVO: ex: "R$", "$", null

  // ── Posicionamento dos valores (DATA LABELS) ──
  // Detectado visualmente pelo Gemini no gráfico original
  // NUNCA assumir default — sempre extrair do original
  dataLabelPosition:
    | 'inside-bar'        // dentro da barra (no meio ou ponta)
    | 'end-of-bar'        // à direita da barra (horizontal) ou acima (vertical)
    | 'below-axis'        // abaixo do eixo X — ex: gráfico de cidades
    | 'above-bar'         // acima da barra (vertical)
    | 'center-bar'        // centralizado dentro da barra
    | null;               // não detectado / não exibir
}

// ── Animation ──
export interface AnimationData {
  lineStyle: 'solid' | 'dashed' | 'curved' | string;
  animationType: string;
  durationMs: number;
  qualityScore: number; // float [0.0–1.0]
}

export interface ChartCompositionProps {
  data: ChartData;
  animation: AnimationData;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid' | 'particles' | 'abstract';
}
