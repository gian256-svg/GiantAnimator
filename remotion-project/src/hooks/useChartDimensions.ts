import { useVideoConfig } from "remotion";

export interface ChartDimensionsOptions {
  hasSubtitle?: boolean;
  hasLegend?: boolean;
}

export interface ChartDimensions {
  safeWidth: number;
  safeHeight: number;
  offsetX: number;
  offsetY: number;
  chartWidth: number;
  chartHeight: number;
  fontSizes: {
    title: number;
    subtitle: number;
    axisLabel: number;
    dataLabel: number;
    legendItem: number;
    axisTick: number;
  };
  safeAreaStyle: React.CSSProperties;
}

/**
 * Hook to manage responsive chart dimensions and optimization.
 * v3.3 — Optimized White Space + Boosted Typography (Rule 15)
 */
export function useChartDimensions(
  options: ChartDimensionsOptions = {}
): ChartDimensions {
  const { width: videoWidth, height: videoHeight } = useVideoConfig();
  const { hasSubtitle = false, hasLegend = true } = options;

  // Safe area (90% of frame — 5% margin on each side)
  const safeWidth  = videoWidth  * 0.90;
  const safeHeight = videoHeight * 0.90;
  const offsetX    = videoWidth  * 0.05;
  const offsetY    = videoHeight * 0.05;

  const baseUnit = Math.min(videoWidth, videoHeight);

  // Boost scale factor: aproveita espaço em branco aumentando as fontes em 30%
  // 🎬 RULE 15: Proposta v3.3
  const boostFactor = 1.30;

  const fontSizes = {
    title:      Math.round(baseUnit * 0.030 * boostFactor), // ~28-42px a 1080p
    subtitle:   Math.round(baseUnit * 0.022 * boostFactor), 
    axisLabel:  Math.round(baseUnit * 0.020 * boostFactor), 
    dataLabel:  Math.round(baseUnit * 0.018 * boostFactor), 
    legendItem: Math.round(baseUnit * 0.022 * boostFactor), 
    axisTick:   Math.round(baseUnit * 0.016 * boostFactor), 
  };

  // Desconta altura de título, subtítulo e legenda para o chart não sobrepor
  const titleBlockHeight    = fontSizes.title * 2.0;
  const subtitleBlockHeight = hasSubtitle ? fontSizes.subtitle * 1.8 : 0;
  const legendBlockHeight   = hasLegend   ? fontSizes.legendItem * 2.5 : 0;

  // O chartHeight é o que sobra da safeHeight após descontar os blocos fixos
  const chartHeight =
    safeHeight - titleBlockHeight - subtitleBlockHeight - legendBlockHeight;
  const chartWidth = safeWidth;

  const safeAreaStyle: React.CSSProperties = {
    position: "absolute",
    top:      offsetY,
    left:     offsetX,
    width:    safeWidth,
    height:   safeHeight,
    overflow: "hidden",
  };

  return {
    safeWidth,
    safeHeight,
    offsetX,
    offsetY,
    chartWidth,
    chartHeight,
    fontSizes,
    safeAreaStyle,
  };
}
