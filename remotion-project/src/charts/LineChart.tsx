import React, { useId } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
  Easing,
  spring
} from "remotion";
import { Theme, resolveTheme, formatValue, parseSafeNumber, getNiceScale, wrapText } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";
import { SmartCallout } from "../components/SmartCallout";

interface LineChartProps {
  data?: any;
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title: string;
  subtitle?: string;
  showArea?: boolean;
  colors?: string[];
  seriesColors?: string[];
  theme?: 'dark' | 'light';
  backgroundColor?: string;
  textColor?: string;
  bgStyle?: any;
  backgroundType?: 'dark' | 'light';
  annotations?: any[];
  unit?: string;
  showValueLabels?: boolean;
  showLegend?: boolean;
  yMin?: number;
  yMax?: number;
  xAxisTitle?: string;
  yAxisTitle?: string;
}

export const LineChart: React.FC<LineChartProps> = (props) => {
  const {
    data: rawData = [],
    series: propsSeries,
    labels: propsLabels,
    title = "",
    subtitle = "",
    showArea = false,
    colors,
    seriesColors,
    theme = "dark",
    backgroundColor,
    textColor,
    unit = '',
    annotations = [],
    backgroundType,
    showValueLabels = true,
    showLegend = true,
    yMin: propYMin,
    yMax: propYMax,
    xAxisTitle = '',
    yAxisTitle = '',
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve tema
  const T = resolveTheme(theme ?? 'dark', backgroundColor, backgroundType, colors || seriesColors, textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const resolvedColors = T.colors;

  const clipId = React.useMemo(() => `lc-clip-${instanceId}`, [instanceId]);

  // Normalização de dados
  let normalizedSeries: { label: string; data: number[]; color?: string }[] = [];
  let xAxisLabels: string[] = [];

  try {
    if (propsSeries && Array.isArray(propsSeries) && propsLabels) {
      normalizedSeries = propsSeries.map(s => ({ ...s, data: Array.isArray(s.data) ? s.data.map((v: any) => parseSafeNumber(v, 0)) : [] }));
      xAxisLabels = propsLabels;
    } else if (rawData && rawData.labels && rawData.datasets) {
      normalizedSeries = rawData.datasets.map((s: any) => ({
        ...s,
        data: Array.isArray(s.data) ? s.data.map((v: any) => parseSafeNumber(v, 0)) : []
      }));
      xAxisLabels = rawData.labels;
    } else if (Array.isArray(rawData)) {
      normalizedSeries = [{
        label: title || "Série 1",
        data: rawData.map((d: any) => parseSafeNumber(d.value, 0))
      }];
      xAxisLabels = rawData.map((d: any) => d.label);
    }
  } catch (e) {
    console.error("Data normalization error:", e);
  }

  if (!xAxisLabels || xAxisLabels.length === 0 || !normalizedSeries || normalizedSeries.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;
  }

  const isHighDensity = xAxisLabels.length > 30;

  // ── Layout Responsivo 4K ─────────────────────────────────────
  const fs = (base: number) => Math.round(base * (width / 1920));
  
  // REGRA DE OURO: Espaçamento dinâmico baseado na existência de Header
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

  const seriesCount = normalizedSeries.length;
  const legendTop = margin + titleH + legendGapTop;
  const chartTop = legendTop + (showLegend && seriesCount > 1 ? fs(100) : 0);
  const padBot = fs(140);

  const plotLeft = margin + fs(120);
  const rightBuffer = fs(400); 
  const plotWidth = width - plotLeft - margin - rightBuffer;
  const plotHeight = height - chartTop - padBot;

  const allValues = normalizedSeries.flatMap(s => s.data);
  const rawMin = propYMin !== undefined ? propYMin : Math.min(...allValues);
  const rawMax = propYMax !== undefined ? propYMax : Math.max(...allValues);
  const niceScale = getNiceScale(rawMax, rawMin, 5);
  const dataMax = niceScale[niceScale.length - 1];
  const dataMin = niceScale[0];
  const range = (dataMax - dataMin) || 0.0001;

  const getX = (seriesIdx: number, dataIdx: number) => {
    const seriesLen = normalizedSeries[seriesIdx].data.length;
    return plotLeft + (dataIdx / (seriesLen - 1 || 1)) * plotWidth;
  };
  const getY = (v: number) => {
    const val = parseSafeNumber(v, dataMin);
    return chartTop + plotHeight - ((val - dataMin) / range) * plotHeight;
  };

  // Direct Labeling Y-Positions
  const sortedByLastVal = [...normalizedSeries]
    .map((s, idx) => ({ s, idx, y: getY(s.data[s.data.length - 1]) }))
    .sort((a, b) => a.y - b.y);

  const labelYPositions: Record<number, number> = {};
  const MIN_LABEL_GAP = fs(30);
  let currentY = -9999;
  sortedByLastVal.forEach(item => {
    if (item.y < currentY + MIN_LABEL_GAP) item.y = currentY + MIN_LABEL_GAP;
    labelYPositions[item.idx] = item.y;
    currentY = item.y;
  });

  const progress = interpolate(frame, [30, 180], [0, 1], {
    easing: Easing.bezier(0.1, 0, 0.1, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily,
      backgroundColor: backgroundType === 'transparent' ? 'transparent' : undefined
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
              maxWidth: fs(3200), 
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
              <div style={{ width: fs(30), height: fs(6), borderRadius: fs(3), backgroundColor: s.color || resolvedColors[i % resolvedColors.length] }} />
              <div style={{ fontSize: fs(26), color: T.textMuted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <svg width={width} height={height} style={{ overflow: "visible", position: "relative", zIndex: 1 }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={plotLeft + (plotWidth + 100) * progress} height={height} />
          </clipPath>
          {normalizedSeries.map((s, i) => {
             const color = s.color || resolvedColors[i % resolvedColors.length];
             return (
              <linearGradient key={i} id={`lineGrad-${clipId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>


        {/* Grid Y (Horizontal) */}
        {niceScale.map((val) => {
          const y = getY(val);
          return (
            <React.Fragment key={val}>
              <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={fs(1.5)} strokeDasharray={fs(8)} />
              <text x={plotLeft - fs(20)} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(22), fill: T.textMuted, fontWeight: 500 }}>
                {formatValue(val, unit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Grid X (Vertical) */}
        {xAxisLabels.map((l, i) => {
          const x = plotLeft + (i / (xAxisLabels.length - 1 || 1)) * plotWidth;
          return (
            <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartTop + plotHeight} stroke={T.grid} strokeWidth={fs(1)} strokeDasharray={fs(5)} opacity={0.6} />
          );
        })}

        {/* Séries */}
        {normalizedSeries.map((s, sIndex) => {
          const color = s.color || resolvedColors[sIndex % resolvedColors.length];
          const linePoints = s.data.map((v, i) => `${getX(sIndex, i)},${getY(v)}`).join(" ");
          const areaPath = `M ${getX(sIndex, 0)},${getY(s.data[0])} ` + s.data.slice(1).map((v, i) => `L ${getX(sIndex, i + 1)},${getY(v)}`).join(" ") + ` L ${getX(sIndex, s.data.length - 1)},${chartTop + plotHeight} L ${getX(sIndex, 0)},${chartTop + plotHeight} Z`;

          return (
            <g key={sIndex}>
              <g clipPath={`url(#${clipId})`}>
                {showArea && <path d={areaPath} fill={`url(#lineGrad-${clipId}-${sIndex})`} />}
                <polyline points={linePoints} fill="none" stroke={color} strokeWidth={fs(isHighDensity ? 2 : 5)} strokeLinecap="round" strokeLinejoin="round" />
                {!isHighDensity && s.data.map((v: number, i: number) => (
                  <React.Fragment key={i}>
                    <circle cx={getX(sIndex, i)} cy={getY(v)} r={fs(6)} fill={resolvedBg} stroke={color} strokeWidth={fs(3)} />
                    {showValueLabels && progress > 0.8 && (
                      <text
                        x={getX(sIndex, i)}
                        y={getY(v) + (sIndex % 2 === 0 ? -fs(25) : fs(38))}
                        textAnchor="middle"
                        style={{
                          fontSize: fs(22),
                          fill: color,
                          fontWeight: 800,
                          opacity: interpolate(progress, [0.8, 1], [0, 1]),
                          textShadow: `0 0 ${fs(10)}px ${resolvedBg}`
                        }}
                      >
                        {formatValue(v, unit)}
                      </text>
                    )}
                  </React.Fragment>
                ))}
              </g>
              {/* Direct Labeling (Final da linha) — só quando sem legenda no topo */}
              {(!showLegend || seriesCount <= 1) && (
                <text
                  x={getX(sIndex, s.data.length - 1) + fs(30)}
                  y={labelYPositions[sIndex]}
                  dominantBaseline="middle"
                  style={{
                    fontSize: fs(24),
                    fill: color,
                    fontWeight: 800,
                    opacity: interpolate(progress, [0.95, 1], [0, 1]),
                  }}
                >
                  {s.label.length > 20 ? s.label.slice(0, 20) + '…' : s.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Eixo X */}
        {xAxisLabels.map((l, i) => {
          if (xAxisLabels.length > 20 && i % Math.ceil(xAxisLabels.length / 10) !== 0) return null;
          return (
            <text
              key={i}
              x={plotLeft + (i / (xAxisLabels.length - 1 || 1)) * plotWidth}
              y={chartTop + plotHeight + fs(45)}
              textAnchor="middle"
              style={{ fontSize: fs(22), fill: T.textMuted, opacity: interpolate(frame, [20, 40], [0, 1]) }}
            >
              {l}
            </text>
          );
        })}

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

      {/* Container de Callouts com Z-Index Superior Garantido */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, pointerEvents: 'none' }}>
        {annotations.map((ann, i) => {
          if (!ann || ann.index === undefined || !normalizedSeries[ann.seriesIndex || 0]) return null;
          const sIdx = ann.seriesIndex || 0;
          const data = normalizedSeries[sIdx].data;
          const idx = Math.min(Math.max(0, ann.index), data.length - 1);
          const val = data[idx];
          const x = getX(sIdx, idx);
          const y = getY(val);

          return (
            <SmartCallout
              key={`ann-${i}`}
              x={x}
              y={y}
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
