import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

interface HorizontalBarChartProps {
  data?:     { label: string; value: number }[];
  title?:    string;
  subtitle?: string;
  unit?:     string;
}

const format = (n: number, unit: string = "") => {
  let val = "";
  if (n >= 1_000_000) val = (n / 1_000_000).toFixed(1) + "M";
  else if (n >= 1_000) val = (n / 1_000).toFixed(1) + "k";
  else val = String(Math.round(n));
  return val + unit;
};

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data     = [],
  title    = "",
  subtitle = "",
  unit     = "",
}) => {
  const frame      = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { label: "Categoria A", value: 85 },
    { label: "Categoria B", value: 65 },
    { label: "Categoria C", value: 95 },
    { label: "Categoria D", value: 45 },
  ];

  // ─── Layout responsivo ────────────────────────────────
  const pad     = width * 0.05;
  const padTop  = height * 0.14;
  const padBot  = height * 0.10;
  
  // Escala de fonte
  const fs = (base: number) => Math.round(base * (width / 1280));

  const labelAreaWidth = width * 0.22;
  const plotLeft       = pad + labelAreaWidth;
  const plotTop        = padTop;
  const plotWidth      = width - plotLeft - pad - fs(40); // folga para valor no final
  const plotHeight     = height - padTop - padBot;

  const maxVal    = Math.max(...safeData.map(d => d.value), 1) * 1.1;
  const rowHeight = plotHeight / safeData.length;
  const barGap    = 0.32;
  const barHeight = rowHeight * (1 - barGap);

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      
      {/* ── HEADER ── */}
      <div style={{
        position: "absolute", top: height * 0.04, width: "100%", textAlign: "center",
        opacity: headerOpacity, fontFamily: Theme.typography.fontFamily
      }}>
        {title && <div style={{ fontSize: fs(38), fontWeight: 700, color: Theme.colors.text }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(18), color: Theme.colors.textMuted, marginTop: fs(4) }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          {safeData.map((_, i) => (
            <linearGradient key={i} id={`hbarGrad-${i}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.7} />
            </linearGradient>
          ))}
          <filter id={`glow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={fs(3)} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── GRID X ── */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => {
          const x = plotLeft + v * plotWidth;
          const op = interpolate(frame, [10, 30], [0, 0.3], { extrapolateRight: "clamp" });
          return (
            <React.Fragment key={v}>
              <line x1={x} y1={plotTop} x2={x} y2={plotTop + plotHeight} stroke={Theme.colors.grid} strokeWidth={Math.max(1, fs(1.5))} opacity={op} />
              <text x={x} y={plotTop + plotHeight + fs(24)} textAnchor="middle" style={{ fontSize: fs(14), fill: Theme.colors.textMuted, fontFamily: Theme.typography.fontFamily, opacity: op }}>
                {format(v * maxVal, unit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* ── BARS ── */}
        {safeData.map((d, i) => {
          const delay = 25 + i * 4;
          const pop = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 65, mass: 0.9 } });
          const bY = plotTop + i * rowHeight + (rowHeight * barGap) / 2;
          const bW = Math.max(0, (d.value / maxVal) * plotWidth * pop);
          
          const labelOp = interpolate(frame, [delay + 10, delay + 25], [0, 1], { extrapolateRight: "clamp" });
          const color = Theme.chartColors[i % Theme.chartColors.length];

          return (
            <g key={i}>
              {/* Category */}
              <text x={plotLeft - fs(15)} y={bY + barHeight/2} textAnchor="end" dominantBaseline="middle" opacity={labelOp} style={{ 
                fontSize: fs(16), fill: Theme.colors.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily 
              }}>
                {d.label.length > 20 ? d.label.slice(0, 19) + "…" : d.label}
              </text>

              {/* Bar Glow */}
              <rect x={plotLeft} y={bY + fs(3)} width={bW} height={barHeight} fill={color} rx={fs(4)} opacity={0.15 * pop} filter={`url(#glow-${instanceId})`} />

              {/* Main Bar */}
              <rect x={plotLeft} y={bY} width={bW} height={barHeight} fill={`url(#hbarGrad-${i}-${instanceId})`} rx={fs(4)} />

              {/* Value */}
              <text x={plotLeft + bW + fs(10)} y={bY + barHeight/2} dominantBaseline="middle" opacity={labelOp} style={{ 
                fontSize: fs(16), fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily 
              }}>
                {format(d.value, unit)}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
