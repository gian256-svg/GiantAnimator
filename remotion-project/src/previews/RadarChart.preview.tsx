import React from "react";
import { AbsoluteFill } from "remotion";
import { RadarChart } from "../components/RadarChart";

// Dados fictícios: Comparativo de Habilidades (Engenheiro Senior vs Pleno)
const axes = ["React", "Typescript", "Node.js", "System Design", "Soft Skills", "English"];

const mockSkillsData = [
  { 
    label: "Senior Engineer", 
    values: [0.95, 0.90, 0.85, 0.92, 0.88, 0.90] 
  },
  { 
    label: "Mid-Level Engineer", 
    values: [0.80, 0.70, 0.65, 0.40, 0.75, 0.60] 
  },
];

/**
 * Preview Component para o RadarChart
 * Skill Assessment Demo
 */
export const RadarChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <RadarChart 
        axes={axes} 
        series={mockSkillsData} 
        title="Assessment — Engenharia de Software" 
      />
    </AbsoluteFill>
  );
};
