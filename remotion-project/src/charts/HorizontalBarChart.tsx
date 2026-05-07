import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, formatValue, getNiceScale, wrapText } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";
import { HighlightCircle } from "../components/HighlightCircle";

interface HorizontalBarChartProps {
  data?: { label: string; value: number }[];
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  theme?: 'dark' | 'light';
  backgroundColor?: string;
  colors?: string[];
  seriesColors?: string[];
  textColor?: string;
  title?:    string;
  subtitle?: string;
  unit?:     string;
  showValueLabels?: boolean;
  annotations?: any[];
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light';
  showLegend?: boolean;
  xMin?: number;
  xMax?: number;
  xAxisTitle?: string;
  stacked?: boolean;
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
  seriesColors,
  backgroundColor,
  textColor,
  showValueLabels = true,
  annotations = [],
  bgStyle: _bgStyle = 'none',
  backgroundType,
  showLegend = true,
  stacked = false,
  xMin: propXMin,
  xMax: propXMax,
  xAxisTitle = '',
}) => {
  const frame      = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const fs = (base: number) => Math.round(base * (width / 1920));

  // Resolve tema
  const T = resolveTheme(theme, backgroundColor, backgroundType, seriesColors || colors, textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const resolvedColors = T.colors;

  const instanceId = useId().replace(/:/g, "");

  // Normalização de dados
  const safeData = Array.isArray(data) ? data : [];
  const normalizedSeries = (series && series.length > 0) ? series : [
    { label: title || 'Data', data: safeData.map(d => d.value) }
  ];
  const xAxisLabels = labels || safeData.map(d => d.label);
  const allValues = normalizedSeries.flatMap(s => s.data).map(v => Number(v) || 0);

  if (allValues.length === 0 || xAxisLabels.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: (backgroundType as string) === 'transparent' ? 'transparent' : resolvedBg }} />;
  }

  // Cálculo de Escala (ajustado para Stacking)
  let effectiveMax = Math.max(...allValues, 0.0001);
  
  if (stacked) {
      const sums = xAxisLabels.map((_, i) => 
          normalizedSeries.reduce((acc, s) => acc + (Number(s.data[i]) || 0), 0)
      );
      effectiveMax = Math.max(...sums, 0.0001);
  }

  const dataMinRaw = propXMin !== undefined ? propXMin : Math.min(...allValues, 0);
  const dataMaxRaw = propXMax !== undefined ? propXMax : effectiveMax;
  const niceScale = getNiceScale(dataMaxRaw * (propXMax !== undefined ? 1 : 1.15), dataMinRaw, 5);
  const dataMin = niceScale[0];
  const dataMax = niceScale[niceScale.length - 1];
  const range = dataMax - dataMin || 0.0001;

  // ── Layout Responsivo 4K ─────────────────────────────────────
  const hasHeader = (title && title.trim().length > 0) || (subtitle && subtitle.trim().length > 0);
  const margin = hasHeader ? fs(100) : fs(60); 
  const titleH = hasHeader ? fs(240) : 0;
  const legendGapTop = hasHeader ? fs(32) : fs(10);

  // ── Legenda ──────────────────────────────────────────────────
  const LEGEND_FONT_SIZE = fs(28);
  const LEGEND_LINE_H = LEGEND_FONT_SIZE * 1.35;
  const MAX_CHARS_PER_LINE = 28;
  const ICON_SIZE = fs(32);
  const ICON_TEXT_GAP = fs(12);

  const seriesCount = normalizedSeries.length;
  const legendLinesPerItem = normalizedSeries.map(s => wrapText(s.label, MAX_CHARS_PER_LINE));
  const maxLegendLines = Math.max(...legendLinesPerItem.map(l => l.length), 1);
  const legendBlockH = (showLegend && seriesCount > 1) ? (ICON_SIZE + (maxLegendLines - 1) * LEGEND_LINE_H + fs(20)) : 0;

  const legendTop = margin + titleH + legendGapTop;
  const chartTop = legendTop + (legendBlockH > 0 ? legendBlockH + fs(32) : 0);
  const padBot = fs(120);

  const labelWidth   = width * 0.18;
  const plotLeft     = margin + labelWidth;
  const plotWidth    = width - plotLeft - margin - fs(50);
  const plotHeight   = height - chartTop - padBot;

  const categoryHeight = plotHeight / xAxisLabels.length;
  const groupGap       = 0.3;
  const groupHeight    = categoryHeight * (1 - groupGap);
  
  // No modo stacked, a barra é única e grossa. No modo grouped, são barras finas.
  const barHeight      = stacked ? groupHeight : (groupHeight / seriesCount) * 0.9;

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily, 
      backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : undefined
    }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={T.colors[0]} 
        backgroundType={backgroundType}
      />

      {/* Cabeçalho */}
      {hasHeader && (
        <div style={{ 
          position: "absolute", 
          top: margin, 
          width: "100%", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          padding: `0 ${fs(100)}px`,
          boxSizing: 'border-box',
          opacity: interpolate(frame, [0, 20], [0, 1]), 
          zIndex: 5 
        }}>
          {title && (
            <div style={{ 
              fontSize: fs(Theme.typography.title.size), 
              lineHeight: 1.1,
              fontWeight: 800, 
              color: resolvedText, 
              textAlign: "center",
              maxWidth: fs(3000), 
              wordBreak: 'break-word'
            }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ 
              fontSize: fs(Theme.typography.subtitle.size), 
              color: T.textMuted, 
              marginTop: fs(15),
              textAlign: "center",
              maxWidth: fs(2400)
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}

      <svg width={width} height={height} style={{ overflow: "visible", position: "relative", zIndex: 10 }}>
        <defs>
          {normalizedSeries.map((s, sIdx) => {
            const edgeOpacity = (backgroundType as string) === 'transparent' ? 1 : 0.85;
            
            // Se tiver apenas uma série, criamos um gradiente para cada barra (Efeito Rainbow)
            if (seriesCount === 1) {
              return xAxisLabels.map((_, barIdx) => {
                const baseColor = resolvedColors[barIdx % resolvedColors.length];
                return (
                  <linearGradient key={`hbarGrad-${sIdx}-${barIdx}-${instanceId}`} id={`hbarGrad-${sIdx}-${barIdx}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={baseColor} stopOpacity={edgeOpacity} />
                  </linearGradient>
                );
              });
            }

            const baseColor = s.color || resolvedColors[sIdx % resolvedColors.length];
            return (
              <linearGradient key={sIdx} id={`hbarGrad-${sIdx}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={baseColor} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={edgeOpacity} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Legenda Dinâmica no Topo */}
        {showLegend && seriesCount > 1 && (
          <g opacity={interpolate(frame, [15, 35], [0, 1])}>
            {normalizedSeries.map((s, i) => {
              const itemW = plotWidth / seriesCount;
              const centerX = plotLeft + i * itemW + itemW / 2;
              const lines = legendLinesPerItem[i];
              const blockW = ICON_SIZE + ICON_TEXT_GAP + (Math.min(s.label.length, MAX_CHARS_PER_LINE) * fs(15));
              const startX = centerX - blockW / 2;
              
              return (
                <g key={i} transform={`translate(${startX}, ${legendTop})`}>
                  <rect 
                    width={ICON_SIZE} height={ICON_SIZE} 
                    fill={`url(#hbarGrad-${i}-${instanceId})`} rx={fs(6)}
                    y={(maxLegendLines * LEGEND_LINE_H - ICON_SIZE) / 2}
                  />
                  <text x={ICON_SIZE + ICON_TEXT_GAP} style={{ fontSize: LEGEND_FONT_SIZE, fill: T.textMuted, fontWeight: 600 }}>
                    {lines.map((line, li) => (
                      <tspan key={li} x={ICON_SIZE + ICON_TEXT_GAP} dy={li === 0 ? LEGEND_FONT_SIZE * 0.8 : LEGEND_LINE_H}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* GRID X e LABELS */}
        {niceScale.map(val => {
          const x = plotLeft + ((val - dataMin) / range) * plotWidth;
          return (
            <g key={val}>
              <line x1={x} y1={chartTop} x2={x} y2={chartTop + plotHeight} stroke={T.grid} strokeWidth={fs(2)} opacity={0.8} />
              <text x={x} y={chartTop + plotHeight + fs(40)} textAnchor="middle" style={{ fontSize: fs(24), fill: T.textMuted, fontWeight: 500 }}>
                {formatValue(val, unit)}
              </text>
            </g>
          );
        })}

        {/* TÍTULO DO EIXO X */}
        {xAxisTitle && (
          <text
            x={plotLeft + plotWidth / 2}
            y={chartTop + plotHeight + fs(90)}
            textAnchor="middle"
            style={{ fontSize: fs(24), fill: T.textMuted, fontWeight: 700, opacity: 0.8 }}
          >
            {xAxisTitle}
          </text>
        )}

        {/* BARRAS E LABELS DE CATEGORIA */}
        {xAxisLabels.map((label, gIdx) => {
          const gY = chartTop + gIdx * categoryHeight + (categoryHeight * groupGap) / 2;
          
          let currentStackX = plotLeft;

          return (
            <g key={gIdx}>
              <text x={plotLeft - fs(20)} y={gY + groupHeight/2} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(32), fill: resolvedText, fontWeight: 700 }}>
                {label}
              </text>
              {normalizedSeries.map((s, sIdx) => {
                const val = Number(s.data[gIdx]) || 0;
                const delay = 40 + gIdx * 4 + sIdx * 2;
                const progress = spring({ frame: frame - delay, fps, config: { damping: 50, stiffness: 200 } });
                
                // Lógica de Posicionamento (Stacked vs Grouped)
                const bY = stacked ? gY : gY + sIdx * (groupHeight / (seriesCount || 1));
                const bX = stacked ? currentStackX : plotLeft;
                const bW = Math.max(0, ((val - dataMin) / (range || 1)) * plotWidth * progress);
                
                if (stacked) {
                    currentStackX += bW;
                }

                const fillId = seriesCount === 1 
                  ? `url(#hbarGrad-${sIdx}-${gIdx}-${instanceId})`
                  : `url(#hbarGrad-${sIdx}-${instanceId})`;

                return (
                  <g key={sIdx}>
                    <rect 
                      x={bX} y={bY} width={bW} height={barHeight} 
                      fill={fillId} 
                      stroke={resolvedBg} strokeWidth={fs(1)} rx={stacked ? 0 : fs(6)}
                    />
                    {/* Value Labels: Apenas no modo Grouped ou no final do Stack */}
                    {showValueLabels && progress > 0.8 && (!stacked || sIdx === seriesCount - 1) && (
                      <text 
                        x={stacked ? currentStackX + fs(15) : plotLeft + bW + fs(15)} 
                        y={bY + barHeight / 2} 
                        dominantBaseline="middle" 
                        style={{ 
                            fontSize: fs(24), 
                            fill: resolvedText, 
                            fontWeight: 700, 
                            opacity: interpolate(frame, [delay + 10, delay + 20], [0, 1]), 
                            ...Theme.typography.tabularNums 
                        }}
                      >
                        {formatValue(stacked ? normalizedSeries.reduce((acc, ser) => acc + (Number(ser.data[gIdx]) || 0), 0) : val, unit)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Destaques (Highlights) Container Z-Index Superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, pointerEvents: 'none' }}>
        {annotations.map((ann, i) => {
          const sIdx = ann.seriesIndex || 0;
          const gIdx = ann.index || 0;
          if (!normalizedSeries[sIdx] || xAxisLabels[gIdx] === undefined) return null;
          const val = normalizedSeries[sIdx].data[gIdx] || 0;
          const gY = chartTop + gIdx * categoryHeight + (categoryHeight * groupGap) / 2;
          const bY = gY + sIdx * (groupHeight / seriesCount);
          const bW = ((val - dataMin) / range) * plotWidth;
          return (
            <HighlightCircle 
              key={i} 
              x={plotLeft + bW} 
              y={bY + barHeight/2} 
              delay={160 + i * 20} 
              color="#ff4d6d"
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
