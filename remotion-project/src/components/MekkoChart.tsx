import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface MekkoSegment {
  label: string;
  value: number;
}

export interface MekkoColumn {
  label: string;
  totalValue: number;
  segments: MekkoSegment[];
}

export interface MekkoChartProps {
  data: MekkoColumn[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

export const MekkoChart: React.FC<MekkoChartProps> = ({
  theme = 'dark',
  data = [],
  subtitle,
  backgroundColor,
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  const totalMarketValue = useMemo(() => 
    data.reduce((acc, curr) => acc + curr.totalValue, 0) || 1, 
  [data]);

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotWidth = width - margin * 2;
  const plotHeight = height - margin * 2 - titleHeight - 120;
  const chartTop = margin + titleHeight;

  const columnsLayout = useMemo(() => {
    let currentX = margin;
    return data.map(col => {
      const colWidth = (col.totalValue / totalMarketValue) * plotWidth;
      const res = { ...col, x: currentX, width: colWidth };
      currentX += colWidth;
      return res;
    });
  }, [data, totalMarketValue, plotWidth, margin]);

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        style={bgStyle} 
        baseColor={backgroundColor ?? T.background} 
        accentColor={T.colors[0]} 
      />
      {/* ZONA 1 â€” CabeÃ§alho */}
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

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {data[0]?.segments.map((_, j) => (
            <linearGradient key={j} id={`mekkoGrad-${j}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.colors[j % T.colors.length]} />
              <stop offset="100%" stopColor={T.colors[j % T.colors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {columnsLayout.map((col, i) => {
          const colPop = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 14, stiffness: 60 } });
          const segmentSum = col.segments.reduce((acc, s) => acc + s.value, 0) || 1;
          let currentY = chartTop + plotHeight;

          return (
            <g key={i}>
              {/* Category Label */}
              {colPop > 0.6 && (
                <text
                  x={col.x + col.width / 2} y={chartTop - 30} textAnchor="middle"
                  style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
                >
                  {col.label} ({Math.round((col.totalValue / totalMarketValue) * 100)}%)
                </text>
              )}

              {col.segments.map((seg, j) => {
                const segHeight = (seg.value / segmentSum) * plotHeight;
                const rectY = currentY - segHeight * colPop;
                const rectH = segHeight * colPop;
                currentY -= segHeight;

                return (
                  <g key={j}>
                    <rect
                      x={col.x} y={rectY} width={col.width - 4} height={rectH}
                      fill={`url(#mekkoGrad-${j}-${instanceId})`} stroke={backgroundColor ?? T.background} strokeWidth={2} opacity={0.85}
                    />
                    {rectH > 60 && col.width > 80 && colPop > 0.9 && (
                      <text
                        x={col.x + col.width/2} y={rectY + rectH/2} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: Theme.typography.axis.size, fill: "#fff", fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
                      >
                        {Math.round((seg.value / segmentSum) * 100)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
