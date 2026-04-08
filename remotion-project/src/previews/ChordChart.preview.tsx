import React from "react";
import { AbsoluteFill } from "remotion";
import { ChordChart, ChordEntity, ChordFlow } from "../components/ChordChart";

// Dados fictícios: Migration Flow entre 5 regiões
const mockEntities: ChordEntity[] = [
  { id: "na", label: "North America" },
  { id: "eu", label: "Europe" },
  { id: "as", label: "Asia" },
  { id: "sa", label: "South America" },
  { id: "af", label: "Africa" },
];

const mockFlows: ChordFlow[] = [
  { source: "as", target: "na", value: 450 },
  { source: "eu", target: "na", value: 300 },
  { source: "eu", target: "as", value: 150 },
  { source: "sa", target: "na", value: 200 },
  { source: "af", target: "eu", value: 250 },
  { source: "as", target: "eu", value: 100 },
  { source: "sa", target: "eu", value: 50 },
  { source: "af", target: "na", value: 80 },
];

/**
 * Preview Component para o ChordChart
 * Global Migration & Exchange Flow Demo
 */
export const ChordChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <ChordChart 
        entities={mockEntities} 
        flows={mockFlows} 
        title="Global Migration Flow — Annual Report" 
      />
    </AbsoluteFill>
  );
};
