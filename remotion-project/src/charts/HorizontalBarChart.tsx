import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface HorizontalBarData {
  label: string;
  value: number;
}

export interface HorizontalBarChartProps {
  data: HorizontalBarData[];
  title: string;
  subtitle?: string;
}

const format = (n: number) => {
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000) return (n/1000).toFixed(1) + "k";
  return n.toLocaleString();
};

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
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

  const labelAreaWidth = usableWidth * 0.25; // 896px
  const plotWidth = usableWidth - labelAreaWidth - 100; // 100px respiro direita
  const plotHeight = usableHeight;
  const plotLeft = originX + labelAreaWidth;
  const plotTop = originY;

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1) * 1.1;
  const rowHeight = plotHeight / data.length;
  const barGap = 0.3;
  const barHeight = rowHeight * (1 - barGap);

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      <div style={{ position: 'absolute', top: 40, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {data.map((_, i) => (
            <linearGradient key={i} id={`hbarGrad-${i}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* GRID X */}
        <g opacity={0.3}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const x = plotLeft + v * plotWidth;
            return (
              <React.Fragment key={v}>
                <line x1={x} y1={plotTop} x2={x} y2={plotTop + plotHeight} stroke={Theme.colors.grid} strokeWidth={2} />
                <text x={x} y={plotTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontFamily: Theme.typography.fontFamily }}>{format(v * maxVal)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* BARS */}
        {data.map((d, i) => {
          const pop = spring({ frame: frame - 20 - i * 4, fps, config: { damping: 14, stiffness: 60 } });
          const bY = plotTop + i * rowHeight + (rowHeight * barGap) / 2;
          const bW = (d.value / maxVal) * plotWidth * pop;
          
          return (
            <g key={i}>
              {/* Category Label */}
              <text x={plotLeft - 40} y={bY + barHeight/2} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 36, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                {d.label}
              </text>

              {/* Bar */}
              <rect x={plotLeft} y={bY} width={Math.max(bW, 0)} height={barHeight} fill={`url(#hbarGrad-${i}-${instanceId})`} rx={12} />

              {/* Value label */}
              {pop > 0.9 && (
                <text x={plotLeft + bW + 20} y={bY + barHeight/2} dominantBaseline="middle" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>
                  {format(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
