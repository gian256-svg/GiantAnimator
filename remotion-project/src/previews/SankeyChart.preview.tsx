import React from "react";
import { AbsoluteFill } from "remotion";
import { SankeyChart } from "../components/SankeyChart";

// Dados fictícios: Fluxo de Receita (Produto → Canal → Região)
const nodes = [
  // Coluna 0 (Produtos)
  { id: "p1", label: "Software SaaS", column: 0 },
  { id: "p2", label: "Consultoria", column: 0 },
  { id: "p3", label: "Hardware", column: 0 },

  // Coluna 1 (Canais)
  { id: "c1", label: "Direto", column: 1 },
  { id: "c2", label: "Parceiros", column: 1 },
  { id: "c3", label: "Online", column: 1 },

  // Coluna 2 (Regiões)
  { id: "r1", label: "Brasil", column: 2 },
  { id: "r2", label: "EUA", column: 2 },
  { id: "r3", label: "Europa", column: 2 },
];

const links = [
  // Produto -> Canal
  { source: "p1", target: "c3", value: 3000 },
  { source: "p1", target: "c1", value: 1000 },
  { source: "p2", target: "c1", value: 4000 },
  { source: "p3", target: "c2", value: 2000 },
  { source: "p3", target: "c3", value: 500 },

  // Canal -> Região
  { source: "c1", target: "r1", value: 3500 },
  { source: "c1", target: "r2", value: 1500 },
  { source: "c2", target: "r2", value: 1000 },
  { source: "c2", target: "r3", value: 1000 },
  { source: "c3", target: "r1", value: 1000 },
  { source: "c3", target: "r2", value: 1500 },
  { source: "c3", target: "r3", value: 1000 },
];

/**
 * Preview Component para o SankeyChart
 * Revenue Flow Analysis Demo
 */
export const SankeyChartPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0F1A" }}>
      <SankeyChart 
        nodes={nodes} 
        links={links} 
        title="Fluxo de Receita Global — Q1 2026" 
      />
    </AbsoluteFill>
  );
};
