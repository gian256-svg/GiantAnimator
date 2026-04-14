import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from "../theme";

interface LineChartProps {
  data?: { label: string; value: number }[];
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title: string;
  subtitle?: string;
  showArea?: boolean;
  colors?: string[];
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  unit?: string;
}

const format = (n: number, unit = '') => {
  if (!unit) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  }
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return unit ? `${rounded}${unit}` : n.toLocaleString();
};

export const LineChart: React.FC<LineChartProps> = ({
  data = [],
  series,
  labels,
  title,
  subtitle,
  showArea = true,
  colors,
  theme = "dark",
  backgroundColor,
  textColor,
  unit = '',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Resolve tema — fonte única de verdade
  const T = resolveTheme(theme);
  const resolvedBg     = backgroundColor ?? T.background;
  const resolvedText   = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Escala de fonte responsiva (igual ao BarChart)
  const fs = (base: number) => Math.round(base * (width / 1280));

  // Layout responsivo baseado na resolução real
  const pad = width * 0.04;
  const yAxisLabelWidth = width * 0.07;
  const padTop = height * 0.13;  // espaço para header
  const padBot = height * 0.10;  // espaço para eixo X

  const plotLeft   = pad + yAxisLabelWidth;
  const plotTop    = padTop;
  const plotWidth  = width - plotLeft - pad;
  const plotHeight = height - padTop - padBot;

  // Normalização de dados para formato unificado
  const normalizedSeries = series || [
    {
      label: title,
      data: data.map((d) => d.value),
    },
  ];
  const xAxisLabels = labels || data.map((d) => d.label);

  if (xAxisLabels.length < 2) return null;

  // Cálculos de Min/Max para escala global
  const allValues = normalizedSeries.flatMap((s) => s.data);
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;

  const getX = (i: number) => plotLeft + (i / (xAxisLabels.length - 1)) * plotWidth;
  const getY = (v: number) => plotTop + plotHeight - ((v - minV) / range) * plotHeight;

  // Animação de reveal (DNA GiantAnimator)
  const progress = spring({
    frame: frame - 20,
    fps,
    config: { 
      damping: 80, 
      stiffness: 200, 
      overshootClamping: true 
    },
  });

  const rawCount = Math.min(
    Math.ceil(progress * xAxisLabels.length),
    xAxisLabels.length
  );
  
  const stableCount = progress >= 1 ? xAxisLabels.length : rawCount;

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>
      {/* TÍTULO */}
      <div
        style={{
          position: "absolute",
          top: 40,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 15], [0, 1]),
        }}
      >
        {title && (
          <div
            style={{
              fontSize: Theme.typography.title.size,
              fontWeight: Theme.typography.title.weight,
              color: resolvedText,
              fontFamily: Theme.typography.fontFamily,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontSize: Theme.typography.subtitle.size,
              color: T.textMuted,
              fontFamily: Theme.typography.fontFamily,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {/* GRID Y E LABELS */}
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const val = minV + v * range;
            const y = getY(val);
            const gridOpacity = interpolate(frame, [5, 25], [0, 0.45], { extrapolateRight: 'clamp' });
            return (
              <React.Fragment key={v}>
                <line
                  x1={plotLeft}
                  y1={y}
                  x2={plotLeft + plotWidth}
                  y2={y}
                  stroke={T.grid}
                  strokeWidth={Math.max(1, fs(1.5))}
                  opacity={gridOpacity}
                />
                <text
                  x={plotLeft - fs(10)}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontSize: fs(14),
                    fill: T.textMuted,
                    fontFamily: Theme.typography.fontFamily,
                    opacity: gridOpacity,
                  }}
                >
                  {format(val, unit)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* SÉRIES (LINHAS E ÁREAS) */}
        {normalizedSeries.map((s, sIndex) => {
          if (stableCount < 1) return null;

          const color = s.color || resolvedColors[sIndex % resolvedColors.length];
          const strokeW = Math.max(2, fs(4));

          // Geração da polyline para a linha
          const linePoints = s.data
            .slice(0, stableCount)
            .map((v, i) => `${getX(i)},${getY(v)}`)
            .join(" ");

          // Geração do path para a área
          const areaPath = stableCount >= 2 
            ? `M ${getX(0)},${getY(s.data[0])} ` +
              s.data.slice(1, stableCount).map((v, i) => `L ${getX(i + 1)},${getY(v)}`).join(" ") +
              ` L ${getX(stableCount - 1)},${plotTop + plotHeight} L ${getX(0)},${plotTop + plotHeight} Z`
            : "";

          return (
            <g key={sIndex}>
              {/* ÁREA COM GRADIENTE */}
              {showArea && stableCount >= 2 && (
                <path
                  d={areaPath}
                  fill={color}
                  fillOpacity={0.15}
                />
              )}
              
              {/* LINHA PRINCIPAL */}
              {stableCount >= 2 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* DOTS (Cada dot aparece via spring individual) */}
              {s.data.map((v, i) => {
                if (i >= stableCount) return null;
                
                const dotReveal = spring({
                  frame: frame - (20 + (i * 2)),
                  fps,
                  config: { damping: 12, stiffness: 100 }
                });
                
                return (
                  <circle
                    key={i}
                    cx={getX(i)}
                    cy={getY(v)}
                    r={10 * dotReveal}
                    fill="#fff"
                    stroke={color}
                    strokeWidth={4}
                  />
                );
              })}
            </g>
          );
        })}

        {/* EIXO X LABELS */}
        <g>
          {xAxisLabels.map((l, i) => {
            if (xAxisLabels.length > 12 && i % Math.ceil(xAxisLabels.length / 10) !== 0) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={plotTop + plotHeight + fs(28)}
                textAnchor="middle"
                style={{
                  fontSize: fs(13),
                  fill: T.textMuted,
                  fontFamily: Theme.typography.fontFamily,
                }}
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
