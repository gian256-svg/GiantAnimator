import React from "react";
import { AbsoluteFill } from "remotion";
import { StackedBarChart } from "../components/StackedBarChart";

// Dados fictícios: Composição de Vendas (Loja vs Online vs Parceiro)
const mockSalesData = [
  { label: "Jan", values: [12000, 8000, 4500] },
  { label: "Fev", values: [15000, 11000, 5200] },
  { label: "Mar", values: [13500, 14500, 6100] },
  { label: "Abr", values: [18000, 19000, 7500] },
  { label: "Mai", values: [22000, 25000, 9200] },
  { label: "Jun", values: [20500, 28000, 8400] },
];

const seriesLabels = ["Loja Física", "E-commerce", "Marketplace"];

/**
 * Preview Component para o StackedBarChart
 * Sales Composition Analysis Demo
 */
export const StackedBarChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <StackedBarChart 
        data={mockSalesData} 
        seriesLabels={seriesLabels}
        title="Receita por Canal de Venda — 2026" 
      />
    </AbsoluteFill>
  );
};
