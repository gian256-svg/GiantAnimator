// server/calibration/types.ts
// Tipos compartilhados do pipeline de calibração

export type ChartType =
  | "vertical-bar"
  | "horizontal-bar"
  | "line"
  | "multi-line"
  | "area"
  | "pie-donut"
  | "scatter"
  | "waterfall"
  | "candlestick"
  | "heatmap";

export type CalibrationStatus =
  | "pending"
  | "generating"
  | "rendering"
  | "auditing"
  | "calibrated"
  | "failed";

export interface AuditDimension {
  name: string;
  passed: boolean;
  score: number; // 0 ou 1
  notes: string;
}

export interface CalibrationResult {
  chartType:   ChartType;
  status:      CalibrationStatus;
  score:       number;        // 0–8
  dimensions:  AuditDimension[];
  rulesPath:   string;
  componentPath: string;
  renderPath?: string;
  timestamp:   string;
  iteration:   number;        // quantas tentativas até calibrar
  errors:      string[];
}

export interface ReferenceData {
  chartType:    ChartType;
  source:       "jitter" | "youtube" | "manual";
  url:          string;
  description:  string;
  animationNotes: string[];
  visualNotes:    string[];
  sampleData?:    Record<string, unknown>;
}

export interface CalibrationConfig {
  targetScore:      number;   // padrão: 8
  maxIterations:    number;   // padrão: 3
  renderTimeout:    number;   // ms — padrão: 60000
  autoSaveRules:    boolean;  // padrão: true
  notifyOnComplete: boolean;
}
