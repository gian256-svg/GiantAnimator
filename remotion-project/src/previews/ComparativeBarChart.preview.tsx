import React from "react";
import { AbsoluteFill } from "remotion";
import { ComparativeBarChart, ComparativeItem } from "../components/ComparativeBarChart";

// Dados fictícios: Pirâmide Etária Corporativa por Gênero
const mockDemographics: ComparativeItem[] = [
  { label: "18-24", leftValue: 45, rightValue: 38 },
  { label: "25-34", leftValue: 120, rightValue: 110 },
  { label: "35-44", leftValue: 95, rightValue: 85 },
  { label: "45-54", leftValue: 60, rightValue: 55 },
  { label: "55-64", leftValue: 30, rightValue: 25 },
  { label: "65+",   leftValue: 10, rightValue: 8 },
];

/**
 * Preview Component para o ComparativeBarChart
 * Corporate Demographics & Age Pyramid Demo
 */
export const ComparativeBarChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <ComparativeBarChart 
        data={mockDemographics} 
        leftLabel="Masculino" 
        rightLabel="Feminino" 
        title="Pirâmide Etária — Distribuição por Gênero" 
      />
    </AbsoluteFill>
  );
};
