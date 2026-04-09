import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface FunnelStage {
  label: string;
  value: number;
}

export interface FunnelChartProps {
  data: FunnelStage[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data = [],
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
  const paddingX = 400;
  const chartTop = margin + titleHeight;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const stageHeight = plotHeight / data.length;

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: Theme.colors.text, fontSize: Theme.typography.category.size }}>Nenhum dado para exibir.</p>
      </AbsoluteFill>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;

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
          {data.map((_, i) => (
            <linearGradient key={i} id={`funnelGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
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
              <polygon points={points} fill={`url(#funnelGrad-${i}-${instanceId})`} stroke={"rgba(255,255,255,0.1)"} strokeWidth={2} />

              {/* Labels (Esquerda e Direita) */}
              <text
                x={width / 2 - (topW / 2) - 40} y={yT + stageHeight/2} textAnchor="end" dominantBaseline="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}
              >
                {stage.label}
              </text>

              <g transform={`translate(${width / 2 + (topW / 2) + 40}, ${yT + stageHeight/2})`}>
                <text x={0} y={-10} textAnchor="start" style={{ fontSize: Theme.typography.subtitle.size, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                  {stage.value.toLocaleString()}
                </text>
                {i > 0 && (
                  <text x={0} y={30} textAnchor="start" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.textSecondary, fontFamily: Theme.typography.fontFamily }}>
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
