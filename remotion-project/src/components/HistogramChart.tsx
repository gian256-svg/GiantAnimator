import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface HistogramChartProps {
  rawData: number[];
  binCount?: number;
  showKDE?: boolean;
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  showValueLabels?: boolean;
  theme?: string;
  colors?: string[];
  textColor?: string;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  rawData = [],
  binCount = 12,
  showKDE = true,
  title,
  subtitle,
  backgroundColor,
  showValueLabels = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  const { bins, maxValue } = useMemo(() => {
    if (rawData.length === 0) return { bins: [], maxValue: 1 };
    const min = Math.min(...rawData);
    const max = Math.max(...rawData);
    const range = max - min || 1;
    const binWidthVal = range / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      min: min + i * binWidthVal,
      max: min + (i + 1) * binWidthVal,
      count: 0
    }));
    rawData.forEach(val => {
      let idx = Math.floor((val - min) / binWidthVal);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });
    return { bins, maxValue: Math.max(...bins.map(b => b.count), 1) };
  }, [rawData, binCount]);

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotLeft = margin + 120;
  const plotWidth = width - plotLeft - margin;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  const getAbsY = (count: number) => chartTop + plotHeight - (count / maxValue) * plotHeight;
  const barWidth = plotWidth / binCount;

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
          <linearGradient id={`histGrad-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.colors[0]} />
            <stop offset="100%" stopColor={T.colors[0]} stopOpacity={0.8} />
          </linearGradient>
        </defs>

        {/* Eixo Y */}
        <g opacity={0.4}>
          {[0, 0.5, 1].map(v => {
            const count = Math.round(v * maxValue);
            const y = getAbsY(count);
            return (
              <g key={v}>
              <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={1} opacity={0.3} />
              <text x={plotLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{count}</text>
            </g>
            );
          })}
        </g>

        {/* Barras */}
        {bins.map((b, i) => {
          const h = (b.count / maxValue) * plotHeight;
          const x = plotLeft + i * barWidth;
          const barPop = spring({ frame: frame - 25 - i * 4, fps, config: { damping: 14, stiffness: 60 } });

          return (
            <g key={i}>
              <rect
                x={x} y={chartTop + plotHeight - h * barPop} width={barWidth} height={h * barPop}
                fill={`url(#histGrad-${instanceId})`} stroke={backgroundColor ?? T.background} strokeWidth={2} opacity={0.85} rx={4}
              />
              {showValueLabels && barPop > 0.8 && (
                <text x={x + barWidth / 2} y={chartTop + plotHeight - h * barPop - 15} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{b.count}</text>
              )}
              {i % 2 === 0 && (
                <text x={x + barWidth / 2} y={chartTop + plotHeight + 50} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{`${Math.round(b.min)}-${Math.round(b.max)}`}</text>
              )}
            </g>
          );
        })}

        {/* KDE */}
        {showKDE && bins.length > 0 && (() => {
          const points = bins.map((b, i) => `${plotLeft + i * barWidth + barWidth / 2},${getAbsY(b.count)}`).join(" ");
          const kdeProgress = spring({ frame: frame - 60, fps, config: { damping: 20, stiffness: 40 } });
          return (
            <polyline
              points={points} fill="none" stroke={Theme.colors.semantic.highlight} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={kdeProgress}
            />
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};
