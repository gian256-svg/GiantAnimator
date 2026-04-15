import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface NetworkNode {
  id: string;
  label: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  weight?: number;
  color?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  directed?: boolean;
}

export interface NetworkChartProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  colors?: string[];
  textColor?: string;
}

export const NetworkChart: React.FC<NetworkChartProps> = ({
  nodes = [],
  edges = [],
  title,
  subtitle,
  backgroundColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotLeft = margin;
  const plotTop = margin + titleHeight;
  const plotWidth = width - margin * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;

  const getAbsX = (rx: number) => plotLeft + rx * plotWidth;
  const getAbsY = (ry: number) => plotTop + ry * plotHeight;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor ?? T.background }}>
      {/* ZONA 1 — Cabeçalho */}
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ 
          fontSize: Theme.typography.title.size, 
          fontWeight: Theme.typography.title.weight, 
          color: Theme.typography.title.color,
          fontFamily: Theme.typography.fontFamily,
          marginBottom: 10
        }}>{title}</div>}
        {subtitle && <div style={{ 
          fontSize: Theme.typography.subtitle.size, 
          fontWeight: Theme.typography.subtitle.weight, 
          color: Theme.typography.subtitle.color,
          fontFamily: Theme.typography.fontFamily
        }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <marker
            id="arrowhead" markerWidth="14" markerHeight="10" refX="9" refY="5" orient="auto"
          >
            <polygon points="0 0, 14 5, 0 10" fill={Theme.colors.ui.axisLine} />
          </marker>
          {nodes.map((_, i) => (
            <radialGradient key={i} id={`nodeGrad-${i}-${instanceId}`}>
              <stop offset="0%" stopColor={T.colors[i % T.colors.length]} />
              <stop offset="100%" stopColor={T.colors[i % T.colors.length]} stopOpacity={0.8} />
            </radialGradient>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const s = nodes.find(n => n.id === edge.source);
          const t = nodes.find(n => n.id === edge.target);
          if (!s || !t) return null;

          const sX = getAbsX(s.x);
          const sY = getAbsY(s.y);
          const tX = getAbsX(t.x);
          const tY = getAbsY(t.y);

          const edgeProgress = spring({ frame: frame - 80 - i * 4, fps, config: { damping: 15, stiffness: 60 } });
          if (edgeProgress <= 0) return null;

          return (
            <line
              key={i} x1={sX} y1={sY} x2={sX + (tX - sX) * edgeProgress} y2={sY + (tY - sY) * edgeProgress}
              stroke={Theme.colors.ui.gridline} strokeWidth={4} opacity={0.5 * edgeProgress}
              markerEnd={edge.directed && edgeProgress > 0.9 ? "url(#arrowhead)" : ""}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const x = getAbsX(node.x);
          const y = getAbsY(node.y);
          const radius = (node.weight || 1) * 40;
          const nodePop = spring({ frame: frame - 20 - i * 6, fps, config: { damping: 14, stiffness: 100, mass: 0.8 } });

          return (
            <g key={node.id}>
              <circle
                cx={x} cy={y} r={radius * nodePop}
                fill={`url(#nodeGrad-${i}-${instanceId})`} stroke={backgroundColor ?? T.background} strokeWidth={4} opacity={nodePop}
              />
              {nodePop > 0.8 && (
                <text
                  x={x} y={y + radius + 30} textAnchor="middle"
                  style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
                >
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
