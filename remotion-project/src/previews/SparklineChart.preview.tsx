import React from "react";
import { AbsoluteFill } from "remotion";
import { SparklineChart, SparklineItem } from "../components/SparklineChart";

// Dados fictícios: Dashboard de KPIs em grid 2x2
const mockSparklines: SparklineItem[] = [
  { 
    label: "Receita (M$)", 
    data: [65, 59, 80, 81, 56, 120, 140, 155], 
    color: "#3B82F6", variant: "line" 
  },
  { 
    label: "Usuários Ativos", 
    data: [1200, 1500, 1800, 2100, 1900, 2500, 2800, 3200], 
    color: "#10B981", variant: "area" 
  },
  { 
    label: "Taxa de Churn (%)", 
    data: [4.2, 4.0, 3.8, 4.5, 4.1, 3.7, 3.5, 3.2], 
    color: "#EF4444", variant: "bar" 
  },
  { 
    label: "Conversão (%)", 
    data: [18, 20, 24, 22, 25, 28, 32, 35], 
    color: "#F59E0B", variant: "line" 
  },
];

/**
 * Preview Component para o SparklineChart
 * Dashboard Trend Highlights Demo
 */
export const SparklineChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <SparklineChart 
        items={mockSparklines} 
        columns={2} 
        title="Principais Tendências — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
