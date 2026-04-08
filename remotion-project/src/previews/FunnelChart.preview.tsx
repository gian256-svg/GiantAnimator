import React from "react";
import { AbsoluteFill } from "remotion";
import { FunnelChart } from "../components/FunnelChart";

// Dados fictícios: Funil de Vendas Corporativo (B2B)
const mockFunnelData = [
  { label: "Leads Totais", value: 5000 },
  { label: "Qualificados (MQL)", value: 3200 },
  { label: "Oportunidades (SQL)", value: 2100 },
  { label: "Proposta Enviada", value: 1200 },
  { label: "Negociação", value: 850 },
  { label: "Fechado (Vendas)", value: 620 },
];

/**
 * Preview Component para o FunnelChart
 * Sales Pipeline Analysis Demo
 */
export const FunnelChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <FunnelChart 
        data={mockFunnelData} 
        title="Performance do Funil — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
