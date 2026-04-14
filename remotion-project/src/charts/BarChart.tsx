import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from "../theme";

interface BarChartProps {
  data?: { label: string; value: number }[];
  title?: string;
  subtitle?: string;
  colors?: string[];
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  unit?: string;  // ex: '%', 'k', 'R$', etc — vem do dado original
}

const format = (n: number, unit = '') => {
  if (!unit) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  }
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return unit ? `${rounded}${unit}` : rounded;
};

export const BarChart: React.FC<BarChartProps> = ({
  data = [],
  title = "",
  subtitle = "",
  colors,
  theme = "dark",
  backgroundColor,
  textColor,
  unit = '',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve tema — fonte única de verdade
  const T = resolveTheme(theme);
  const resolvedBg    = backgroundColor ?? T.background;
  const resolvedText  = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // ─── Guarda contra dados vazios ───────────────────────
  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
    { label: "C", value: 15 },
  ];

  // ─── Layout responsivo baseado na resolução real ──────
  const pad = width * 0.04;   // 4% de padding
  const padTop = height * 0.12;  // 12% para o header
  const padBot = height * 0.12;  // 12% para eixo X

  const plotLeft = pad + width * 0.06;   // espaço eixo Y
  const plotTop = padTop;
  const plotWidth = width - plotLeft - pad;
  const plotHeight = height - padTop - padBot;

  // Escala de fonte baseada na resolução
  const fs = (base: number) => Math.round(base * (width / 1280));

  const maxVal = Math.max(...safeData.map(d => d.value), 1);
  const categoryWidth = plotWidth / safeData.length;
  const barGap = 0.28;
  const barWidth = categoryWidth * (1 - barGap);

  const getY = (v: number) =>
    plotTop + plotHeight - (v / maxVal) * plotHeight;

  // Animação de entrada do header
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>

      {/* ── HEADER ── */}
      <div
        style={{
          position: "absolute",
          top: height * 0.03,
          width: "100%",
          textAlign: "center",
          opacity: headerOpacity,
          fontFamily: Theme.typography.fontFamily,
        }}
      >
        {title && (
          <div
            style={{
              fontSize: fs(36),
              fontWeight: 700,
              color: resolvedText,
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontSize: fs(18),
              color: T.textMuted,
              marginTop: fs(6),
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* ── SVG CHART ── */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {safeData.map((_, i) => (
            <linearGradient
              key={i}
              id={`barGrad-${i}-${instanceId}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop
                offset="0%"
                stopColor={resolvedColors[i % resolvedColors.length]}
              />
              <stop
                offset="100%"
                stopColor={resolvedColors[i % resolvedColors.length]}
                stopOpacity={0.65}
              />
            </linearGradient>
          ))}

          {/* Glow filter */}
          <filter id={`glow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={fs(3)} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── GRID Y ── */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const y = getY(v * maxVal);
          const op = interpolate(frame, [5, 25], [0, 0.45], {
            extrapolateRight: "clamp",
          });
          return (
            <React.Fragment key={v}>
              <line
                x1={plotLeft} y1={y}
                x2={plotLeft + plotWidth} y2={y}
                stroke={T.grid}
                strokeWidth={Math.max(1, fs(1.5))}
                opacity={op}
              />
              <text
                x={plotLeft - fs(12)}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                style={{
                  fontSize: fs(14),
                  fill: T.textMuted,
                  fontFamily: Theme.typography.fontFamily,
                }}
              >
                {format(v * maxVal, unit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* ── AXIS LINE ── */}
        <line
          x1={plotLeft} y1={plotTop + plotHeight}
          x2={plotLeft + plotWidth} y2={plotTop + plotHeight}
          stroke={T.axis}
          strokeWidth={Math.max(1, fs(2))}
          opacity={0.6}
        />

        {/* ── BARS ── */}
        {safeData.map((d, i) => {
          const delay = 20 + i * 3;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: {
              damping: 80,
              stiffness: 200,
              overshootClamping: true
            },
          });

          const currentH = Math.max(0, (d.value / maxVal) * plotHeight * progress);
          const bX = plotLeft + i * categoryWidth + (categoryWidth * barGap) / 2;
          const bY = plotTop + plotHeight - currentH;

          const labelOpacity = interpolate(
            frame,
            [delay + 10, delay + 20],
            [0, 1],
            { extrapolateRight: "clamp" }
          );


          return (
            <g key={i}>
              {/* Sombra/glow da barra */}
              <rect
                x={bX + fs(2)} y={bY + fs(4)}
                width={barWidth} height={currentH}
                fill={resolvedColors[i % resolvedColors.length]}
                rx={fs(6)}
                opacity={0.2}
                filter={`url(#glow-${instanceId})`}
              />

              {/* Barra principal */}
              <rect
                x={bX} y={bY}
                width={barWidth} height={currentH}
                fill={`url(#barGrad-${i}-${instanceId})`}
                rx={fs(6)}
              />

              {/* Highlight topo da barra */}
              <rect
                x={bX + barWidth * 0.1} y={bY}
                width={barWidth * 0.8} height={Math.min(currentH, fs(6))}
                fill="rgba(255,255,255,0.25)"
                rx={fs(6)}
              />

              {/* Valor em cima da barra */}
              <text
                x={bX + barWidth / 2}
                y={bY - fs(10)}
                textAnchor="middle"
                opacity={labelOpacity}
                style={{
                  fontSize: fs(15),
                  fill: resolvedText,
                  fontWeight: 700,
                  fontFamily: Theme.typography.fontFamily,
                }}
              >
                {format(d.value, unit)}
              </text>

              {/* X axis label */}
              <text
                x={bX + barWidth / 2}
                y={plotTop + plotHeight + fs(28)}
                textAnchor="middle"
                opacity={labelOpacity}
                style={{
                  fontSize: fs(13),
                  fill: T.textMuted,
                  fontFamily: Theme.typography.fontFamily,
                }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

    </AbsoluteFill>
  );
};
