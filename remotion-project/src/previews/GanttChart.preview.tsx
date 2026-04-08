import React from "react";
import { AbsoluteFill } from "remotion";
import { GanttChart, GanttTask } from "../components/GanttChart";

// Dados fictícios: Roadmap de Lançamento (Software)
const mockTasks: GanttTask[] = [
  { id: "1", label: "Arquitetura", start: 0, duration: 24, color: "#3B82F6" },
  { id: "2", label: "Backend API", start: 25, duration: 45, color: "#3B82F6", dependencies: ["1"] },
  { id: "3", label: "Frontend UI", start: 30, duration: 40, color: "#10B981", dependencies: ["1"] },
  { id: "4", label: "QA & Bugs", start: 75, duration: 20, color: "#F59E0B", dependencies: ["2", "3"] },
  { id: "5", label: "Produção", start: 100, duration: 5, color: "#EF4444", dependencies: ["4"] },
];

/**
 * Preview Component para o GanttChart
 * Project Roadmap Demo
 */
export const GanttChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      <GanttChart 
        tasks={mockTasks} 
        title="Roadmap de Lançamento — v1.0" 
        totalDays={120}
      />
    </AbsoluteFill>
  );
};
