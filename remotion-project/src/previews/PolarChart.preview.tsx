import React from "react";
import { AbsoluteFill } from "remotion";
import { PolarChart, PolarData } from "../components/PolarChart";

// Dados fictícios: Performance por Mês (12 setores)
const mockMonthlyData: PolarData[] = [
  { label: "Jan", value: 65 },
  { label: "Fev", value: 59 },
  { label: "Mar", value: 80 },
  { label: "Abr", value: 81 },
  { label: "Mai", value: 56 },
  { label: "Jun", value: 55 },
  { label: "Jul", value: 40 },
  { label: "Ago", value: 70 },
  { label: "Set", value: 85 },
  { label: "Out", value: 95 },
  { label: "Nov", value: 88 },
  { label: "Dez", value: 100 },
];

/**
 * Preview Component para o PolarChart
 * Seasonal Performance Analysis Demo
 */
export const PolarChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <PolarChart 
        data={mockMonthlyData} 
        title="Performance Sazonal — 2025/2026" 
      />
    </AbsoluteFill>
  );
};
