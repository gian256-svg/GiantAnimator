// server/calibration/constants.ts
import type { ChartType } from "./types.js";

// ─────────────────────────────────────────────────────────
// ✅ MODELO PRINCIPAL — gemini-2.5-flash (GA)
// gemini-2.0-flash não disponível nesta conta (restrições de acesso)
// ─────────────────────────────────────────────────────────
export const GEMINI_MODEL        = "gemini-2.5-flash";
export const GEMINI_MODEL_VISION = "gemini-2.5-flash";

// ─────────────────────────────────────────────────────────
// Mapa de tipos → nomes dos componentes Remotion
// ─────────────────────────────────────────────────────────
export const COMPONENT_NAME_MAP: Record<ChartType, string> = {
  "vertical-bar":   "BarChart",
  "horizontal-bar": "HorizontalBarChart",
  "line":           "LineChart",
  "multi-line":     "MultiLineChart",
  "area":           "AreaChart",
  "pie-donut":      "PieChart",
  "scatter":        "ScatterPlot",
  "waterfall":      "WaterfallChart",
  "candlestick":    "CandlestickChart",
  "heatmap":        "Heatmap",
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  "vertical-bar":   "Vertical Bar Chart",
  "horizontal-bar": "Horizontal Bar Chart",
  "line":           "Line Chart",
  "multi-line":     "Multi-Line Chart",
  "area":           "Area Chart",
  "pie-donut":      "Donut / Pie Chart",
  "scatter":        "Scatter Plot",
  "waterfall":      "Waterfall Chart",
  "candlestick":    "Candlestick Chart",
  "heatmap":        "Heatmap",
};
