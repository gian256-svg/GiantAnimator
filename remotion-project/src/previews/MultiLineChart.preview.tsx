import React from "react";
import { AbsoluteFill } from "remotion";
import { MultiLineChart } from "../components/MultiLineChart";

// Dados fictícios realistas: Performance Trimestral
const mockLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

const mockSeries = [
  {
    label: "Receita",
    data: [150000, 185000, 160000, 210000, 245000, 290000],
    color: "#43E97B", // Verde Accent do THEME
  },
  {
    label: "Custo",
    data: [80000, 95000, 85000, 110000, 120000, 135000],
    color: "#FF6584", // Rosa Secondary do THEME
  },
  {
    label: "Lucro",
    data: [70000, 90000, 75000, 100000, 125000, 155000],
    color: "#6C63FF", // Roxo Primary do THEME
  },
];

/**
 * Preview Component para o MultiLineChart
 * Demo de Performance Financeira
 */
export const MultiLineChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <MultiLineChart 
        series={mockSeries} 
        labels={mockLabels} 
        title="Performance Financeira — Q1 & Q2 2026" 
      />
    </AbsoluteFill>
  );
};
