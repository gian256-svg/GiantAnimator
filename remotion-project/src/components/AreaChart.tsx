import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface AreaChartProps {
  data?: { label: string; value: number }[];
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title: string;
  subtitle?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

const format = (n: number) => {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toLocaleString();
};

export const AreaChart: React.FC<AreaChartProps> = ({
  theme = 'dark',
  data = [],
  series,
  title,
  subtitle,
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // ÁREA ÚTIL 4K
  const usableWidth = 3584;
  const usableHeight = 1920;
  const originX = 128;
  const originY = 160;

  const yAxisLabelWidth = 160;
  const chartHeight = usableHeight * 0.85;
  const plotWidth = usableWidth - yAxisLabelWidth;
  const plotHeight = chartHeight;
  const plotLeft = originX + yAxisLabelWidth;
  const plotTop = originY;

  // Normalização
  const normalizedSeries = series || [
    {
      label: title,
      data: data.map((d) => d.value),
    },
  ];
  const xAxisLabels = labels || data.map((d) => d.label);

  if (xAxisLabels.length < 2) return null;

  const allValues = normalizedSeries.flatMap((s) => s.data);
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues, 1);
  const range = maxV - minV || 1;

  const getX = (i: number) => plotLeft + (i / (xAxisLabels.length - 1)) * plotWidth;
  const getY = (v: number) => plotTop + plotHeight - ((v - minV) / range) * plotHeight;

  // 🎬 ANIMAÇÃO REFORÇADA (GAUNTLET T06)
  const progress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 80, stiffness: 200, overshootClamping: true },
  });

  const rawCount = Math.min(Math.ceil(progress * xAxisLabels.length), xAxisLabels.length);
  const stableCount = progress >= 1 ? xAxisLabels.length : rawCount;

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        style={bgStyle} 
        baseColor={T.background} 
        accentColor={T.colors[0]} 
      />
      {/* HEADER */}
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {/* GRID Y */}
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const val = minV + v * range;
            const y = getY(val);
            return (
              <React.Fragment key={v}>
                <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke="rgba(255, 255, 255, 0.15)" strokeWidth={2} />
                <text
                  x={plotLeft - 30}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 32, fill: "rgba(255, 255, 255, 0.6)", fontFamily: Theme.typography.fontFamily }}
                >
                  {format(val)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* SÉRIES (ÁREAS E LINHAS) */}
        {normalizedSeries.map((s, sIndex) => {
          if (stableCount < 1) return null;
          const color = s.color || T.colors[sIndex % T.colors.length];

          const linePath = s.data
            .slice(0, stableCount)
            .map((v, i) => (i === 0 ? "M" : "L") + ` ${getX(i)} ${getY(v)}`)
            .join(" ");

          const areaPath = stableCount >= 2
            ? linePath + ` L ${getX(stableCount - 1)} ${plotTop + plotHeight} L ${getX(0)} ${plotTop + plotHeight} Z`
            : "";

          return (
            <g key={sIndex}>
              <linearGradient id={`areaGrad-${instanceId}-${sIndex}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>

              {stableCount >= 2 && <path d={areaPath} fill={`url(#areaGrad-${instanceId}-${sIndex})`} />}
              <path d={linePath} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Ponta da Linha (Dot Indicador) */}
              <circle cx={getX(stableCount - 1)} cy={getY(s.data[stableCount - 1])} r={12} fill={color} stroke="#fff" strokeWidth={4} />
            </g>
          );
        })}

        {/* X AXIS LABELS */}
        <g>
          {xAxisLabels.map((l, i) => {
            if (xAxisLabels.length > 12 && i % Math.ceil(xAxisLabels.length / 10) !== 0) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={plotTop + plotHeight + 60}
                textAnchor="middle"
                style={{ fontSize: 32, fill: "rgba(255, 255, 255, 0.6)", fontFamily: Theme.typography.fontFamily }}
              >
                {l}
              </text>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
