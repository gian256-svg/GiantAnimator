import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { Theme, resolveTheme, formatValue, parseSafeNumber, isColorDark, getNiceScale } from '../theme';
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
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  bgStyle?: any;
  backgroundType?: 'dark' | 'light';
  annotations?: any[];
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
    theme = "dark",
    backgroundColor,
    textColor,
    unit = '',
    annotations = [],
    backgroundType,
  } = props;

  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig(); // fps unused

  // Resolve tema com detecção adaptativa de contraste
  const T = resolveTheme(theme ?? 'dark', backgroundColor, backgroundType);
  const resolvedBg = backgroundColor ?? T.background;
  const resolvedText = textColor ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Identificador único para clipPath (REGRA SVG: IDs não podem começar com número!)
  const clipId = React.useMemo(() => `lc-clip-${Math.random().toString(36).substr(2, 9)}`, []);

  // Normalização de dados com Safe-Guards
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
        label: title, 
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

  // Propriedades Estendidas (UHD High-Fidelity)
  // const showEndLabels = true; // Unused but kept for reference if needed
  const isHighDensity = normalizedSeries.some(s => s.data.length > 25);

  // Layout 4K UHD - Seguindo FILOSOFIA 4K
  const fs = (base: number) => Math.round(base * (width / 1280));
  const pad = width * 0.05;
  const padTop = height * 0.18; // Aumentado para 18-20% conforme regra 1049
  const padBot = height * 0.12; 
  const plotLeft = pad + width * 0.06;
  const plotTop = padTop;
  const rightBuffer = fs(160); // Espaço garantido para labels diretos
  const plotWidth = width - plotLeft - rightBuffer;
  const plotHeight = height - padTop - padBot;

  const allValues = normalizedSeries.flatMap(s => s.data).map(v => Number(v)).filter(v => isFinite(v));
  if (allValues.length === 0) return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;
  
  const niceScale = getNiceScale(Math.max(...allValues, 1) * 1.05, Math.min(...allValues, 0), 5);
  const dataMax = niceScale[niceScale.length - 1];
  const dataMin = niceScale[0];
  
  const range = (dataMax - dataMin) || 0.0001;
  const minV = dataMin;

  const getX = (seriesIdx: number, dataIdx: number) => {
    const seriesLen = normalizedSeries[seriesIdx].data.length;
    return plotLeft + (dataIdx / (seriesLen - 1 || 1)) * plotWidth;
  };
  const getY = (v: number) => {
    const val = parseSafeNumber(v, dataMin);
    return plotTop + plotHeight - ((val - minV) / range) * plotHeight;
  };

  // Algoritmo Anti-Colisão para Labels no Eixo Y (Direct Labeling)
  const sortedByLastVal = [...normalizedSeries]
    .map((s, idx) => ({ s, idx, y: getY(s.data[s.data.length - 1]) }))
    .sort((a, b) => a.y - b.y);

  const labelYPositions: Record<number, number> = {};
  const MIN_LABEL_GAP = fs(28);
  let currentY = -9999;

  sortedByLastVal.forEach(item => {
    if (item.y < currentY + MIN_LABEL_GAP) {
      item.y = currentY + MIN_LABEL_GAP;
    }
    labelYPositions[item.idx] = item.y;
    currentY = item.y;
  });

  // REGRA UNIFICADA: Revelação estendida para trim path mais lento (8s / 240f)
  const progress = interpolate(frame, [30, 30 + 240], [0, 1], {
    easing: Easing.bezier(0.1, 0, 0.1, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={resolvedColors[0]} 
        backgroundType={backgroundType}
      />
      <svg width={width} height={height} style={{ overflow: "visible", position: "relative", zIndex: 1 }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={progress === 1 ? width + 500 : plotLeft + (plotWidth + 100) * progress} height={height} />
          </clipPath>
          {normalizedSeries.map((_, i) => (
            <linearGradient key={i} id={`lineGrad-${clipId}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={normalizedSeries[i].color || resolvedColors[i % resolvedColors.length]} stopOpacity={0.2} />
              <stop offset="100%" stopColor={normalizedSeries[i].color || resolvedColors[i % resolvedColors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* GRID & Y-AXIS NICE LABELS */}
        {niceScale.map((val) => {
          const y = getY(val);
          return (
            <React.Fragment key={val}>
              <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={fs(1)} strokeDasharray={fs(8)} />
              <text x={plotLeft - fs(20)} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(22), fill: T.textMuted, fontWeight: 500, fontFamily: Theme.typography.fontFamily }}>{val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}</text>
            </React.Fragment>
          );
        })}

        {/* SÉRIES */}
        {normalizedSeries.map((s, sIndex) => {
          const color = s.color || resolvedColors[sIndex % resolvedColors.length];
          const linePoints = s.data.map((v, i) => `${getX(sIndex, i)},${getY(v)}`).join(" ");
          const areaPath = `M ${getX(sIndex, 0)},${getY(s.data[0])} ` + s.data.slice(1).map((v, i) => `L ${getX(sIndex, i + 1)},${getY(v)}`).join(" ") + ` L ${getX(sIndex, s.data.length - 1)},${plotTop + plotHeight} L ${getX(sIndex, 0)},${plotTop + plotHeight} Z`;

          const lastX = getX(sIndex, s.data.length - 1);

          return (
            <g key={sIndex}>
              <g clipPath={`url(#${clipId})`}>
                {showArea && <path d={areaPath} fill={`url(#lineGrad-${clipId}-${sIndex})`} />}
                <polyline points={linePoints} fill="none" stroke={color} strokeWidth={fs(isHighDensity ? 2 : 4)} strokeLinecap="round" strokeLinejoin="round" />
                {!isHighDensity && s.data.map((v: number, i: number) => (
                  <circle key={i} cx={getX(sIndex, i)} cy={getY(v)} r={fs(5)} fill={resolvedBg} stroke={color} strokeWidth={fs(2)} />
                ))}
              </g>
              
              {/* direct labeling no final */}
              <text 
                x={lastX + fs(15)} 
                y={labelYPositions[sIndex]} 
                dominantBaseline="middle" 
                style={{ 
                  fontSize: fs(24), 
                  fill: color, 
                  fontWeight: 800,
                  opacity: interpolate(
                    progress, 
                    [0.9, 1.0], 
                    [0, 1], 
                    { extrapolateLeft: 'clamp' }
                  )
                }}
              >
                {s.label}
              </text>
            </g>
          );
        })}

        {/* X AXIS */}
        {xAxisLabels.map((l, i) => {
          if (xAxisLabels.length > 20 && i % Math.ceil(xAxisLabels.length / 10) !== 0) return null;
          return (
            <text 
              key={i} 
              x={plotLeft + (i / (xAxisLabels.length - 1 || 1)) * plotWidth} 
              y={plotTop + plotHeight + fs(28)} 
              textAnchor="middle" 
              style={{ 
                fontSize: fs(Theme.typography.axisSize / 3), 
                fill: T.textMuted, 
                opacity: interpolate(frame, [20, 40], [0, 1]) // Mais cedo para visibilidade no preview
              }}
            >
              {l}
            </text>
          );
        })}
      </svg>

      {/* ANOTAÇÕES INTELIGENTES (SMART CALLOUTS) */}
      {annotations.map((ann, i) => {
        // Ignora anotações mal formatadas ou de séries inexistentes
        if (!ann || ann.index === undefined || !normalizedSeries[ann.seriesIndex || 0]) return null;
        
        const seriesData = normalizedSeries[ann.seriesIndex || 0].data;
        const validIndex = Math.min(Math.max(0, ann.index), seriesData.length - 1);
        
        const val = seriesData[validIndex];
        const x = plotLeft + (validIndex / (seriesData.length - 1 || 1)) * plotWidth;
        const calloutY = getY(val);

        return (
          <SmartCallout
            key={`ann-${i}`}
            x={x}
            y={calloutY}
            label={ann.label}
            value={ann.value !== undefined ? formatValue(ann.value, unit) : undefined}
            theme={theme}
            delay={140 + i * 15} // Anima no Ato 2 Final / Ato 3
            color={T.colors[0]}
          />
        );
      })}

      {/* REGRA 1020: HEADER DEVE VIR APÓS O SVG PARA Z-INDEX GARANTIDO */}
      <div style={{ position: "absolute", top: height * 0.05, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), pointerEvents: 'none' }}>
        {title && <div style={{ fontSize: fs(44), fontWeight: 800, color: resolvedText, letterSpacing: "-0.5px", textTransform: 'uppercase' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(24), color: T.textMuted, marginTop: fs(8), fontWeight: 500 }}>{subtitle}</div>}
      </div>

      {/* LEGEND - Escondida se houver muitos itens para evitar redundância com Direct Labeling */}
      {normalizedSeries.length > 1 && normalizedSeries.length <= 4 && (
        <div style={{ position: 'absolute', bottom: height * 0.04, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: fs(40), opacity: interpolate(frame, [150, 180], [0, 1]), pointerEvents: 'none' }}>
          {normalizedSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(12) }}>
              <div style={{ width: fs(24), height: fs(6), backgroundColor: s.color || resolvedColors[i % resolvedColors.length], borderRadius: fs(3) }} />
              <div style={{ fontSize: fs(20), color: resolvedText, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

    </AbsoluteFill>
  );
};
