import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";
import { DynamicBackground } from "../layout/DynamicBackground";
import { SmartCallout } from "../components/SmartCallout";

interface BarChartProps {
  data?: any;
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
  bgStyle?: any;
  backgroundType?: 'dark' | 'light';
  annotations?: any[];
}

export const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    data: rawData = [],
    series: propsSeries,
    labels: propsLabels,
    title = "",
    subtitle = "",
    colors,
    theme = "dark",
    backgroundColor,
    textColor,
    unit = '',
    showValueLabels = false,
    annotations = [],
    backgroundType,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve tema
  const T = resolveTheme(theme, backgroundColor, backgroundType);
  const resolvedBg = backgroundType ? T.background : (backgroundColor ?? T.background);
  const resolvedText  = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Normalização de dados com Safe-Guards
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
      normalizedSeries = [{ label: title, data: rawData.map((d: any) => d.value) }];
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
  const seriesCount   = normalizedSeries.length;

  // ─── SMART UNIT HANDLING ───
  const isLongUnit  = unit.length > 6;
  const displayUnit = isLongUnit ? "" : unit;
  const unitNote    = isLongUnit ? `Unidade: ${unit}` : "";

  // ─── Layout responsivo ───
  const fs = (base: number) => Math.round(base * (width / 1280));
  const pad = width * 0.04;
  const padTop = height * 0.20; // Aumentado para 20% conforme regra 1049
  const padBot = height * 0.12; 

  const plotLeft = pad + width * (isLongUnit ? 0.12 : 0.08);   
  const plotTop = padTop;
  const plotWidth = width - plotLeft - (pad * 1.5); 
  const plotHeight = height - padTop - padBot;

  const dataMin = Math.min(...allValues, 0);
  const dataMax = Math.max(...allValues, 0.0001); // Prevent zero axis
  const range   = dataMax - dataMin;
  
  // REGRA: Aumentar escala em 15% para caber labels no topo (Surgical-Grade)
  const maxVal  = dataMax * 1.15; 
  
  const categoryWidth = plotWidth / safeDataCount;
  const groupGap      = 0.3;
  const innerGap      = 0.05;
  const availableW    = categoryWidth * (1 - groupGap);
  const barWidth      = (availableW / seriesCount) * (1 - innerGap);

  const shouldRotateLabels = safeDataCount > 8;
  const getY = (v: number) => plotTop + plotHeight - (v / maxVal) * plotHeight;

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={resolvedColors[0]} 
        backgroundType={backgroundType}
      />
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          {normalizedSeries.map((_, i) => (
            <linearGradient key={i} id={`barGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolvedColors[i % resolvedColors.length]} />
              <stop offset="100%" stopColor={resolvedColors[i % resolvedColors.length]} stopOpacity={0.65} />
            </linearGradient>
          ))}
          <filter id={`glow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={fs(3)} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* GRID Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const val = dataMin + v * range;
          const y = getY(val);
          const op = interpolate(frame, [5, 25], [0, 0.85], { extrapolateRight: "clamp" });
          return (
            <React.Fragment key={v}>
              <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={fs(1.8)} opacity={op} />
              <text x={plotLeft - fs(15)} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(14), fill: T.textMuted, opacity: op, ...Theme.typography.tabularNums }}>
                {formatValue(val, displayUnit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* AXIS LINE */}
        <line x1={plotLeft} y1={plotTop + plotHeight} x2={plotLeft + plotWidth} y2={plotTop + plotHeight} stroke={T.axis} strokeWidth={Math.max(1, fs(2))} opacity={0.6} />

        {/* BARS */}
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
            const bY = plotTop + plotHeight - currentH;

            const op = interpolate(frame, [delay + 10, delay + 20], [0, 1], { extrapolateRight: "clamp" });

            return (
              <g key={`${groupIdx}-${seriesIdx}`}>
                <rect x={bX} y={bY} width={barWidth} height={currentH} fill={seriesCount > 1 ? `url(#barGrad-${seriesIdx}-${instanceId})` : (s.color || resolvedColors[groupIdx % resolvedColors.length])} rx={fs(4)} />
                {progress > 0.8 && (
                  <text x={bX + barWidth / 2} y={bY - fs(8)} textAnchor="middle" style={{ fontSize: fs(shouldRotateLabels ? 11 : 16), fill: resolvedText, fontWeight: 700, opacity: op, ...Theme.typography.tabularNums }}>
                    {formatValue(val, displayUnit)}
                  </text>
                )}
                {seriesIdx === 0 && (
                  <text x={groupX + availableW / 2} y={plotTop + plotHeight + fs(shouldRotateLabels ? 12 : 28)} textAnchor={shouldRotateLabels ? "end" : "middle"} transform={shouldRotateLabels ? `rotate(-35, ${groupX + availableW / 2}, ${plotTop + plotHeight + fs(15)})` : ""} opacity={interpolate(frame, [20, 40], [0, 1])} style={{ fontSize: fs(shouldRotateLabels ? 12 : 14), fill: T.textMuted }}>
                    {label}
                  </text>
                )}
              </g>
            );
          })
        ))}
      </svg>

      {/* ANOTAÇÕES INTELIGENTES (SMART CALLOUTS) */}
      {annotations.map((ann, i) => {
        if (!ann || ann.index === undefined || !normalizedSeries[ann.seriesIndex || 0]) return null;
        
        const sIdx = ann.seriesIndex || 0;
        const gIdx = Math.min(Math.max(0, ann.index), xAxisLabels.length - 1);
        
        const val = normalizedSeries[sIdx].data[gIdx] || 0;
        
        const groupX = plotLeft + gIdx * categoryWidth + (categoryWidth * groupGap) / 2;
        const bX = groupX + sIdx * (barWidth * (1 + innerGap));
        const calloutX = bX + barWidth / 2;
        const calloutY = plotTop + plotHeight - ((val - dataMin) / range) * plotHeight;

        return (
          <SmartCallout
            key={`ann-${i}`}
            x={calloutX}
            y={calloutY}
            label={ann.label}
            value={ann.value !== undefined ? formatValue(ann.value, displayUnit) : undefined}
            theme={theme}
            delay={140 + i * 15}
            color={T.colors[0]}
          />
        );
      })}

      {/* LEGEND */}
      {seriesCount > 1 && (
        <div style={{ position: 'absolute', bottom: height * 0.08, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: fs(40), opacity: interpolate(frame, [40, 60], [0, 1]), pointerEvents: 'none' }}>
          {normalizedSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(10) }}>
              <div style={{ width: fs(16), height: fs(16), borderRadius: '4px', backgroundColor: s.color || resolvedColors[i % resolvedColors.length], boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              <div style={{ fontSize: fs(20), color: resolvedText, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* HEADER - Processado APÓS para garantir Z-Index */}
      <div style={{ position: "absolute", top: height * 0.05, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), pointerEvents: 'none' }}>
        {title && <div style={{ fontSize: fs(44), fontWeight: 800, color: resolvedText, letterSpacing: "-0.5px" }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(24), color: T.textMuted, marginTop: fs(10), fontWeight: 500 }}>{subtitle}</div>}
        {unitNote && <div style={{ fontSize: fs(18), color: T.textMuted, marginTop: fs(12), fontStyle: 'italic', opacity: 0.8 }}>*{unitNote}</div>}
      </div>
    </AbsoluteFill>
  );
};
