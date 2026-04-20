import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, formatValue } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";
import { SmartCallout } from "../components/SmartCallout";

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
  annotations?: any[];
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light';
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
  backgroundColor,
  textColor,
  showValueLabels = false,
  annotations = [],
  bgStyle = 'none',
  backgroundType,
}) => {
  const frame      = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const fs = (base: number) => Math.round(base * (width / 1280));

  // Resolve tema
  const T = resolveTheme(theme, backgroundColor, backgroundType);
  const resolvedBg = backgroundType ? T.background : (backgroundColor ?? T.background);
  const resolvedText = textColor ?? T.text;

  const instanceId = useId().replace(/:/g, "");

  // Normalização de dados
  const safeData = Array.isArray(data) ? data : [];
  const normalizedSeries = series?.[0] ? series : [
    { label: title || 'Data', data: safeData.map(d => d.value) }
  ];
  const xAxisLabels = labels || safeData.map(d => d.label);

  const allValues = normalizedSeries.flatMap(s => s.data).map(v => Number(v) || 0);
  if (allValues.length === 0 || xAxisLabels.length === 0) {
     return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;
  }

  const dataMax = Math.max(...allValues, 1);
  const maxVal  = dataMax;

  // Layout 4K UHD
  const pad          = width * 0.05;
  const padTop       = height * 0.20; 
  const padBot       = height * 0.15; 
  
  const labelWidth   = width * 0.18;
  const plotLeft     = pad + labelWidth;
  const plotTop      = padTop;
  const plotWidth    = width - plotLeft - pad - fs(50);
  const plotHeight   = height - padTop - padBot;

  const categoryHeight = plotHeight / xAxisLabels.length;
  const groupGap       = 0.3; // 30% gap entre categorias
  const groupHeight    = categoryHeight * (1 - groupGap);
  const barHeight      = (groupHeight / normalizedSeries.length) * 0.9; // 10% gap entre barras no grupo

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily, backgroundColor: resolvedBg }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={T.colors[0]} 
        backgroundType={backgroundType}
      />

      <svg width={width} height={height} style={{ overflow: "visible", position: "relative", zIndex: 10 }}>
        {/* GRID X e LABELS */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => {
          const x = plotLeft + v * plotWidth;
          return (
            <g key={v}>
              <line 
                x1={x} y1={plotTop} x2={x} y2={plotTop + plotHeight} 
                stroke={T.grid} strokeWidth={fs(2)} opacity={0.8} 
              />
              <text 
                x={x} y={plotTop + plotHeight + fs(40)} 
                textAnchor="middle" 
                style={{ fontSize: fs(24), fill: T.textMuted, fontWeight: 500 }}
              >
                {formatValue(v * maxVal, unit)}
              </text>
            </g>
          );
        })}

        {/* BARRAS E LABELS DE CATEGORIA */}
        {xAxisLabels.map((label, gIdx) => {
          const gY = plotTop + gIdx * categoryHeight + (categoryHeight * groupGap) / 2;
          
          return (
            <g key={gIdx}>
              {/* Nome da Categoria (Y-Axis Label) */}
              <text 
                x={plotLeft - fs(20)} y={gY + groupHeight/2} 
                textAnchor="end" dominantBaseline="middle" 
                style={{ fontSize: fs(32), fill: resolvedText, fontWeight: 700 }}
              >
                {label}
              </text>

              {normalizedSeries.map((s, sIdx) => {
                const val = s.data[gIdx] || 0;
                const delay = 40 + gIdx * 4 + sIdx * 2;
                const progress = spring({ frame: frame - delay, fps, config: { damping: 50, stiffness: 200 } });
                
                const bY = gY + sIdx * (groupHeight / (normalizedSeries.length || 1));
                const bW = Math.max(1, (val / maxVal) * plotWidth * progress);
                const color = sIdx === 0 ? '#4f8ef7' : '#00e5a0';
                
                return (
                  <rect 
                    key={sIdx}
                    x={plotLeft} 
                    y={bY} 
                    width={bW} 
                    height={barHeight} 
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={fs(2)}
                    rx={fs(4)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* CALLOUTS */}
      {annotations.map((ann, i) => {
        const sIdx = ann.seriesIndex || 0;
        const gIdx = ann.index || 0;
        if (!normalizedSeries[sIdx] || xAxisLabels[gIdx] === undefined) return null;

        const val = normalizedSeries[sIdx].data[gIdx] || 0;
        const gY = plotTop + gIdx * categoryHeight + (categoryHeight * groupGap) / 2;
        const bY = gY + sIdx * (groupHeight / normalizedSeries.length);
        const bW = (val / maxVal) * plotWidth;

        return (
          <SmartCallout 
            key={i}
            x={plotLeft + bW}
            y={bY + barHeight/2}
            label={ann.label}
            value={formatValue(val, unit)}
            theme={theme}
            delay={160 + i * 20}
            color={normalizedSeries[sIdx].color || T.colors[sIdx % T.colors.length]}
          />
        );
      })}

      {/* TITULO */}
      <div style={{
        position: 'absolute', top: fs(80), width: '100%', textAlign: 'center',
        color: resolvedText, fontSize: fs(72), fontWeight: 900,
        opacity: interpolate(frame, [0, 20], [0, 1])
      }}>
        {title}
      </div>

      {/* LEGENDA */}
      {normalizedSeries.length > 1 && (
        <div style={{
          position: 'absolute', bottom: fs(100), width: '100%', 
          display: 'flex', justifyContent: 'center', gap: fs(80),
          opacity: interpolate(frame, [60, 80], [0, 1])
        }}>
          {normalizedSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(15) }}>
              <div style={{ width: fs(30), height: fs(30), borderRadius: '50%', backgroundColor: s.color || T.colors[i % T.colors.length] }} />
              <div style={{ fontSize: fs(36), color: resolvedText, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
