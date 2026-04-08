import React from "react";
import { AbsoluteFill } from "remotion";
import { MekkoChart, MekkoColumn } from "../components/MekkoChart";

// Dados fictícios: Market Share por Segmento de Produto × Região
const mockMarketData: MekkoColumn[] = [
  { 
    label: "América do Norte", totalValue: 450, 
    segments: [
      { label: "Software", value: 250 },
      { label: "Hardware", value: 150 },
      { label: "Serviços", value: 50 },
    ]
  },
  { 
    label: "Europa", totalValue: 320, 
    segments: [
      { label: "Software", value: 120 },
      { label: "Hardware", value: 120 },
      { label: "Serviços", value: 80 },
    ]
  },
  { 
    label: "Ásia-Pacífico", totalValue: 280, 
    segments: [
      { label: "Software", value: 90 },
      { label: "Hardware", value: 140 },
      { label: "Serviços", value: 50 },
    ]
  },
  { 
    label: "LATAM", totalValue: 120, 
    segments: [
      { label: "Software", value: 40 },
      { label: "Hardware", value: 50 },
      { label: "Serviços", value: 30 },
    ]
  },
];

/**
 * Preview Component para o MekkoChart
 * Market Landscape & Competitive Analysis Demo
 */
export const MekkoChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <MekkoChart 
        data={mockMarketData} 
        title="Market Landscape — Market Size vs Share" 
      />
    </AbsoluteFill>
  );
};
