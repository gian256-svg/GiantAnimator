import React from "react";
import { AbsoluteFill } from "remotion";
import { DonutChart } from "../components/DonutChart";

// Dados fictícios: Market Share
const mockData = [
  { label: "Smartphones", value: 3500 },
  { label: "Tablets", value: 1200 },
  { label: "Laptops", value: 2100 },
  { label: "Wearables", value: 950 },
  { label: "Smart Home", value: 450 },
];

/**
 * Preview Component para o DonutChart
 * Market Distribution Demo
 */
export const DonutChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <DonutChart 
        data={mockData} 
        title="Participação de Mercado — Q3 2026" 
      />
    </AbsoluteFill>
  );
};
