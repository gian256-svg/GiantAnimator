import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface FunnelStage {
  label: string;
  value: number;
}

export interface FunnelChartProps {
  data: FunnelStage[];
  title: string;
  subtitle?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  theme = 'dark',
  data = [],
  title,
  subtitle,
  backgroundColor,
  colors,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  const resolvedBg     = backgroundColor ?? T.background;
  const resolvedText   = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Utility: darken a hex color by amount (0–1)
  const darken = (hex: string, amount: number): string => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.min(255, ((n >> 8)  & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.min(255,  (n        & 0xff) * (1 - amount)));
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  };

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const paddingX = 400;
  const chartTop = margin + titleHeight;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const stageHeight = plotHeight / data.length;

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: resolvedBg, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: resolvedText, fontSize: Theme.typography.category.size }}>Nenhum dado para exibir.</p>
      </AbsoluteFill>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>
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
          {data.map((_, i) => {
            const baseColor = resolvedColors[i % resolvedColors.length];
            return (
              <linearGradient key={i} id={`funnelGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                {/* Shine highlight at top — subtle bright edge */}
                <stop offset="0%"   stopColor={baseColor} stopOpacity={1} />
                <stop offset="8%"   stopColor={baseColor} stopOpacity={0.92} />
                {/* Rich mid color */}
                <stop offset="50%"  stopColor={baseColor} stopOpacity={0.85} />
                {/* Deep shadow at bottom — progressive darkening */}
                <stop offset="100%" stopColor={darken(baseColor, 0.38)} stopOpacity={0.95} />
              </linearGradient>
            );
          })}
          {/* Shine overlay gradient (horizontal luminosity streak) */}
          <linearGradient id={`funnelShine-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0.12)" />
            <stop offset="60%"  stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {data.map((stage, i) => {
          const topW = (stage.value / maxValue) * plotWidth;
          const nextVal = data[i+1]?.value || stage.value * 0.8;
          const bottomW = (nextVal / maxValue) * plotWidth;

          const yT = chartTop + i * stageHeight;
          const yB = yT + stageHeight - 10; // Gap entre estágios

          const progress = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 14, stiffness: 100 } });

          const xTL = width / 2 - (topW / 2);
          const xTR = width / 2 + (topW / 2);
          const xBL = width / 2 - (bottomW / 2);
          const xBR = width / 2 + (bottomW / 2);

          const points = `${xTL},${yT} ${xTR},${yT} ${xBR},${yB} ${xBL},${yB}`;

          return (
            <g key={i} opacity={progress}>
              {/* Stage body with depth gradient */}
              <polygon
                points={points}
                fill={`url(#funnelGrad-${i}-${instanceId})`}
                stroke={"rgba(255,255,255,0.08)"}
                strokeWidth={2}
              />
              {/* Shine overlay — horizontal luminosity streak */}
              <polygon
                points={points}
                fill={`url(#funnelShine-${instanceId})`}
                opacity={0.6}
              />

              {/* Labels (Esquerda e Direita) */}
              <text
                x={width / 2 - (topW / 2) - 40} y={yT + stageHeight/2} textAnchor="end" dominantBaseline="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}
              >
                {stage.label}
              </text>

              <g transform={`translate(${width / 2 + (topW / 2) + 40}, ${yT + stageHeight/2})`}>
                <text x={0} y={-10} textAnchor="start" style={{ fontSize: Theme.typography.subtitle.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                  {stage.value.toLocaleString()}
                </text>
                {i > 0 && (
                  <text x={0} y={30} textAnchor="start" style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontFamily: Theme.typography.fontFamily }}>
                    Conv: {((stage.value / data[i-1].value) * 100).toFixed(1)}%
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
