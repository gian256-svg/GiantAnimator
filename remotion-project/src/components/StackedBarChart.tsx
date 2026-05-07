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
  seriesColors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light' | 'transparent';
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data: propData = [],
  seriesLabels = [],
  title,
  subtitle,
  backgroundColor,
  textColor,
  theme = 'dark',
  colors,
  seriesColors,
  bgStyle = 'none',
  backgroundType,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const initialT = resolveTheme(theme ?? 'dark');
  const resolvedBg = backgroundColor ?? initialT.background;
  const T = resolveTheme(theme ?? 'dark', resolvedBg, backgroundType, seriesColors || colors, textColor);
  const instanceId = useId().replace(/:/g, "");

  const paletteFromProps = (colors ?? seriesColors)?.filter(Boolean) ?? [];
  const resolvedColors = paletteFromProps.length > 0 ? paletteFromProps : [...T.colors];

  const fs = (base: number) => Math.round(base * (width / 1920));

  // Safe Zone 4K — valores escalados
  const margin = fs(100);
  const titleHeight = fs(180);
  const legendH = seriesLabels.length > 0 ? fs(60) : 0;
  const paddingX = margin + fs(120);
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - margin * 2 - titleHeight - legendH - fs(120);
  const chartTop = margin + titleHeight + legendH;

  const data = useMemo(() => Array.isArray(propData) ? propData : [], [propData]);
  const maxTotal = Math.max(...data.map(d => d.values.reduce((a, b) => a + b, 0)), 1);
  const barGap = 0.3;
  const categoryWidth = plotWidth / data.length;
  const barWidth = categoryWidth * (1 - barGap);

  if (data.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : resolvedBg }} />;
  }

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily,
      backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : undefined
    }}>
      <DynamicBackground 
        baseColor={resolvedBg}
        accentColor={resolvedColors[0]}
        backgroundType={backgroundType}
      />
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        padding: `0 ${fs(100)}px`, boxSizing: 'border-box',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ fontSize: fs(Theme.typography.title.size), fontWeight: Theme.typography.title.weight, color: T.text, fontFamily: Theme.typography.fontFamily, wordBreak: 'break-word' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(Theme.typography.subtitle.size), color: T.textMuted, fontFamily: Theme.typography.fontFamily, marginTop: fs(12) }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {seriesLabels.map((_, i) => (
            <linearGradient key={i} id={`stackedGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolvedColors[i % resolvedColors.length]} />
              <stop offset="100%" stopColor={resolvedColors[i % resolvedColors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* Legend — centralizada abaixo do título */}
        {seriesLabels.length > 0 && (
          <foreignObject x={0} y={margin + titleHeight} width={width} height={legendH}>
            <div style={{
              display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
              gap: fs(32), padding: `0 ${fs(100)}px`, boxSizing: 'border-box',
              opacity: interpolate(frame, [15, 35], [0, 1])
            } as React.CSSProperties}>
              {seriesLabels.map((sl, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(10) }}>
                  <div style={{ width: fs(24), height: fs(24), borderRadius: fs(4), backgroundColor: resolvedColors[i % resolvedColors.length], flexShrink: 0 }} />
                  <span style={{ fontSize: fs(22), color: T.textMuted, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{sl}</span>
                </div>
              ))}
            </div>
          </foreignObject>
        )}

        {/* Grid Y */}
        <g opacity={0.4}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const y = chartTop + plotHeight - v * plotHeight;
            return (
              <g key={v}>
                <line x1={paddingX} y1={y} x2={paddingX + plotWidth} y2={y} stroke={T.grid} strokeWidth={fs(1.5)} strokeDasharray={fs(6)} opacity={0.5} />
                <text x={paddingX - fs(16)} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(22), fill: T.textMuted, fontFamily: Theme.typography.fontFamily }}>{Math.round(v * maxTotal)}</text>
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
                  const fillColor = seriesLabels.length === 1
                    ? resolvedColors[ci % resolvedColors.length]
                    : resolvedColors[vi % resolvedColors.length];

                  return (
                    <rect key={vi} x={x} y={currentY} width={barWidth} height={Math.max(currentH, 2)} fill={fillColor} rx={4} />
                  );
              })}
               <text x={x + barWidth/2} y={chartTop + plotHeight + fs(50)} textAnchor="middle" style={{ fontSize: fs(22), fill: T.textMuted, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{cat.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
