import React from "react";
import { AbsoluteFill } from "remotion";
import { BarChart } from "../charts/BarChart";

// Dados fictícios: Vendas Mensais (8 categorias)
const mockBarData = [
  { label: "Jan", value: 1200 },
  { label: "Fev", value: 1900 },
  { label: "Mar", value: 3000 },
  { label: "Abr", value: 5000 },
  { label: "Mai", value: 2000 },
  { label: "Jun", value: 4300 },
  { label: "Jul", value: 3000 },
  { label: "Ago", value: 6500 },
];

/**
 * Preview Component para o BarChart
 * Monthly Sales Analysis Demo
 */
export const BarChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      <BarChart 
        data={mockBarData} 
        title="Vendas Mensais — 2025" 
      />
    </AbsoluteFill>
  );
};
