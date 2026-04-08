import React from "react";
import { AbsoluteFill } from "remotion";
import { BoxPlotChart, BoxSet } from "../components/BoxPlotChart";

// Dados fictícios: Distribuição de Salários por Departamento (4 grupos)
const mockSalaries: BoxSet[] = [
  { 
    label: "Engenharia", 
    min: 4500, q1: 6200, median: 8500, q3: 11000, max: 15500, 
    outliers: [18000, 22000] 
  },
  { 
    label: "Marketing", 
    min: 3500, q1: 4500, median: 5800, q3: 7500, max: 9200, 
    outliers: [12000] 
  },
  { 
    label: "RH", 
    min: 3000, q1: 4000, median: 5200, q3: 6800, max: 8000, 
    outliers: [1000] // Baixo outlier
  },
  { 
    label: "Vendas", 
    min: 4000, q1: 5500, median: 7200, q3: 10500, max: 14000, 
    outliers: [25000] 
  },
];

/**
 * Preview Component para o BoxPlotChart
 * Salary Benchmarking Analysis Demo
 */
export const BoxPlotChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <BoxPlotChart 
        data={mockSalaries} 
        title="Benchmarking Salarial por Departamento — 2026" 
      />
    </AbsoluteFill>
  );
};
