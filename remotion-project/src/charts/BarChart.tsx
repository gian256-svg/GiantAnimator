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
import { SmartCallout } from "../components/SmartCallout";

interface BarChartProps {
  data?: any;
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title?: string;
  subtitle?: string;
  colors?: string[];
  seriesColors?: string[];
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  unit?: string;
  showValueLabels?: boolean;
  bgStyle?: any;
  backgroundType?: 'dark' | 'light';
  annotations?: any[];
  showLegend?: boolean;
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
    theme = "dark",
    backgroundColor,
    textColor,
    unit = '',
    showValueLabels = false,
    annotations = [],
    backgroundType,
    showLegend = true,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve tema
  const T = resolveTheme(theme, backgroundColor, backgroundType, colors || seriesColors, textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const resolvedColors = (colors || seriesColors || T.colors).filter(Boolean);

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
    return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;
  }

  const safeDataCount = xAxisLabels.length || 1;
  const seriesCount = normalizedSeries.length;

  // ── Layout Responsivo 4K ─────────────────────────────────────
  const fs = (base: number) => Math.round(base * (width / 1920));
  
  const hasHeader = (title && title.trim().length > 0) || (subtitle && subtitle.trim().length > 0);
  const margin = hasHeader ? fs(128) : fs(60); 
  const titleH = hasHeader ? fs(160) : 0;
  const legendGapTop = hasHeader ? fs(24) : fs(10);

  // ── Legenda: acima do gráfico, centralizada ──────────────────
  const LEGEND_FONT_SIZE = fs(28);
  const LEGEND_LINE_H = LEGEND_FONT_SIZE * 1.35;
  const MAX_CHARS_PER_LINE = 28;
  const ICON_SIZE = fs(32);
  const ICON_TEXT_GAP = fs(12);

  const legendLinesPerItem = normalizedSeries.map(s => wrapText(s.label, MAX_CHARS_PER_LINE));
  const maxLegendLines = Math.max(...legendLinesPerItem.map(l => l.length), 1);
  const legendBlockH = (showLegend && seriesCount > 1) ? (ICON_SIZE + (maxLegendLines - 1) * LEGEND_LINE_H + fs(20)) : 0;

  const legendTop = margin + titleH + legendGapTop;
  const chartTop = legendTop + (legendBlockH > 0 ? legendBlockH + fs(32) : 0);
  const padBot = fs(120);

  const plotLeft = margin + width * (unit.length > 6 ? 0.12 : 0.08);
  const plotWidth = width - plotLeft - margin;
  const plotHeight = height - chartTop - padBot;

  const dataMinRaw = Math.min(...allValues, 0);
  const dataMaxRaw = Math.max(...allValues, 0.0001);
  const niceScale = getNiceScale(dataMaxRaw * 1.15, dataMinRaw, 5);
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
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground
        baseColor={resolvedBg}
        accentColor={resolvedColors[0]}
        backgroundType={backgroundType}
      />
      
      {/* Cabeçalho */}
      {hasHeader && (
        <div style={{ position: "absolute", top: margin, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), zIndex: 5 }}>
          {title && <div style={{ fontSize: fs(Theme.typography.title.size), fontWeight: 800, color: resolvedText }}>{title}</div>}
          {subtitle && <div style={{ fontSize: fs(Theme.typography.subtitle.size), color: T.textMuted, marginTop: fs(10) }}>{subtitle}</div>}
        </div>
      )}

      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, overflow: 'visible', zIndex: 1 }}>
        <defs>
          {normalizedSeries.map((s, i) => {
            const baseColor = s.color || resolvedColors[i % resolvedColors.length];
            return (
              <linearGradient key={i} id={`barGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={baseColor} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0.65} />
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
                    fill={`url(#barGrad-${i}-${instanceId})`} rx={fs(6)}
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

        {/* Grid Y */}
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

            return (
              <g key={`${groupIdx}-${seriesIdx}`}>
                <rect
                  x={bX} y={bY} width={barWidth} height={currentH}
                  fill={`url(#barGrad-${seriesIdx}-${instanceId})`}
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
      </svg>

      {/* Callouts Container Z-Index Superior */}
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
            <SmartCallout
              key={`ann-${i}`}
              x={calloutX}
              y={calloutY}
              label={ann.label}
              value={formatValue(val, unit)}
              theme={theme}
              delay={140 + i * 15}
              color={normalizedSeries[sIdx].color || T.colors[sIdx % T.colors.length]}
              index={i}
              backgroundType={backgroundType}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
