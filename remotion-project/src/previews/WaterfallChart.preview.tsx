import React from "react";
import { AbsoluteFill } from "remotion";
import { WaterfallChart } from "../components/WaterfallChart";

// Dados fictícios: Fluxo de Caixa Mensal
const mockCashFlow = [
  { label: "Janeiro", value: 50000 },
  { label: "Salários", value: -12000 },
  { label: "Marketing", value: -8000 },
  { label: "Fevereiro", value: 65000 },
  { label: "Equipamento", value: -15000 },
  { label: "Consultoria", value: -6000 },
  { label: "Março", value: 45000 },
];

/**
 * Preview Component para o WaterfallChart
 * Cash Flow Analysis Demo
 */
export const WaterfallChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <WaterfallChart 
        data={mockCashFlow} 
        title="Fluxo de Caixa — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
