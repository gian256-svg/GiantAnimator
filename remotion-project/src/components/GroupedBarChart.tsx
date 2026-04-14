import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface GroupedBarSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface GroupedBarChartProps {
  categories: string[];
  series: GroupedBarSeries[];
  title: string;
  subtitle?: string;
  yLabel?: string;
  showLegend?: boolean;
  showValues?: boolean;
  highlightGroup?: number;
  backgroundColor?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  categories = [],
  series = [],
  title,
  subtitle,
  yLabel,
  showLegend = true,
  showValues = true,
  highlightGroup,
  backgroundColor ?? T.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const chartTop = margin + titleHeight;
  const plotWidth = width - margin * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;

  if (categories.length === 0 || series.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor ?? T.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text }}>Dados insuficientes.</p>
      </AbsoluteFill>
    );
  }

  const maxValue = Math.max(...series.flatMap(s => s.values), 1);
  const groupGap = 0.3;
  const barGap = 0.1;
  const categoryWidth = plotWidth / categories.length;
  const groupWidth = categoryWidth * (1 - groupGap);
  const barWidth = groupWidth / series.length * (1 - barGap);

  const formatValue = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

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
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`groupGrad-${si}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color || T.colors[si % T.colors.length]} />
              <stop offset="100%" stopColor={s.color || T.colors[si % T.colors.length]} stopOpacity={0.85} />
            </linearGradient>
          ))}
        </defs>

        {/* Legend (ZONA 1 inferior) */}
        {showLegend && (
          <g transform={`translate(${width - margin}, ${margin + 80})`}>
            {series.map((s, si) => (
              <g key={si} transform={`translate(${-(series.length - 1 - si) * 350}, 0)`}>
                <rect width={30} height={30} fill={`url(#groupGrad-${si}-${instanceId})`} rx={4} />
                <text x={45} y={22} style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontWeight: 500, fontFamily: Theme.typography.fontFamily }}>{s.name}</text>
              </g>
            ))}
          </g>
        )}

        {/* Grid Y */}
        <g opacity={0.4}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = chartTop + plotHeight - v * plotHeight;
            return (
              <React.Fragment key={v}>
                <line x1={margin} y1={y} x2={width - margin} y2={y} stroke={T.grid} strokeWidth={1} />
                <text x={margin - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{formatValue(v * maxValue)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Grupos */}
        {categories.map((cat, ci) => {
          const groupX = margin + ci * categoryWidth + (categoryWidth * groupGap) / 2;
          const groupProgress = spring({ frame: frame - 30 - ci * 8, fps, config: { damping: 14, stiffness: 60 } });

          return (
            <g key={ci}>
              {series.map((s, si) => {
                const x = groupX + si * (barWidth / (1 - barGap));
                const h = (s.values[ci] / maxValue) * plotHeight * groupProgress;
                const y = chartTop + plotHeight - h;
                const isGroupHighlighted = highlightGroup === ci;

                return (
                  <g key={si}>
                    <rect
                      x={x} y={y} width={barWidth} height={Math.max(h, 2)}
                      fill={`url(#groupGrad-${si}-${instanceId})`} rx={Theme.spacing.barRadius}
                      style={{ filter: isGroupHighlighted ? `brightness(${Theme.effects.highlightScale})` : 'none' }}
                    />
                    {showValues && groupProgress > 0.9 && (
                      <text x={x + barWidth/2} y={y - 15} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{formatValue(s.values[ci])}</text>
                    )}
                  </g>
                );
              })}
              <text x={groupX + groupWidth/2} y={chartTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{cat}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
