import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate
} from "remotion";
import { Theme } from "../theme";

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
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data = [],
  seriesLabels = [],
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
  const paddingX = margin + 100;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0))) * 1.1;
  const barGap = 0.3;
  const categoryWidth = plotWidth / data.length;
  const barWidth = categoryWidth * (1 - barGap);

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + "k";
    return val.toString();
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {seriesLabels.map((_, i) => (
            <linearGradient key={i} id={`stackedGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* Legend */}
        <g transform={`translate(${width - margin}, ${margin + 80})`}>
          {seriesLabels.map((sl, si) => (
            <g key={si} transform={`translate(${-(seriesLabels.length - 1 - si) * 350}, 0)`}>
              <rect width={30} height={30} fill={`url(#stackedGrad-${si}-${instanceId})`} rx={4} />
              <text x={45} y={22} style={{ fontSize: 28, fill: Theme.colors.textSecondary, fontWeight: 500, fontFamily: Theme.typography.fontFamily }}>{sl}</text>
            </g>
          ))}
        </g>

        {/* Grid Y */}
        <g opacity={0.4}>
          {[0, 0.5, 1].map(v => {
            const y = chartTop + plotHeight - v * plotHeight;
            return (
              <React.Fragment key={v}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke={Theme.colors.grid} strokeWidth={1} />
                <text x={paddingX - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 24, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{formatValue(v * maxTotal)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Bars */}
        {data.map((cat, ci) => {
          const x = paddingX + ci * categoryWidth + (categoryWidth * barGap) / 2;
          let currentAcc = 0;
          return (
            <g key={ci}>
              {cat.values.map((v, si) => {
                const progress = spring({ frame: frame - 30 - ci * 5 - si * 2, fps, config: { damping: 14, stiffness: 60 } });
                const segH = (v / maxTotal) * plotHeight;
                const yB = chartTop + plotHeight - (currentAcc / maxTotal) * plotHeight;
                const curH = segH * progress;
                const curY = yB - curH;
                currentAcc += v;
                return (
                  <rect key={si} x={x} y={curY} width={barWidth} height={Math.max(curH, 2)} fill={`url(#stackedGrad-${si}-${instanceId})`} rx={0} />
                );
              })}
              <text x={x + barWidth/2} y={chartTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: 28, fill: Theme.colors.ui.axisText, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{cat.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
