import React from "react";
import { AbsoluteFill } from "remotion";
import { HeatmapChart, HeatmapCell } from "../components/HeatmapChart";

// Dados fictícios: Intensidade de Vendas por Hora x Dia da Semana
const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const mockHeatmapData: HeatmapCell[] = [];
days.forEach((day, dIdx) => {
  hours.forEach((hour, hIdx) => {
    // Gerar valores "realistas": Pico no meio do dia e fds
    const base = Math.sin((hIdx / hours.length) * Math.PI) * 100;
    const dayMult = (dIdx >= 5) ? 1.5 : 1.0; // Sab e Dom
    const random = Math.random() * 20;
    mockHeatmapData.push({ x: hour, y: day, value: Math.max(0, base * dayMult + random) });
  });
});

/**
 * Preview Component para o HeatmapChart
 * Store Traffic Analysis Demo
 */
export const HeatmapChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <HeatmapChart 
        data={mockHeatmapData} 
        xLabels={hours} 
        yLabels={days} 
        title="Tráfego de Loja — Horas x Dias (Q1 2026)" 
      />
    </AbsoluteFill>
  );
};
