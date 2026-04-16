import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, formatValue } from '../theme';

interface HorizontalBarChartProps {
  data?: { label: string; value: number }[];
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
  title?:    string;
  subtitle?: string;
  unit?:     string;
  showValueLabels?: boolean;
}



export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  theme = 'dark',
  data     = [],
  series,
  labels,
  title    = "",
  subtitle = "",
  unit     = "",
  colors,
  showValueLabels = false,
}) => {
  const frame      = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  // Resolve tema — fonte única de verdade
  const T = resolveTheme(theme);
  const resolvedBg    = backgroundColor ?? T.background;
  const resolvedText  = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  const instanceId = useId().replace(/:/g, "");

  const safeData = Array.isArray(data) ? data : [];
  // Unificar dados (Single vs Multi) com Safe-Guards
  const normalizedSeries = series?.[0] ? series : [
    { label: title, data: safeData.map(d => d.value) }
  ];
  const xAxisLabels = labels || safeData.map(d => d.label);

  const allValues = normalizedSeries.flatMap(s => s.data).map(v => Number(v)).filter(v => isFinite(v));
  
  if (allValues.length === 0 || xAxisLabels.length === 0) {
     return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;
  }

  const safeDataCount = xAxisLabels.length || 1;
  const seriesCount   = normalizedSeries.length;

  // ─── SMART UNIT HANDLING ──────────────────────────────
  const isLongUnit  = unit.length > 6;
  const displayUnit = isLongUnit ? "" : unit;
  const unitNote    = isLongUnit ? `Unidade: ${unit}` : "";

  // ─── Layout responsivo ────────────────────────────────
  const pad     = width * 0.05;
  const padTop  = height * 0.22; 
  const padBot  = height * 0.14; 
  
  // Escala de fonte
  const fs = (base: number) => Math.round(base * (width / 1280));

  const maxLabelLen = Math.max(...xAxisLabels.map(l => l.length), 1);
  const labelAreaWidth = Math.min(width * 0.35, maxLabelLen * fs(12));
  const plotLeft       = pad + labelAreaWidth + (isLongUnit ? width * 0.05 : 0);
  const plotTop        = padTop;
  const plotWidth      = width - plotLeft - pad - fs(45);
  const plotHeight     = height - padTop - padBot;

  const allValues = normalizedSeries.flatMap(s => s.data);
  const dataMax = Math.max(...allValues, 0.0001);
  const maxVal  = dataMax; 
  
  const categoryHeight = plotHeight / safeDataCount;
  const groupedGap     = 0.25; // gap entre grupos
  const innerGap       = 0.05; // gap entre barras do mesmo grupo
  
  const availableH     = categoryHeight * (1 - groupedGap);
  const barHeight      = (availableH / seriesCount) * (1 - innerGap);

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>
      

      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          {normalizedSeries.map((_, i) => (
            <linearGradient key={i} id={`hbarGrad-${i}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={T.colors[i % T.colors.length]} />
              <stop offset="100%" stopColor={T.colors[i % T.colors.length]} stopOpacity={0.8} />
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
              <line x1={x} y1={plotTop} x2={x} y2={plotTop + plotHeight} stroke={T.grid} strokeWidth={Math.max(1, fs(1.5))} opacity={op} />
              <text x={x} y={plotTop + plotHeight + fs(24)} textAnchor="middle" style={{ 
                fontSize: fs(14), fill: T.textMuted, fontFamily: Theme.typography.fontFamily, 
                opacity: op, ...Theme.typography.tabularNums 
              }}>
                {formatValue(v * maxVal, displayUnit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* ── BARS (GROUPED) ── */}
        {xAxisLabels.map((label, groupIdx) => {
          return normalizedSeries.map((s, seriesIdx) => {
            const val = s.data[groupIdx] || 0;
            const delay = 25 + groupIdx * 3 + seriesIdx * 2;
            const progress = spring({ 
              frame: frame - delay, 
              fps, 
              config: { damping: 80, stiffness: 200, overshootClamping: true } 
            });

            // Posição no grupo
            const groupY = plotTop + groupIdx * categoryHeight + (categoryHeight * groupedGap) / 2;
            const bY = groupY + seriesIdx * (barHeight * (1 + innerGap));
            const bW = Math.max(0, (val / maxVal) * plotWidth * progress);
            
            const labelOp = interpolate(frame, [delay + 10, delay + 25], [0, 1], { extrapolateRight: "clamp" });
            const color = T.colors[seriesIdx % T.colors.length];

            return (
              <g key={`${groupIdx}-${seriesIdx}`}>
                {/* Category Label (only once per group) */}
                {seriesIdx === 0 && (
                  <text x={plotLeft - fs(15)} y={groupY + availableH/2} textAnchor="end" dominantBaseline="middle" opacity={labelOp} style={{ 
                    fontSize: fs(14), fill: resolvedText, fontWeight: 600, fontFamily: Theme.typography.fontFamily 
                  }}>
                    {label}
                  </text>
                )}

                {/* Main Bar */}
                <rect 
                  x={plotLeft} y={bY} width={bW} height={barHeight} 
                  fill={normalizedSeries.length > 1 ? `url(#hbarGrad-${seriesIdx}-${instanceId})` : T.colors[groupIdx % T.colors.length]} 
                  rx={fs(2)} 
                />

                {/* Value Label (Inside if possible, else After) */}
                {showValueLabels && (
                  <text 
                    x={bW > fs(70) ? plotLeft + bW - fs(12) : plotLeft + bW + fs(10)} 
                    y={bY + barHeight/2} 
                    textAnchor={bW > fs(70) ? "end" : "start"}
                    dominantBaseline="middle" 
                    opacity={labelOp} 
                    style={{ 
                      fontSize: fs(15), 
                      fill: bW > fs(70) ? "#fff" : resolvedText, 
                      fontWeight: 700, 
                      fontFamily: Theme.typography.fontFamily,
                      ...Theme.typography.tabularNums
                    }}
                  >
                    {formatValue(val, displayUnit)}
                  </text>
                )}
              </g>
            );
          });
        })}
      </svg>


      {/* ── LEGEND (BOTTOM) ── */}
      {seriesCount > 1 && (
        <div style={{
          position: 'absolute',
          bottom: height * 0.04,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: fs(40),
          opacity: interpolate(frame, [40, 60], [0, 1])
        }}>
          {normalizedSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(14) }}>
              <div style={{ 
                width: fs(22), height: fs(22), borderRadius: '50%', 
                backgroundColor: T.colors[i % T.colors.length],
                border: `${fs(3)}px solid #fff`, boxShadow: '0 0 10px rgba(0,0,0,0.3)'
              }} />
              <div style={{ fontSize: fs(28), color: T.text, fontFamily: Theme.typography.fontFamily, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── HEADER (Movido para APÓS SVG para Z-Index) ── */}
      <div style={{
        position: "absolute", top: height * 0.05, width: "100%", textAlign: 'center',
        opacity: headerOpacity, fontFamily: Theme.typography.fontFamily,
        pointerEvents: 'none'
      }}>
        {title && <div style={{ fontSize: fs(44), fontWeight: 800, color: resolvedText, letterSpacing: '-0.5px' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(24), color: T.textMuted, marginTop: fs(10), fontWeight: 500 }}>{subtitle}</div>}
        {unitNote && (
          <div style={{ fontSize: fs(18), color: T.textMuted, marginTop: fs(12), fontStyle: 'italic', opacity: 0.8 }}>
            *{unitNote}
          </div>
        )}
      </div>

    </AbsoluteFill>
  );
};
