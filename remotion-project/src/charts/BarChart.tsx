import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";

interface BarChartProps {
  data?: { label: string; value: number }[];
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title?: string;
  subtitle?: string;
  colors?: string[];
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  unit?: string;
  showValueLabels?: boolean;
}



export const BarChart: React.FC<BarChartProps> = ({
  data = [],
  series,
  labels,
  title = "",
  subtitle = "",
  colors,
  theme = "dark",
  backgroundColor,
  textColor,
  unit = '',
  showValueLabels = false,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve tema — fonte única de verdade
  const T = resolveTheme(theme);
  const resolvedBg    = backgroundColor ?? T.background;
  const resolvedText  = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Unificar dados (Single vs Multi)
  const normalizedSeries = series || [
    { label: title, data: data.map(d => d.value) }
  ];
  const xAxisLabels = labels || data.map(d => d.label);

  const safeDataCount = xAxisLabels.length || 1;
  const seriesCount   = normalizedSeries.length;

  // ─── SMART UNIT HANDLING ──────────────────────────────
  // Se a unidade for muito longa, removemos das barras e eixos e movemos para uma nota global.
  const isLongUnit  = unit.length > 6;
  const displayUnit = isLongUnit ? "" : unit;
  const unitNote    = isLongUnit ? `Unidade: ${unit}` : "";

  // ─── Layout responsivo baseado na resolução real ──────
  const pad = width * 0.04;   // 4% de padding
  const padTop = height * 0.22;  // Espaço para o header + Unit Note
  const padBot = height * 0.16;  // Espaço para eixo X

  // Aumentamos plotLeft se o número for grande para não cortar
  const plotLeft = pad + width * 0.08;   
  const plotTop = padTop;
  const plotWidth = width - plotLeft - pad;
  const plotHeight = height - padTop - padBot;

  // Escala de fonte baseada na resolução
  const fs = (base: number) => Math.round(base * (width / 1280));

  const maxVal = Math.max(...normalizedSeries.flatMap(s => s.data), 1);
  
  const categoryWidth = plotWidth / safeDataCount;
  const groupGap      = 0.3; // gap entre grupos de colunas
  const innerGap      = 0.05; // gap entre colunas do mesmo grupo
  
  const availableW    = categoryWidth * (1 - groupGap);
  const barWidth      = (availableW / seriesCount) * (1 - innerGap);

  // Rotação do Label do Eixo X se houver muitos dados
  const shouldRotateLabels = safeDataCount > 6;

  const getY = (v: number) =>
    plotTop + plotHeight - (v / maxVal) * plotHeight;

  // Animação de entrada do header
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>


      {/* ── SVG CHART ── */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {normalizedSeries.map((_, i) => (
            <linearGradient
              key={i}
              id={`barGrad-${i}-${instanceId}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" stopColor={resolvedColors[i % resolvedColors.length]} />
              <stop offset="100%" stopColor={resolvedColors[i % resolvedColors.length]} stopOpacity={0.65} />
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
                x={plotLeft - fs(15)}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                style={{
                  fontSize: fs(shouldRotateLabels ? 12 : 14),
                  fill: T.textMuted,
                  fontFamily: Theme.typography.fontFamily,
                  ...Theme.typography.tabularNums
                }}
              >
                {formatValue(v * maxVal, displayUnit)}
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

        {/* ── BARS (GROUPED) ── */}
        {xAxisLabels.map((label, groupIdx) => {
          return normalizedSeries.map((s, seriesIdx) => {
            const val = s.data[groupIdx] || 0;
            const delay = 20 + groupIdx * 3 + seriesIdx * 2;
            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 80, stiffness: 200, overshootClamping: true },
            });

            const currentH = Math.max(0, (val / maxVal) * plotHeight * progress);
            const groupX = plotLeft + groupIdx * categoryWidth + (categoryWidth * groupGap) / 2;
            const bX = groupX + seriesIdx * (barWidth * (1 + innerGap));
            const bY = plotTop + plotHeight - currentH;

            const op = interpolate(frame, [delay + 10, delay + 20], [0, 1], { extrapolateRight: "clamp" });

            return (
              <g key={`${groupIdx}-${seriesIdx}`}>
                {/* Bar */}
                <rect 
                  x={bX} y={bY} width={barWidth} height={currentH} 
                  fill={normalizedSeries.length > 1 ? `url(#barGrad-${seriesIdx}-${instanceId})` : resolvedColors[groupIdx % resolvedColors.length]} 
                  rx={fs(4)} 
                />
                
                {/* Highlight top */}
                <rect x={bX + barWidth * 0.1} y={bY} width={barWidth * 0.8} height={Math.min(currentH, fs(4))} fill="rgba(255,255,255,0.2)" rx={fs(2)} />

                {/* Value label */}
                {showValueLabels && (
                  <text 
                    x={bX + barWidth / 2} 
                    y={bY - fs(8)} 
                    textAnchor="middle" 
                    opacity={op} 
                    style={{ 
                      fontSize: fs(shouldRotateLabels ? 11 : 14), 
                      fill: resolvedText, 
                      fontWeight: 700, 
                      fontFamily: Theme.typography.fontFamily,
                      ...Theme.typography.tabularNums
                    }}
                  >
                      {formatValue(val, displayUnit)}
                  </text>
                )}

                {/* X axis (one per group) */}
                {seriesIdx === 0 && (
                  <text 
                    x={groupX + availableW / 2} 
                    y={plotTop + plotHeight + fs(shouldRotateLabels ? 12 : 28)} 
                    textAnchor={shouldRotateLabels ? "end" : "middle"} 
                    transform={shouldRotateLabels ? `rotate(-35, ${groupX + availableW / 2}, ${plotTop + plotHeight + fs(15)})` : ""}
                    opacity={op} 
                    style={{ 
                      fontSize: fs(shouldRotateLabels ? 11 : 12), 
                      fill: T.textMuted, 
                      fontFamily: Theme.typography.fontFamily 
                    }}
                  >
                    {label}
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
              <div style={{ width: fs(22), height: fs(22), borderRadius: '50%', backgroundColor: resolvedColors[i % resolvedColors.length], border: `${fs(3)}px solid #fff`, boxShadow: '0 0 10px rgba(0,0,0,0.3)' }} />
              <div style={{ fontSize: fs(28), color: resolvedText, fontFamily: Theme.typography.fontFamily, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

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
          <div style={{ fontSize: fs(24), color: T.textMuted, marginTop: fs(10), fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
        {unitNote && (
          <div style={{ 
            fontSize: fs(18), 
            color: T.textMuted, 
            marginTop: fs(12), 
            fontStyle: 'italic',
            opacity: 0.8
          }}>
            *{unitNote}
          </div>
        )}
      </div>

    </AbsoluteFill>
  );
};
