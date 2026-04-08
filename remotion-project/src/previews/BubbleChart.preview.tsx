import React from "react";
import { AbsoluteFill } from "remotion";
import { BubbleChart } from "../components/BubbleChart";

// Dados fictícios: IDH (X) vs PIB per capita (Y) vs População (Z)
const mockGlobalData = [
  // Ocidentais (Group 1)
  { x: 0.92, y: 55000, size: 330, group: "Américas", label: "USA" },
  { x: 0.82, y: 15000, size: 214, group: "Américas", label: "BRA" },
  { x: 0.75, y: 9000,  size: 130, group: "Américas", label: "MEX" },
  { x: 0.94, y: 48000, size: 68,  group: "Europa", label: "DEU" },
  { x: 0.90, y: 41000, size: 67,  group: "Europa", label: "FRA" },

  // Orientais (Group 2)
  { x: 0.76, y: 12000, size: 1410, group: "Ásia", label: "CHN" },
  { x: 0.64, y: 2500,  size: 1400, group: "Ásia", label: "IND" },
  { x: 0.92, y: 39000, size: 126,  group: "Ásia", label: "JPN" },
  { x: 0.69, y: 4500,  size: 270,  group: "Ásia", label: "IDN" },
  { x: 0.81, y: 33000, size: 52,   group: "Ásia", label: "KOR" },
];

/**
 * Preview Component para o BubbleChart
 * Global Development Indicators Demo
 */
export const BubbleChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <BubbleChart 
        data={mockGlobalData} 
        title="Desenvolvimento Global — IDH vs PIB vs Poplação" 
        xLabel="Índice de Desenv. Humano (IDH)"
        yLabel="PIB Per Capita ($)"
        groupKey={true}
      />
    </AbsoluteFill>
  );
};
