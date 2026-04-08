import React from "react";
import { AbsoluteFill } from "remotion";
import { PieChart } from "../components/PieChart";

// Dados fictícios: Alocação de Investimentos
const mockPortfolio = [
  { label: "Ações Brasil", value: 45000 },
  { label: "Renda Fixa", value: 35000 },
  { label: "Real Estate", value: 12000 },
  { label: "Ativos USA", value: 8000 },
];

/**
 * Preview Component para o PieChart
 * Portfolio Allocation Demo
 */
export const PieChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <PieChart 
        data={mockPortfolio} 
        title="Alocação de Portfólio — Diversificado" 
      />
    </AbsoluteFill>
  );
};
