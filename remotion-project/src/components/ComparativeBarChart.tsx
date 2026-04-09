import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface ComparativeItem {
  label: string;
  leftValue: number;
  rightValue: number;
}

export interface ComparativeBarChartProps {
  data: ComparativeItem[];
  leftLabel?: string;
  rightLabel?: string;
  title: string;
  subtitle?: string;
  backgroundColor?: string;
}

export const ComparativeBarChart: React.FC<ComparativeBarChartProps> = ({
  data = [],
  leftLabel = "Grupo A",
  rightLabel = "Grupo B",
  title,
  subtitle,
  backgroundColor = Theme.colors.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const centerX = width / 2;
  const plotWidth = (width - margin * 2 - 400) / 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: Theme.colors.text, fontSize: Theme.typography.category.size }}>Nenhum dado para exibir.</p>
      </AbsoluteFill>
    );
  }

  const allValues = data.flatMap(d => [d.leftValue, d.rightValue]);
  const maxVal = Math.max(...allValues, 1);

  const barHeight = (plotHeight / data.length) * 0.7;
  const barGap = (plotHeight / data.length) * 0.3;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
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
          <linearGradient id={`leftGrad-${instanceId}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={Theme.chartColors[0]} />
            <stop offset="100%" stopColor={Theme.chartColors[0]} stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id={`rightGrad-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={Theme.chartColors[1]} />
            <stop offset="100%" stopColor={Theme.chartColors[1]} stopOpacity={0.8} />
          </linearGradient>
        </defs>

        {/* Labels de Lado */}
        <text x={centerX - 100} y={chartTop - 30} textAnchor="end" style={{ fontSize: Theme.typography.subtitle.size, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{leftLabel.toUpperCase()}</text>
        <text x={centerX + 100} y={chartTop - 30} textAnchor="start" style={{ fontSize: Theme.typography.subtitle.size, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{rightLabel.toUpperCase()}</text>

        {/* Eixo Central */}
        <line x1={centerX} y1={chartTop} x2={centerX} y2={chartTop + plotHeight} stroke={Theme.colors.grid} strokeWidth={2} opacity={0.5} />

        {data.map((d, i) => {
          const y = chartTop + i * (barHeight + barGap) + barHeight / 2;
          const pop = spring({ frame: frame - 25 - i * 4, fps, config: { damping: 14, stiffness: 100 } });
          
          const leftW = (d.leftValue / maxVal) * plotWidth;
          const rightW = (d.rightValue / maxVal) * plotWidth;

          return (
            <g key={i}>
              <text x={centerX} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.textSecondary, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{d.label}</text>

              <rect
                x={centerX - 100 - leftW * pop} y={y - barHeight / 2} width={leftW * pop} height={barHeight}
                fill={`url(#leftGrad-${instanceId})`} rx={6}
              />
              <rect
                x={centerX + 100} y={y - barHeight / 2} width={rightW * pop} height={barHeight}
                fill={`url(#rightGrad-${instanceId})`} rx={6}
              />

              {pop > 0.9 && (
                <>
                  <text x={centerX - 120 - leftW} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{d.leftValue.toLocaleString()}</text>
                  <text x={centerX + 120 + rightW} y={y} textAnchor="start" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{d.rightValue.toLocaleString()}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
