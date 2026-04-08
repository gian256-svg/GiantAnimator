import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
  subtitle?: string;
}

const format = (n: number) => {
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return (n/1000).toFixed(1) + "k";
  return n.toString();
};

export const BarChart: React.FC<BarChartProps> = ({
  data = [],
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÁREA ÚTIL 4K (REGRA GLOBAL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const usableWidth = 3584; 
  const usableHeight = 1920; 
  const originX = 128;
  const originY = 160;

  const yAxisLabelWidth = 160;
  const chartHeight = usableHeight * 0.85; // 1632
  const xAxisHeight = usableHeight * 0.15; // 288

  const plotWidth = usableWidth - yAxisLabelWidth;
  const plotHeight = chartHeight;
  const plotLeft = originX + yAxisLabelWidth;
  const plotTop = originY;

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1) * 1.15;
  const categoryWidth = plotWidth / data.length;
  const barGap = 0.25;
  const barWidth = categoryWidth * (1 - barGap);

  const getY = (v: number) => plotTop + plotHeight - (v / maxVal) * plotHeight;

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      {/* HEADER */}
      <div style={{ position: 'absolute', top: 40, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {data.map((_, i) => (
            <linearGradient key={i} id={`barGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* GRID Y */}
        <g opacity={0.4}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = getY(v * maxVal);
            return (
              <React.Fragment key={v}>
                <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={Theme.colors.grid} strokeWidth={2} />
                <text x={plotLeft - 30} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontFamily: Theme.typography.fontFamily }}>{format(v * maxVal)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* BARS */}
        {data.map((d, i) => {
          const pop = spring({ frame: frame - 20 - i * 3, fps, config: { damping: 12, stiffness: 100 } });
          const bX = plotLeft + i * categoryWidth + (categoryWidth * barGap) / 2;
          const bH = (d.value / maxVal) * plotHeight * pop;
          const bY = plotTop + plotHeight - bH;
          
          return (
            <g key={i}>
              <rect x={bX} y={bY} width={barWidth} height={bH} fill={`url(#barGrad-${i}-${instanceId})`} rx={12} />
              
              {/* Value Label */}
              {pop > 0.9 && (
                <text x={bX + barWidth/2} y={bY - 20} textAnchor="middle" style={{ fontSize: 32, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                  {format(d.value)}
                </text>
              )}

              {/* X Axis Label */}
              <text x={bX + barWidth/2} y={plotTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: 36, fill: Theme.colors.textSecondary, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
