import React from "react";
import { AbsoluteFill } from "remotion";
import { HistogramChart } from "../components/HistogramChart";

// Dados fictícios: Distribuição de tempo de resposta da API (ms)
const mockResponseTimes = [
  120, 150, 180, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370,
  150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 510, 540, 570, 600, 630, 660, 690, 720,
  180, 220, 260, 300, 340, 380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820, 860, 900, 940,
  105, 110, 115, 125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285
];

/**
 * Preview Component para o HistogramChart
 * API Response Latency Analysis Demo
 */
export const HistogramChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <HistogramChart 
        rawData={mockResponseTimes} 
        binCount={10} 
        showKDE={true} 
        title="Latência de Resposta (v1.2) — ms" 
      />
    </AbsoluteFill>
  );
};
