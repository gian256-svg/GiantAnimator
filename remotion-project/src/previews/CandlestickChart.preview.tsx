import React from "react";
import { AbsoluteFill } from "remotion";
import { CandlestickChart } from "../components/CandlestickChart";

// Dados fictícios: Ações GiantTech (OHLC)
const mockStockData = [
  { label: "10/01", open: 150.20, high: 158.45, low: 148.90, close: 155.30 }, // Alta
  { label: "11/01", open: 155.30, high: 160.10, low: 154.00, close: 158.80 }, // Alta
  { label: "12/01", open: 158.80, high: 159.50, low: 152.20, close: 153.40 }, // Baixa
  { label: "13/01", open: 153.40, high: 155.00, low: 145.60, close: 148.20 }, // Baixa
  { label: "14/01", open: 148.20, high: 162.00, low: 147.50, close: 159.10 }, // Alta Forte
  { label: "15/01", open: 159.10, high: 165.30, low: 158.00, close: 164.20 }, // Alta
  { label: "16/01", open: 164.20, high: 168.90, low: 163.00, close: 167.50 }, // Alta
  { label: "17/01", open: 167.50, high: 170.50, low: 160.20, close: 162.80 }, // Baixa
  { label: "18/01", open: 162.80, high: 166.00, low: 161.50, close: 165.10 }, // Alta
  { label: "19/01", open: 165.10, high: 166.80, low: 155.20, close: 158.40 }, // Baixa
];

/**
 * Preview Component para o CandlestickChart
 * Stock Market Analysis Demo
 */
export const CandlestickChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <CandlestickChart 
        data={mockStockData} 
        title="Mercado Financeiro — GiantTech INC" 
      />
    </AbsoluteFill>
  );
};
