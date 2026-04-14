import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface ParetoItem {
  label: string;
  value: number;
}

export interface ParetoChartProps {
  data: ParetoItem[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({
  theme = 'dark',
  data = [],
  title,
  subtitle,
  backgroundColor ?? T.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  const processedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((acc, curr) => acc + curr.value, 0) || 1;
    let cumulative = 0;
    return sorted.map(item => {
      cumulative += item.value;
      return { ...item, cumulativePerc: (cumulative / total) * 100 };
    });
  }, [data]);

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotLeft = margin + 120;
  const plotRight = margin + 120;
  const plotWidth = width - plotLeft - plotRight;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  if (processedData.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor ?? T.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text }}>Dados insuficientes.</p>
      </AbsoluteFill>
    );
  }

  const maxVal = Math.max(...sortedData.map(d => d.value), 1);
  const getLeftY = (val: number) => chartTop + plotHeight - (val / maxVal) * plotHeight;
  const getRightY = (perc: number) => chartTop + plotHeight - (perc / 100) * plotHeight;
  const getX = (i: number) => plotLeft + (i + 0.5) * (plotWidth / processedData.length);
  const barWidth = (plotWidth / processedData.length) * 0.8;

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
          <linearGradient id={`paretoGrad-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.colors[0]} />
            <stop offset="100%" stopColor={T.colors[0]} stopOpacity={0.8} />
          </linearGradient>
        </defs>

        {/* Eixo Esquerdo (Valores) */}
        <g opacity={0.4}>
          {[0, 0.5, 1].map(v => {
            const val = Math.round(v * maxVal);
            const y = getLeftY(val);
            return (
              <React.Fragment key={v}>
                <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={1} />
                <text x={plotLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{val}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Eixo Direito (%) */}
        <g opacity={0.4}>
          {[0, 50, 80, 100].map(p => {
            const y = getRightY(p);
            return (
              <g key={p}>
                <text x={width - plotRight + 20} y={y} textAnchor="start" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: p === 80 ? Theme.colors.semantic.highlight : Theme.colors.ui.axisText, fontWeight: p === 80 ? 900 : 400, fontFamily: Theme.typography.fontFamily }}>{p}%</text>
                {p === 80 && (
                  <line x1={plotLeft} y1={y} x2={width - plotRight} y2={y} stroke={Theme.colors.semantic.highlight} strokeWidth={4} strokeDasharray="16 8" opacity={0.8} />
                )}
              </g>
            );
          })}
        </g>

        {/* Barras */}
        {sortedData.map((d, i) => {
          const h = (d.value / maxVal) * plotHeight;
          const x = getX(i) - barWidth / 2;

          return (
            <g key={i}>
              <rect x={x} y={chartTop + plotHeight - h} width={barWidth} height={h} fill={Theme.colors.series[0]} rx={4} />
              <text x={x + barWidth / 2} y={chartTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{d.label}</text>
            </g>
          );
        })}

        {/* Linha Acumulada */}
        {(() => {
          const lProgress = spring({ frame: frame - 60, fps, config: { damping: 20, stiffness: 45 } });
          const points = processedData.map((d, i) => `${getX(i)},${getRightY(d.cumulativePerc)}`);
          if (lProgress <= 0) return null;
          
          return (
            <polyline
              points={points.join(" ")} fill="none" stroke={Theme.colors.semantic.highlight} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={lProgress}
            />
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};
