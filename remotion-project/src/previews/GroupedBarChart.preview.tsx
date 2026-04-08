import React from "react";
import { AbsoluteFill } from "remotion";
import { GroupedBarChart } from "../components/GroupedBarChart";

// Dados fictícios: Comparativo Trimestral por Região
const mockRegionalData = [
  { label: "Q1", values: [45000, 32000, 21000] },
  { label: "Q2", values: [48000, 38000, 25000] },
  { label: "Q3", values: [55000, 42000, 29000] },
  { label: "Q4", values: [65000, 51000, 42000] },
];

const seriesLabels = ["Norte", "Sul", "Centro-Oeste"];

/**
 * Preview Component para o GroupedBarChart
 * Regional Sales Comparison Demo
 */
export const GroupedBarChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <GroupedBarChart 
        data={mockRegionalData} 
        seriesLabels={seriesLabels}
        title="Performance Regional — Comparativo Trimestral" 
      />
    </AbsoluteFill>
  );
};
