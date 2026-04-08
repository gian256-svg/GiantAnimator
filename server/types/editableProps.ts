export interface EditableProps {
  // 📊 Dados
  title?: string;
  subtitle?: string;
  data?: Array<{ label: string; value: number }>;

  // 🎨 Cores
  sliceColors?: string[];
  colors?: string[];
  elementColors?: string[];
  backgroundColor?: string;
  textColor?: string;
  axisColor?: string;
  gridColor?: string;

  // 📐 Dimensões e Posição
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  scale?: number;
  posX?: number;
  posY?: number;
  radius?: number;
  barWidth?: number;
  gap?: number;

  // ✏️ Tipografia
  titleFontSize?: number;
  labelFontSize?: number;
  valueFontSize?: number;
  fontFamily?: "Inter" | "Roboto" | "Montserrat" | "Arial";
  fontWeight?: 400 | 600 | 700 | 800;

  // 🎬 Animação
  durationInFrames?: number;
  delay?: number;
  easing?: "ease" | "spring" | "linear";
  fps?: 24 | 30 | 60;

  // 🖼️ Aparência Geral
  showLegend?: boolean;
  showGrid?: boolean;
  showValueLabels?: boolean;
  showAxis?: boolean;
  borderRadius?: number;
  opacity?: number;
}
