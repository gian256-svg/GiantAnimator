import React from "react";
import { AbsoluteFill } from "remotion";
import { ParetoChart, ParetoItem } from "../components/ParetoChart";

// Dados fictícios: Causas de Defeitos em Produção (Análise de Qualidade)
const mockDefects: ParetoItem[] = [
  { label: "Design", value: 145 },
  { label: "Hardware", value: 98 },
  { label: "Software", value: 64 },
  { label: "Montagem", value: 25 },
  { label: "Transporte", value: 18 },
  { label: "Embalagem", value: 10 },
  { label: "Manual", value: 5 },
];

/**
 * Preview Component para o ParetoChart
 * 80/20 Rule: Quality Control & Defect Analysis Demo
 */
export const ParetoChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <ParetoChart 
        data={mockDefects} 
        title="Análise de Defeitos — Regra de Pareto (80/20)" 
      />
    </AbsoluteFill>
  );
};
