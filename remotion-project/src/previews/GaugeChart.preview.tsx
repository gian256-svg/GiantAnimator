import React from "react";
import { AbsoluteFill } from "remotion";
import { GaugeChart } from "../components/GaugeChart";

/**
 * Preview Component para o GaugeChart
 * KPI Performance Demo
 */
export const GaugeChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <GaugeChart 
        value={73.5} 
        title="Alcançado vs Meta — Q1 2026" 
        label="Conversão Geral"
      />
    </AbsoluteFill>
  );
};
