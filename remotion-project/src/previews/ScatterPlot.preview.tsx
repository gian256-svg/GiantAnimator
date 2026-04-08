import React from "react";
import { AbsoluteFill } from "remotion";
import { ScatterPlot } from "../components/ScatterPlot";

// Dados fictícios: Investimento (X) vs Retorno (Y) com Tamanho como Risco (Z)
const mockScatterData = [
  // Grupo A: Low Risk
  { x: 10000, y: 15000, size: 2, group: "Conservador", label: "Tesouro" },
  { x: 20000, y: 32000, size: 2, group: "Conservador" },
  { x: 30000, y: 45000, size: 3, group: "Conservador" },
  { x: 5000,  y: 8000,  size: 1, group: "Conservador" },
  { x: 15000, y: 22000, size: 2, group: "Conservador" },
  { x: 25000, y: 38000, size: 2, group: "Conservador" },

  // Grupo B: High Risk (Aggressive)
  { x: 45000, y: 120000, size: 8, group: "Agressivo", label: "Crypto" },
  { x: 12000, y: 55000,  size: 6, group: "Agressivo" },
  { x: 35000, y: 95000,  size: 7, group: "Agressivo" },
  { x: 50000, y: 150000, size: 9, group: "Agressivo" },
  { x: 60000, y: 180000, size: 10, group: "Agressivo", label: "IPO" },
  { x: 28000, y: 72000,  size: 5, group: "Agressivo" },
  { x: 40000, y: 110000, size: 8, group: "Agressivo" },
];

/**
 * Preview Component para o ScatterPlot
 * Correlação Investimento vs Retorno
 */
export const ScatterPlotPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <ScatterPlot 
        data={mockScatterData} 
        title="Correlação: Investimento vs Retorno Anual" 
        xLabel="Valor Investido ($)"
        yLabel="Retorno Estimado ($)"
        sizeKey={true}
        groupKey={true}
      />
    </AbsoluteFill>
  );
};
