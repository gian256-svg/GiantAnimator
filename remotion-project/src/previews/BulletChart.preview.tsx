import React from "react";
import { AbsoluteFill } from "remotion";
import { BulletChart, BulletMetric } from "../components/BulletChart";

// Dados fictícios: KPIs de Performance vs Metas
const mockKPIs: BulletMetric[] = [
  { label: "Receita (M$)", value: 85, target: 90, ranges: [60, 80, 100] },
  { label: "NPS", value: 72, target: 65, ranges: [40, 60, 80] },
  { label: "Conversão (%)", value: 24, target: 20, ranges: [10, 20, 30] },
  { label: "Churn Rate", value: 4.2, target: 3.5, ranges: [2, 5, 10] }, // Baixo melhor? Para este gráfico crescemos L-R
];

/**
 * Preview Component para o BulletChart
 * Performance Dashboard Outlook Demo
 */
export const BulletChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <BulletChart 
        metrics={mockKPIs} 
        title="Status de Performance — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
