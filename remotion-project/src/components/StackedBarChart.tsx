import React, { useId, useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface StackedBarData {
  label: string;
  values: number[];
}

export interface StackedBarChartProps {
  data: StackedBarData[];
  seriesLabels: string[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data: propData = [],
  seriesLabels = [],
  title,
  subtitle,
  backgroundColor,
  textColor,
  theme = 'dark',
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  
  const initialT = resolveTheme(theme ?? 'dark');
  const resolvedBg = backgroundColor ?? initialT.background;
  const T = resolveTheme(theme ?? 'dark', resolvedBg);
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = 128;
  const titleHeight = 160;
  const paddingX = margin + 100;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  const data = useMemo(() => Array.isArray(propData) ? propData : [], [propData]);
  const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)), 1);
  const barGap = 0.3;
  const categoryWidth = plotWidth / data.length;
  const barWidth = categoryWidth * (1 - barGap);

  if (data.length === 0) return null;

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        style={bgStyle} 
        baseColor={resolvedBg} 
        accentColor={T.colors[0]} 
      />
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: T.text, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: T.textMuted, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {seriesLabels.map((_, i) => (
            <linearGradient key={i} id={`stackedGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.colors[i % T.colors.length]} />
              <stop offset="100%" stopColor={T.colors[i % T.colors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* Legend */}
        <g transform={`translate(${width - margin}, ${margin + 80})`}>
           {seriesLabels.map((sl, i) => (
            <g key={i} transform={`translate(0, ${i * 40})`}>
              <rect width={30} height={20} fill={T.colors[i % T.colors.length]} rx={4} />
              <text x={45} y={22} style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontWeight: 500, fontFamily: Theme.typography.fontFamily }}>{sl}</text>
            </g>
          ))}
        </g>

        {/* Grid Y */}
        <g opacity={0.4}>
          {[0, 0.5, 1].map(v => {
            const y = chartTop + plotHeight - v * plotHeight;
            return (
              <g key={v}>
                <line x1={paddingX} y1={y} x2={paddingX + plotWidth} y2={y} stroke={T.grid} strokeWidth={1} opacity={0.3} />
                <text x={paddingX - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontFamily: Theme.typography.fontFamily }}>{Math.round(v * maxTotal)}</text>
              </g>
            );
          })}
        </g>

        {/* Bars */}
        {data.map((cat, ci) => {
          const x = paddingX + ci * categoryWidth + (categoryWidth * barGap) / 2;
          let currentAcc = 0;
          return (
            <g key={ci}>
              {cat.values.map((v, vi) => {
                const progress = spring({ 
                  frame: frame - 30 - ci * 5 - vi * 2, 
                  fps, 
                  config: { 
                    damping: 80, 
                    stiffness: 200, 
                    overshootClamping: true 
                  } 
                });
                const currentH = ((v / maxTotal) * plotHeight) * progress;
                const currentY = chartTop + plotHeight - ((currentAcc + v) / maxTotal) * plotHeight - (currentH - (v / maxTotal) * plotHeight * progress);
                currentAcc += v;
                return (
                  <rect key={vi} x={x} y={currentY} width={barWidth} height={Math.max(currentH, 2)} fill={T.colors[vi % T.colors.length]} rx={4} />
                );
              })}
               <text x={x + barWidth/2} y={chartTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{cat.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
