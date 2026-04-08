import React from "react";
import { AbsoluteFill } from "remotion";
import { SunburstChart, SunburstNode } from "../components/SunburstChart";

// Dados fictícios: Hierarquia de Custos (Empresa -> Dept -> Categoria)
const mockHierarchy: SunburstNode = {
  label: "GiantCorp",
  children: [
    {
      label: "Engineering",
      children: [
        { label: "Cloud", value: 450 },
        { label: "Licenças", value: 120 },
        { label: "Hardware", value: 300 },
      ]
    },
    {
      label: "Marketing",
      children: [
        { label: "Ads", value: 600 },
        { label: "Campanhas", value: 200 },
        { label: "Ferramentas", value: 100 },
      ]
    },
    {
      label: "HR",
      children: [
        { label: "Treinamento", value: 150 },
        { label: "Ganhos", value: 400 },
      ]
    },
    {
      label: "R&D",
      children: [
        { label: "AI Labs", value: 500 },
        { label: "Protótipos", value: 200 },
        { label: "Patentes", value: 50 },
      ]
    }
  ]
};

/**
 * Preview Component para o SunburstChart
 * Corporate Cost Structure Hierarchy Demo
 */
export const SunburstChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <SunburstChart 
        data={mockHierarchy} 
        title="Estrutura de Custos — Análise Hierárquica" 
      />
    </AbsoluteFill>
  );
};
