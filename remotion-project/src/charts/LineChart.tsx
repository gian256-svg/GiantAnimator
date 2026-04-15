import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";

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
  // Animação de reveal Suave (Easy-in Easy-out)
  const progress = interpolate(
    frame,
    [30, 30 + 4 * fps], // Crescimento dura exatamente 4 segundos após o delay inicial
    [0, 1],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const rawCount = Math.min(
    Math.ceil(progress * xAxisLabels.length),
    xAxisLabels.length
  );
  
  const stableCount = progress >= 1 ? xAxisLabels.length : rawCount;

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>


      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="chart-reveal-clip">
            <rect
              x={0}
              y={0}
              width={plotLeft + plotWidth * progress}
              height={height}
            />
          </clipPath>
        </defs>

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
                    ...Theme.typography.tabularNums
                  }}
                >
                  {formatValue(val, unit)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* SÉRIES (LINHAS E ÁREAS) */}
        {normalizedSeries.map((s, sIndex) => {
          const color = s.color || resolvedColors[sIndex % resolvedColors.length];
          const strokeW = Math.max(2, fs(4));

          // Geração da polyline para a linha completa
          const linePoints = s.data
            .map((v, i) => `${getX(i)},${getY(v)}`)
            .join(" ");

          // Geração do path para a área completa
          const areaPath = `M ${getX(0)},${getY(s.data[0])} ` +
            s.data.slice(1).map((v, i) => `L ${getX(i + 1)},${getY(v)}`).join(" ") +
            ` L ${getX(s.data.length - 1)},${plotTop + plotHeight} L ${getX(0)},${plotTop + plotHeight} Z`;

          return (
            <g key={sIndex} clipPath="url(#chart-reveal-clip)">
              {/* ÁREA COM GRADIENTE */}
              {showArea && (
                <path
                  d={areaPath}
                  fill={color}
                  fillOpacity={0.15}
                />
              )}
              
              {/* LINHA PRINCIPAL */}
              <polyline
                points={linePoints}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* DOTS (Cada dot aparece via spring individual mas obedece ao clipPath) */}
              {s.data.map((v, i) => {
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

      {/* LEGENDAS (ZONA RODAPÉ) — Seguindo Regra Permanente Anti-Overlap */}
      {(normalizedSeries.length > 1 || series) && (
        <div style={{
          position: 'absolute',
          bottom: height * 0.04,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: fs(60),
          opacity: interpolate(frame, [25, 55], [0, 1], { extrapolateLeft: 'clamp' }),
          pointerEvents: 'none',
        }}>
          {normalizedSeries.map((s, i) => {
            const color = s.color || resolvedColors[i % resolvedColors.length];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(16) }}>
                {/* Ícone Estilo Linha UHD */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: fs(60), height: fs(32) }}>
                  <div style={{ width: '100%', height: fs(4), backgroundColor: color, borderRadius: fs(2), opacity: 0.8 }} />
                  <div style={{ 
                    position: 'absolute', width: fs(18), height: fs(18), borderRadius: '50%', 
                    backgroundColor: '#fff', border: `${fs(4)}px solid ${color}`, boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                  }} />
                </div>
                <div style={{ fontSize: fs(24), color: resolvedText, fontFamily: Theme.typography.fontFamily, fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TÍTULO E SUBTÍTULO (TOP) — Movido para APÓS SVG para Z-Index */}
      <div
        style={{
          position: "absolute",
          top: height * 0.05,
          width: "100%",
          textAlign: "center",
          opacity: headerOpacity,
          fontFamily: Theme.typography.fontFamily,
          pointerEvents: 'none'
        }}
      >
        {title && (
          <div style={{ fontSize: fs(44), fontWeight: 800, color: resolvedText, letterSpacing: "-0.5px" }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: fs(20), color: T.textMuted, marginTop: fs(10) }}>
            {subtitle}
          </div>
        )}
      </div>

    </AbsoluteFill>
  );
};
