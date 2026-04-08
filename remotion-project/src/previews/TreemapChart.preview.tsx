import React from "react";
import { AbsoluteFill } from "remotion";
import { TreemapChart } from "../components/TreemapChart";

// Dados fictícios: Despesas Corporativas por Departamento
const mockExpenses = [
  { id: "e1", label: "Engenharia", value: 4500, group: "OPEX" },
  { id: "e2", label: "Marketing", value: 3000, group: "Growth" },
  { id: "e3", label: "Vendas", value: 2500, group: "Growth" },
  { id: "e4", label: "RH", value: 1200, group: "OPEX" },
  { id: "e5", label: "Infra", value: 4000, group: "OPEX" },
  { id: "e6", label: "Consultoria", value: 800, group: "Outros" },
  { id: "e7", label: "Jurídico", value: 600, group: "Outros" },
  { id: "e8", label: "Viagens", value: 400, group: "Outros" },
];

/**
 * Preview Component para o TreemapChart
 * Corporate Expenses Analysis Demo
 */
export const TreemapChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <TreemapChart 
        data={mockExpenses} 
        title="Distribuição de Despesas — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
