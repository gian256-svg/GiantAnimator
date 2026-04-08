import React from "react";
import { AbsoluteFill } from "remotion";
import { AreaChart } from "../components/AreaChart";

// Dados fictícios realistas (Receita Mensal em Milhões)
const mockData = [
  { label: "Jan", value: 1200000 },
  { label: "Fev", value: 1450000 },
  { label: "Mar", value: 1300000 },
  { label: "Abr", value: 1800000 },
  { label: "Mai", value: 2100000 },
  { label: "Jun", value: 1950000 },
  { label: "Jul", value: 2400000 },
  { label: "Ago", value: 2800000 },
];

/**
 * Preview Component para o AreaChart
 * Registrado no Root.tsx
 */
export const AreaChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <AreaChart 
        data={mockData} 
        title="Receita Mensal — Janeiro a Agosto de 2026" 
        color="#F59E0B"
      />
    </AbsoluteFill>
  );
};
