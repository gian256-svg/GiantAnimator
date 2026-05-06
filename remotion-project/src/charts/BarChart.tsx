import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, formatValue, getNiceScale, parseSafeNumber, wrapText } from "../theme";
import { DynamicBackground } from "../layout/DynamicBackground";
import { HighlightCircle } from "../components/HighlightCircle";

interface BarChartProps {
  data?: any;
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title?: string;
  subtitle?: string;
  colors?: string[];
  seriesColors?: string[];
  theme?: 'dark' | 'light';
  backgroundColor?: string;
  backgroundType?: string;
  textColor?: string;
  unit?: string;
  showValueLabels?: boolean;
  showLegend?: boolean;
  xAxisTitle?: string;
  yAxisTitle?: string;
  yMin?: number;
  yMax?: number;
  annotations?: { index: number; seriesIndex?: number; label: string }[];
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    data: rawData = [],
    series: propsSeries,
    labels: propsLabels,
    title = "",
    subtitle = "",
    colors,
    seriesColors,
    theme = "dark" as const,
    backgroundColor,
    textColor,
    unit = '',
    showValueLabels = true,
    annotations = [],
    backgroundType,
    showLegend = true,
    xAxisTitle = '',
    yAxisTitle = '',
    yMin: propYMin,
    yMax: propYMax,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve tema
  const T = resolveTheme(theme, backgroundColor, backgroundType, seriesColors || colors, textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const resolvedColors = T.colors;

  // Normalização de dados
  let normalizedSeries: { label: string; data: number[]; color?: string }[] = [];
  let xAxisLabels: string[] = [];

  try {
    if (propsSeries && Array.isArray(propsSeries) && propsLabels) {
      normalizedSeries = propsSeries.map(s => ({ ...s, data: Array.isArray(s.data) ? s.data : [] }));
      xAxisLabels = propsLabels;
    } else if (rawData && rawData.labels && rawData.datasets) {
      normalizedSeries = rawData.datasets;
      xAxisLabels = rawData.labels;
    } else if (Array.isArray(rawData)) {
      normalizedSeries = [{ label: title || "Série 1", data: rawData.map((d: any) => d.value) }];
      xAxisLabels = rawData.map((d: any) => d.label);
    }
  } catch (e) {
    console.error("Data normalization error:", e);
  }

  const allValues = normalizedSeries.flatMap(s => s.data).map(v => Number(v)).filter(v => isFinite(v));
  if (allValues.length === 0 || xAxisLabels.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : resolvedBg }} />;
  }

  const safeDataCount = xAxisLabels.length || 1;
  const seriesCount = normalizedSeries.length;

  // ── Layout Responsivo 4K ─────────────────────────────────────
  const fs = (base: number) => Math.round(base * (width / 1920));
  
  const hasHeader = (title && title.trim().length > 0) || (subtitle && subtitle.trim().length > 0);
  const margin = hasHeader ? fs(100) : fs(60); 
  const titleH = hasHeader ? fs(160) : 0;
  const legendGapTop = hasHeader ? fs(20) : fs(10);

  // ── Legenda: acima do gráfico, centralizada ──────────────────
  const LEGEND_FONT_SIZE = fs(28);
  const LEGEND_LINE_H = LEGEND_FONT_SIZE * 1.35;
  const MAX_CHARS_PER_LINE = 28;
  const ICON_SIZE = fs(32);
  const ICON_TEXT_GAP = fs(12);

  const legendTop = margin + titleH + legendGapTop;
  const chartTop = legendTop + (showLegend && seriesCount > 1 ? fs(100) : 0);
  const padBot = fs(140);

  const plotLeft = margin + width * (unit.length > 6 ? 0.12 : 0.08);
  const plotWidth = width - plotLeft - margin;
  const plotHeight = height - chartTop - padBot;

  const dataMinRaw = propYMin !== undefined ? propYMin : Math.min(...allValues, 0);
  const dataMaxRaw = propYMax !== undefined ? propYMax : Math.max(...allValues, 0.0001);
  const niceScale = getNiceScale(dataMaxRaw * (propYMax !== undefined ? 1 : 1.15), dataMinRaw, 5);
  const dataMax = niceScale[niceScale.length - 1];
  const dataMin = niceScale[0];
  const range = dataMax - dataMin || 0.0001;

  const categoryWidth = plotWidth / safeDataCount;
  const groupGap = 0.3;
  const innerGap = 0.05;
  const availableW = categoryWidth * (1 - groupGap);
  const barWidth = (availableW / seriesCount) * (1 - innerGap);

  const getY = (v: number) => {
    const val = parseSafeNumber(v, dataMin);
    return chartTop + plotHeight - ((val - dataMin) / (range || 1)) * plotHeight;
  };

  const shouldRotateLabels = safeDataCount > 12;

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily,
      backgroundColor: backgroundType === 'transparent' ? 'rgba(0,0,0,0)' : undefined
    }}>
      <DynamicBackground
        baseColor={resolvedBg}
        accentColor={resolvedColors[0]}
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

      {/* Legenda em HTML (Flexbox para evitar sobreposição) */}
      {showLegend && seriesCount > 1 && (
        <div style={{
          position: 'absolute',
          top: legendTop,
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: fs(40),
          padding: `0 ${fs(100)}px`,
          boxSizing: 'border-box',
          opacity: interpolate(frame, [15, 35], [0, 1]),
          zIndex: 10
        }}>
          {normalizedSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(12) }}>
              <div style={{ width: fs(24), height: fs(24), borderRadius: fs(4), backgroundColor: s.color || resolvedColors[i % resolvedColors.length] }} />
              <div style={{ fontSize: fs(26), color: T.textMuted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, overflow: 'visible', zIndex: 1 }}>
        <defs>
          {normalizedSeries.map((s, seriesIdx) => {
            const bottomOpacity = backgroundType === 'transparent' ? 1 : 0.65;
            // Se tiver apenas uma série, criamos um gradiente para cada barra (Efeito Rainbow)
            if (seriesCount === 1) {
              return xAxisLabels.map((_, barIdx) => {
                const baseColor = resolvedColors[barIdx % resolvedColors.length];
                return (
                  <linearGradient key={`barGrad-${seriesIdx}-${barIdx}-${instanceId}`} id={`barGrad-${seriesIdx}-${barIdx}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={baseColor} stopOpacity={bottomOpacity} />
                  </linearGradient>
                );
              });
            }
            // Caso contrário, um gradiente por série
            const baseColor = s.color || resolvedColors[seriesIdx % resolvedColors.length];
            return (
              <linearGradient key={seriesIdx} id={`barGrad-${seriesIdx}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={baseColor} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={bottomOpacity} />
              </linearGradient>
            );
          })}
        </defs>


        {/* Grid Y (Horizontal) */}
        {niceScale.map((val) => {
          const y = getY(val);
          const op = interpolate(frame, [5, 25], [0, 0.85]);
          return (
            <React.Fragment key={val}>
              <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={fs(1.8)} opacity={op} />
              <text x={plotLeft - fs(15)} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(22), fill: T.textMuted, opacity: op, ...Theme.typography.tabularNums }}>
                {formatValue(val, unit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Grid X (Vertical) */}
        {xAxisLabels.map((l, i) => {
          const x = plotLeft + i * categoryWidth + categoryWidth / 2;
          return (
            <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartTop + plotHeight} stroke={T.grid} strokeWidth={fs(1)} strokeDasharray={fs(5)} opacity={0.4} />
          );
        })}

        {/* Eixo X */}
        <line x1={plotLeft} y1={chartTop + plotHeight} x2={plotLeft + plotWidth} y2={chartTop + plotHeight} stroke={T.axis} strokeWidth={fs(2)} opacity={0.6} />

        {/* Barras */}
        {xAxisLabels.map((label, groupIdx) => (
          normalizedSeries.map((s, seriesIdx) => {
            const val = s.data[groupIdx] || 0;
            const delay = 20 + groupIdx * 2 + seriesIdx * 1;
            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 80, stiffness: 200, overshootClamping: true },
            });

            const currentH = Math.max(0, ((val - dataMin) / range) * plotHeight * progress);
            const groupX = plotLeft + groupIdx * categoryWidth + (categoryWidth * groupGap) / 2;
            const bX = groupX + seriesIdx * (barWidth * (1 + innerGap));
            const bY = chartTop + plotHeight - currentH;

            const op = interpolate(frame, [delay + 10, delay + 20], [0, 1]);
            const fillId = seriesCount === 1 
              ? `url(#barGrad-${seriesIdx}-${groupIdx}-${instanceId})`
              : `url(#barGrad-${seriesIdx}-${instanceId})`;

            return (
              <g key={`${groupIdx}-${seriesIdx}`}>
                <rect
                  x={bX} y={bY} width={barWidth} height={currentH}
                  fill={fillId}
                  rx={fs(6)}
                />
                {showValueLabels && progress > 0.8 && (
                  <text x={bX + barWidth / 2} y={bY - fs(10)} textAnchor="middle" style={{ fontSize: fs(18), fill: resolvedText, fontWeight: 700, opacity: op }}>
                    {formatValue(val, unit)}
                  </text>
                )}
                {seriesIdx === 0 && (
                  <text 
                    x={groupX + availableW / 2} 
                    y={chartTop + plotHeight + fs(shouldRotateLabels ? 15 : 45)} 
                    textAnchor={shouldRotateLabels ? "end" : "middle"} 
                    transform={shouldRotateLabels ? `rotate(-45, ${groupX + availableW / 2}, ${chartTop + plotHeight + fs(15)})` : ""}
                    style={{ fontSize: fs(22), fill: T.textMuted, fontWeight: 600, opacity: interpolate(frame, [20, 40], [0, 1]) }}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })
        ))}
        {/* Título do Eixo X */}
        {xAxisTitle && (
          <text
            x={plotLeft + plotWidth / 2}
            y={height - fs(40)}
            textAnchor="middle"
            style={{ fontSize: fs(24), fill: T.textMuted, fontWeight: 700, opacity: 0.8 }}
          >
            {xAxisTitle}
          </text>
        )}

        {/* Título do Eixo Y */}
        {yAxisTitle && (
          <text
            x={fs(40)}
            y={chartTop + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${fs(40)}, ${chartTop + plotHeight / 2})`}
            style={{ fontSize: fs(24), fill: T.textMuted, fontWeight: 700, opacity: 0.8 }}
          >
            {yAxisTitle}
          </text>
        )}
      </svg>

      {/* Destaques (Highlights) Container Z-Index Superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, pointerEvents: 'none' }}>
        {annotations.map((ann, i) => {
          if (!ann || ann.index === undefined || !normalizedSeries[ann.seriesIndex || 0]) return null;
          const sIdx = ann.seriesIndex || 0;
          const gIdx = Math.min(Math.max(0, ann.index), xAxisLabels.length - 1);
          const val = normalizedSeries[sIdx].data[gIdx] || 0;
          const groupX = plotLeft + gIdx * categoryWidth + (categoryWidth * groupGap) / 2;
          const bX = groupX + sIdx * (barWidth * (1 + innerGap));
          const calloutX = bX + barWidth / 2;
          const calloutY = getY(val);

          return (
            <HighlightCircle
              key={`ann-${i}`}
              x={calloutX}
              y={calloutY}
              delay={140 + i * 15}
              color="#ff4d6d"
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
