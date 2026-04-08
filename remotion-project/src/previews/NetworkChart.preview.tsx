import React from "react";
import { AbsoluteFill } from "remotion";
import { NetworkChart, NetworkNode, NetworkEdge } from "../components/NetworkChart";

// Dados fictícios: Rede de Dependências (Equipes de Produto)
const mockNodes: NetworkNode[] = [
  { id: "core", label: "Core API", x: 0.5, y: 0.5, weight: 2.5, color: "#3B82F6" },
  { id: "auth", label: "Auth Service", x: 0.3, y: 0.3, weight: 1.8, color: "#10B981" },
  { id: "billing", label: "Billing Team", x: 0.7, y: 0.3, weight: 1.5, color: "#F59E0B" },
  { id: "frontend", label: "Web UI", x: 0.5, y: 0.2, weight: 1.2, color: "#EF4444" },
  { id: "mobile", label: "Mobile App", x: 0.2, y: 0.6, weight: 1.4, color: "#8B5CF6" },
  { id: "data", label: "Data Pipeline", x: 0.8, y: 0.7, weight: 2.0, color: "#EC4899" },
];

const mockEdges: NetworkEdge[] = [
  { source: "auth", target: "core", directed: true },
  { source: "billing", target: "core", directed: true },
  { source: "frontend", target: "auth", directed: true },
  { source: "frontend", target: "core", directed: true },
  { source: "mobile", target: "auth", directed: true },
  { source: "mobile", target: "core", directed: true },
  { source: "core", target: "data", directed: true },
  { source: "billing", target: "data", directed: true },
];

/**
 * Preview Component para o NetworkChart
 * Team Dependency & Infrastructure Map Demo
 */
export const NetworkChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <NetworkChart 
        nodes={mockNodes} 
        edges={mockEdges} 
        title="Dependências entre Times — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
