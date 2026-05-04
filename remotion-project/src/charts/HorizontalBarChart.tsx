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
import { SmartCallout } from "../components/SmartCallout";

interface HorizontalBarChartProps {
  data?: { label: string; value: number }[];
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  theme?: string;
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
  showValueLabels = false,
  annotations = [],
  bgStyle = 'none',
  backgroundType,
  showLegend = true,
}) => {
  const frame      = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const fs = (base: number) => Math.round(base * (width / 1920));

  // Resolve tema
  const T = resolveTheme(theme, backgroundColor, backgroundType, colors || seriesColors, textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const paletteFromProps = (colors ?? seriesColors)?.filter(Boolean) ?? [];
  const resolvedColors = paletteFromProps.length > 0 ? paletteFromProps : [...T.colors];

  const instanceId = useId().replace(/:/g, "");

  // Normalização de dados
  const safeData = Array.isArray(data) ? data : [];
  const normalizedSeries = (series && series.length > 0) ? series : [
    { label: title || 'Data', data: safeData.map(d => d.value) }
  ];
  const xAxisLabels = labels || safeData.map(d => d.label);

  const allValues = normalizedSeries.flatMap(s => s.data).map(v => Number(v) || 0);
  if (allValues.length === 0 || xAxisLabels.length === 0) {
     return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;
  }

  const dataMinRaw = Math.min(...allValues, 0);
  const dataMaxRaw = Math.max(...allValues, 0.0001);
  const niceScale = getNiceScale(dataMaxRaw * 1.15, dataMinRaw, 5);
  const dataMin = niceScale[0];
  const dataMax = niceScale[niceScale.length - 1];
  const range = dataMax - dataMin || 0.0001;

  // ── Layout Responsivo 4K ─────────────────────────────────────
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
  const barHeight      = (groupHeight / seriesCount) * 0.9;

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily, backgroundColor: resolvedBg }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={T.colors[0]} 
        backgroundType={backgroundType}
      />

      {/* Cabeçalho */}
      {hasHeader && (
        <div style={{ position: "absolute", top: margin, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), zIndex: 5 }}>
          {title && <div style={{ fontSize: fs(Theme.typography.title.size), fontWeight: 800, color: resolvedText }}>{title}</div>}
          {subtitle && <div style={{ fontSize: fs(Theme.typography.subtitle.size), color: T.textMuted, marginTop: fs(10) }}>{subtitle}</div>}
        </div>
      )}

      <svg width={width} height={height} style={{ overflow: "visible", position: "relative", zIndex: 10 }}>
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
                    fill={s.color || resolvedColors[i % resolvedColors.length]} rx={fs(6)}
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

        {/* BARRAS E LABELS DE CATEGORIA */}
        {xAxisLabels.map((label, gIdx) => {
          const gY = chartTop + gIdx * categoryHeight + (categoryHeight * groupGap) / 2;
          return (
            <g key={gIdx}>
              <text x={plotLeft - fs(20)} y={gY + groupHeight/2} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(32), fill: resolvedText, fontWeight: 700 }}>
                {label}
              </text>
              {normalizedSeries.map((s, sIdx) => {
                const val = s.data[gIdx] || 0;
                const delay = 40 + gIdx * 4 + sIdx * 2;
                const progress = spring({ frame: frame - delay, fps, config: { damping: 50, stiffness: 200 } });
                const bY = gY + sIdx * (groupHeight / (seriesCount || 1));
                const bW = Math.max(1, ((val - dataMin) / (range || 1)) * plotWidth * progress);
                const color = s.color || resolvedColors[sIdx % resolvedColors.length];
                return (
                  <rect 
                    key={sIdx} x={plotLeft} y={bY} width={bW} height={barHeight} fill={color} 
                    stroke={resolvedBg} strokeWidth={fs(2)} rx={fs(6)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* CALLOUTS CONTAINER Z-INDEX SUPERIOR */}
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
            <SmartCallout 
              key={i} x={plotLeft + bW} y={bY + barHeight/2} label={ann.label} value={formatValue(val, unit)}
              theme={theme} delay={160 + i * 20} color={normalizedSeries[sIdx].color || T.colors[sIdx % T.colors.length]}
              index={i} backgroundType={backgroundType}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
