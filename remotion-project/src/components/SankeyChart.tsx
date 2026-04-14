import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface SankeyNode {
  id: string;
  label: string;
  column: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const SankeyChart: React.FC<SankeyChartProps> = ({
  nodes = [],
  links = [],
  title,
  subtitle,
  backgroundColor ?? T.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const nodeWidth = 40;
  const plotWidth = width - margin * 2 - nodeWidth - 400; // Recuo para labels
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  const layout = useMemo(() => {
    const nodeStats = nodes.reduce((acc, n) => {
      acc[n.id] = { in: 0, out: 0, total: 0 };
      return acc;
    }, {} as Record<string, { in: number; out: number; total: number }>);

    links.forEach((l) => {
      if (nodeStats[l.source]) nodeStats[l.source].out += l.value;
      if (nodeStats[l.target]) nodeStats[l.target].in += l.value;
    });

    Object.keys(nodeStats).forEach((id) => {
      nodeStats[id].total = Math.max(nodeStats[id].in, nodeStats[id].out);
    });

    const cols = Array.from(new Set(nodes.map((n) => n.column))).sort((a, b) => a - b);
    const colGap = plotWidth / (cols.length - 1 || 1);
    const colTotals = cols.map((col) => {
      return nodes.filter((n) => n.column === col).reduce((sum, n) => sum + nodeStats[n.id].total, 0);
    });
    const maxColTotal = Math.max(...colTotals) || 1;

    const nodesLayout = nodes.map((n) => {
      const colIdx = cols.indexOf(n.column);
      const x = margin + 200 + colIdx * colGap;
      const h = (nodeStats[n.id].total / maxColTotal) * plotHeight;
      const nodesInCol = nodes.filter((node) => node.column === n.column);
      const idxInCol = nodesInCol.indexOf(n);
      const totalHInCol = nodesInCol.reduce((sum, node) => sum + (nodeStats[node.id].total / maxColTotal) * plotHeight, 0);
      const gapY = (plotHeight - totalHInCol) / (nodesInCol.length + 1);
      const prevHSum = nodesInCol.slice(0, idxInCol).reduce((sum, node) => sum + (nodeStats[node.id].total / maxColTotal) * plotHeight, 0);
      const y = chartTop + gapY * (idxInCol + 1) + prevHSum;
      return { ...n, x, y, h, total: nodeStats[n.id].total };
    });

    const sourceOffsets: Record<string, number> = {};
    const targetOffsets: Record<string, number> = {};

    const linksLayout = links.map((l, i) => {
      const sNode = nodesLayout.find((n) => n.id === l.source)!;
      const tNode = nodesLayout.find((n) => n.id === l.target)!;
      const sOff = sourceOffsets[l.source] || 0;
      const tOff = targetOffsets[l.target] || 0;
      const sY = sNode.y + (sNode.total > 0 ? (sOff / sNode.total) * sNode.h : 0);
      const tY = tNode.y + (tNode.total > 0 ? (tOff / tNode.total) * tNode.h : 0);
      const linkH = (l.value / maxColTotal) * plotHeight;
      sourceOffsets[l.source] = sOff + l.value;
      targetOffsets[l.target] = tOff + l.value;
      return { ...l, sX: sNode.x + nodeWidth, sY: sY + linkH / 2, tX: tNode.x, tY: tY + linkH / 2, h: linkH, color: T.colors[nodes.indexOf(sNode) % T.colors.length] };
    });

    return { nodes: nodesLayout, links: linksLayout };
  }, [nodes, links, plotWidth, plotHeight, margin, chartTop]);

  return (
    <AbsoluteFill style={{ backgroundColor ?? T.background }}>
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
        {/* Links */}
        {layout.links.map((l, i) => {
          const cpX1 = l.sX + (l.tX - l.sX) / 2;
          const cpX2 = l.tX - (l.tX - l.sX) / 2;
          const pathD = `M ${l.sX} ${l.sY} C ${cpX1} ${l.sY}, ${cpX2} ${l.tY}, ${l.tX} ${l.tY}`;
          const progress = spring({ frame: frame - 60 - i * 3, fps, config: { damping: 15, stiffness: 60 } });
          return (
            <path
              key={i} d={pathD} fill="none" stroke={l.color} strokeWidth={l.h * progress} strokeOpacity={0.3}
            />
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((n, i) => {
          const progress = spring({ frame: frame - 20 - i * 4, fps, config: { damping: 14, stiffness: 100 } });
          const color = T.colors[nodes.indexOf(n) % T.colors.length];
          return (
            <g key={n.id} opacity={progress}>
              <rect x={n.x} y={n.y} width={nodeWidth} height={n.h} fill={color} rx={8} />
              <text
                x={n.column === 0 ? n.x - 20 : n.x + nodeWidth + 20} y={n.y + n.h / 2}
                textAnchor={n.column === 0 ? "end" : "start"} dominantBaseline="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
