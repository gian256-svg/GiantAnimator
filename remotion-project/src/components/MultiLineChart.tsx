import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { evolvePath } from "@remotion/paths";
import { Theme, resolveTheme, parseSafeNumber } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface MultiLineChartProps {
  series: {
    label: string;
    data: number[];
    color?: string;
  }[];
  labels: string[];
  title?: string;
  subtitle?: string;
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  colors?: string[];
  highlightSeries?: number;
  legendMode?: 'inline' | 'classic';
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light';
  showValueLabels?: boolean;
  unit?: string;
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  series: propSeries = [],
  labels = [],
  title = "Multi-Line Chart",
  subtitle,
  theme = "dark",
  backgroundColor,
  textColor,
  highlightSeries,
  legendMode = 'inline',
  bgStyle = 'none',
  backgroundType,
  showValueLabels = false,
  unit = "",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark', backgroundColor, backgroundType);
  const resolvedBg = backgroundType ? T.background : (backgroundColor ?? T.background);

  const series = useMemo(() => {
    return Array.isArray(propSeries) ? propSeries.map(s => ({
      ...s,
      data: Array.isArray(s.data) ? s.data.map(v => parseSafeNumber(v, 0)) : []
    })) : [];
  }, [propSeries]);

  if (series.length === 0 || labels.length < 2) {
    return (
      <AbsoluteFill style={{ backgroundColor: T.background, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text, fontSize: Theme.typography.subtitle.size }}>Aguardando dados...</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K (D2 + Spacing)
  const margin = 128; // 128px
  const titleHeight = 160; // 160px
  const paddingRight = legendMode === 'inline' ? 400 : margin; // EspaÃ§o para labels inline 4K
  const plotWidth = width - margin - paddingRight;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;
  const chartLeft = margin;

  // Escala Y Adaptativa (FIX: Garantir gaps mÃ­nimos para evitar NaN)
  const allValues = series.flatMap((s) => s.data);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const yMin = dataMin;
  let yMax = dataMax;

  // REGRA DE OURO: Evitar divisÃ£o por zero se todos os valores forem iguais ou zero
  if (yMax === yMin) {
    yMax = yMin + 10;
    if (yMax === 0) yMax = 100;
  }

  const getX = (index: number) => chartLeft + (index / (labels.length - 1)) * plotWidth;
  const getY = (val: number) => {
    const v = parseSafeNumber(val, yMin);
    const range = Math.max(0.1, yMax - yMin); // Fallback de seguranÃ§a 4K
    return chartTop + plotHeight - ((v - yMin) / range) * plotHeight;
  };

  // Collision Avoidance 4K (D8)
  const inlineLabels = useMemo(() => {
    if (legendMode !== 'inline') return [];
    let basePositions = series.map((s, i) => ({
      index: i,
      label: s.label,
      y: getY(s.data[s.data.length - 1]),
      color: s.color || T.colors[i % T.colors.length]
    })).sort((a, b) => a.y - b.y);

    const minGap = 45; // Threshold colisÃ£o 4K
    for (let iter = 0; iter < 10; iter++) {
      for (let i = 0; i < basePositions.length - 1; i++) {
        const diff = basePositions[i + 1].y - basePositions[i].y;
        if (diff < minGap) {
          const offset = (minGap - diff) / 2;
          basePositions[i].y -= offset;
          basePositions[i + 1].y += offset;
        }
      }
    }
    return basePositions;
  }, [series, legendMode, yMin, yMax, chartTop, plotHeight]); // Adicionado dependÃªncias de escala

  // Helper de escala 4K
  const fs = (base: number) => Math.round(base * (width / 1920));

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={T.colors[0]} 
        backgroundType={backgroundType}
      />
      {/* ZONA 1: Cabeçalho (Regra D2 - Ajustada para UHD) */}
      <div style={{
        position: 'absolute', top: height * 0.04, width: '100%', textAlign: 'center',
        padding: `0 ${fs(100)}px`, // Safe zone lateral para títulos longos
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ 
          fontSize: fs(40), 
          fontWeight: Theme.typography.title.weight, 
          color: T.text,
          lineHeight: 1.1,
          fontFamily: Theme.typography.fontFamily,
          marginBottom: fs(10) 
        }}>{title}</div>}
        {subtitle && <div style={{ 
          fontSize: fs(24), 
          fontWeight: Theme.typography.subtitle.weight, 
          color: T.textMuted,
          fontFamily: Theme.typography.fontFamily
        }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        {/* ZONA 2: GrÃ¡fico - Gridlines (Regra D3) */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
            const val = yMin + v * (yMax - yMin);
            const y = getY(val);
            return (
              <React.Fragment key={i}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={2} />
                <text 
                  x={chartLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" 
                  style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontFamily: Theme.typography.fontFamily, fontWeight: 600 }}
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Linhas de Dados (Cascade Stagger 10f) */}
        {series.map((s, sIndex) => {
          const isFocused = highlightSeries === undefined || sIndex === highlightSeries;
          const lineColor = s.color || T.colors[sIndex % T.colors.length];
          const strokeWidth = isFocused ? 4 : 2;
          const opacity = isFocused ? 1 : 0.25;

          const pointsStr = s.data.slice(0, labels.length).map((val, i) => `${getX(i)},${getY(val)}`).join(" ");
          const pathD = `M ${pointsStr.split(" ").join(" L ")}`;

          const progress = spring({
            frame: frame - (15 + sIndex * 10),
            fps,
            config: { 
              damping: 80, 
              stiffness: 200, 
              overshootClamping: true 
            },
          });

          const evolved = evolvePath(progress, pathD);

          return (
            <g key={sIndex} opacity={opacity}>
              <path
                d={pathD} fill="none" stroke={lineColor} strokeWidth={strokeWidth}
                strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />

              {/* Dots Pop (D7) */}
              {frame > (15 + sIndex * 10 + 60) && s.data.map((val, pIndex) => {
                const dotPop = spring({
                  frame: frame - (15 + sIndex * 10 + 60) - (pIndex * 3),
                  fps,
                  config: { 
                    damping: 80, 
                    stiffness: 200, 
                    overshootClamping: true 
                  }
                });
                if (dotPop <= 0) return null;
                return (
                  <g key={pIndex}>
                    <circle
                      cx={getX(pIndex)} cy={getY(val)} r={10 * dotPop}
                      fill="#fff" stroke={lineColor} strokeWidth={2.5}
                    />
                    {showValueLabels && (
                      <text
                        x={getX(pIndex)}
                        y={getY(val) - 25}
                        textAnchor="middle"
                        style={{
                          fontSize: fs(18),
                          fill: T.text,
                          fontWeight: 700,
                          fontFamily: Theme.typography.fontFamily,
                          opacity: dotPop
                        }}
                      >
                        {val}{unit}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Labels Inline 4K */}
        {legendMode === 'inline' && inlineLabels.map((lbl, i) => {
          const seriesAnimStart = 15 + i * 10 + 80;
          const opacity = interpolate(frame, [seriesAnimStart, seriesAnimStart + 20], [0, 1], { extrapolateLeft: 'clamp' });
          return (
            <text
              key={i} x={chartLeft + plotWidth + 30} y={lbl.y}
              dominantBaseline="middle"
              style={{ 
                fontSize: Theme.typography.legendSize, 
                fontWeight: Theme.typography.weightMedium, 
                fill: lbl.color,
                fontFamily: Theme.typography.fontFamily,
                opacity 
              }}
            >
              {lbl.label}
            </text>
          );
        })}
      </svg>

      {/* Legenda ClÃ¡ssica (ZONA 3) */}
      {legendMode === 'classic' && (
        <div style={{
          position: 'absolute', bottom: height * 0.08, width: '100%', display: 'flex', justifyContent: 'center', gap: 40,
          opacity: interpolate(frame, [60, 80], [0, 1])
        }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: s.color || T.colors[i % T.colors.length] }} />
              <span style={{ 
                fontSize: Theme.typography.legendSize,
                fontWeight: Theme.typography.weightMedium,
                color: T.text,
                fontFamily: Theme.typography.fontFamily
              }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
