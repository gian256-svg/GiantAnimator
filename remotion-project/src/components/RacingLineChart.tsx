import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
  Easing,
  Img
} from "remotion";
import { Theme, resolveTheme, parseSafeNumber, formatValue, getNiceScale } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";
import { HighlightCircle } from "./HighlightCircle";

const getCountryCode = (name: string) => {
  const map: Record<string, string> = {
    'venezuela': 've', 'argentina': 'ar', 'sudão': 'sd', 'sudan': 'sd', 
    'zimbábue': 'zw', 'zimbabwe': 'zw', 'turquia': 'tr', 'turkey': 'tr',
    'líbano': 'lb', 'lebanon': 'lb', 'irã': 'ir', 'iran': 'ir',
    'south sudan': 'ss', 'sudão do sul': 'ss', 'egito': 'eg', 'egypt': 'eg',
    'nigéria': 'ng', 'nigeria': 'ng', 'brasil': 'br', 'brazil': 'br',
    'usa': 'us', 'estados unidos': 'us', 'uk': 'gb', 'reino unido': 'gb',
    'china': 'cn', 'russia': 'ru', 'índia': 'in', 'india': 'in',
    'frança': 'fr', 'france': 'fr', 'alemanha': 'de', 'germany': 'de',
    'japão': 'jp', 'japan': 'jp', 'méxico': 'mx', 'mexico': 'mx'
  };
  return map[name.toLowerCase().trim()] || null;
}

export interface RacingLineChartProps {
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
  seriesColors?: string[];
  highlightSeries?: number;
  legendMode?: 'inline' | 'classic';
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light';
  showValueLabels?: boolean;
  unit?: string;
  annotations?: any[];
}

export const RacingLineChart: React.FC<RacingLineChartProps> = ({
  series: propSeries = [],
  labels = [],
  title = "Racing Line Chart",
  subtitle,
  theme = "dark",
  backgroundColor,
  textColor,
  colors,
  seriesColors,
  highlightSeries,
  legendMode = 'inline',
  bgStyle = 'none',
  backgroundType,
  showValueLabels = false,
  unit = "",
  annotations = [],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark', backgroundColor, backgroundType, seriesColors || colors, textColor);
  const resolvedBg = backgroundType ? T.background : (backgroundColor ?? T.background);

  const series = useMemo(() => {
    return Array.isArray(propSeries) ? propSeries.map(s => ({
      ...s,
      data: Array.isArray(s.data) ? s.data.map(v => parseSafeNumber(v, 0)) : []
    })) : [];
  }, [propSeries]);

  if (series.length === 0 || labels.length < 2) {
    return (
      <AbsoluteFill style={{ backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : T.background, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text, fontSize: Theme.typography.subtitle.size }}>Aguardando dados...</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K (D2 + Spacing)
  const margin = Theme.canvas.safeZoneX || 192;
  const titleHeight = 160;
  const paddingRight = legendMode === 'inline' ? 450 : margin; 
  const plotWidth = width - margin - paddingRight;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;
  const chartLeft = margin;

  // Race Progress
  // Start at frame 30, end near the end of the video
  const raceProgress = interpolate(frame, [30, durationInFrames - 30], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const currentVisibleIndexFloat = raceProgress * (labels.length - 1);
  const indexFloor = Math.floor(currentVisibleIndexFloat);
  const indexCeil = Math.min(labels.length - 1, Math.ceil(currentVisibleIndexFloat));
  const fraction = currentVisibleIndexFloat - indexFloor;

  // X Axis setup - Panning effect!
  const visibleRange = Math.max(1, currentVisibleIndexFloat);
  const getX = (index: number) => chartLeft + (index / visibleRange) * plotWidth;

  const currentX = indexCeil > indexFloor
     ? interpolate(fraction, [0, 1], [getX(indexFloor), getX(indexCeil)])
     : getX(indexFloor);

  // Dynamic Y Scale calculation
  const allValues = series.flatMap((s) => s.data);
  const yMin = Math.min(0, Math.min(...allValues)); // anchor bottom to 0 or negative min

  const maxAtIndices = useMemo(() => {
    return labels.map((_, i) => {
      let m = -Infinity;
      for (const s of series) {
        if(s.data[i] > m) m = s.data[i];
      }
      return Math.max(m, 10) * 1.1; // 10% padding
    });
  }, [series, labels]);

  const dynamicYMaxRaw = indexCeil > indexFloor
    ? interpolate(fraction, [0, 1], [maxAtIndices[indexFloor], maxAtIndices[indexCeil]])
    : maxAtIndices[indexFloor];

  const niceScale = getNiceScale(dynamicYMaxRaw, yMin, 5);
  const dynamicYMax = niceScale[niceScale.length - 1];

  const getY = (val: number) => {
    const v = parseSafeNumber(val, yMin);
    const range = Math.max(0.1, dynamicYMax - yMin);
    return chartTop + plotHeight - ((v - yMin) / range) * plotHeight;
  };

  // Collision Avoidance for inline labels tracking the head
  const inlineLabels = useMemo(() => {
    let basePositions = series.map((s, i) => {
      const currentVal = indexCeil > indexFloor 
         ? interpolate(fraction, [0, 1], [s.data[indexFloor], s.data[indexCeil]])
         : s.data[indexFloor];
      
      const code = getCountryCode(s.label);
      return {
        index: i,
        label: s.label,
        code,
        y: getY(currentVal),
        trueY: getY(currentVal),
        val: currentVal,
        color: s.color || T.colors[i % T.colors.length]
      };
    }).sort((a, b) => a.y - b.y);

    const minGap = 45; 
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
  }, [series, legendMode, fraction, indexFloor, indexCeil, dynamicYMax]); 

  // Helper de escala 4K
  const fs = (base: number) => Math.round(base * (width / 1920));

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
      {/* ZONA 1: Cabeçalho */}
      <div style={{
        position: 'absolute', top: height * 0.04, width: '100%', textAlign: 'center',
        padding: `0 ${fs(100)}px`,
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
        <defs>
          {inlineLabels.map((lbl, i) => (
            <clipPath id={`circleClip-${i}`} key={`clip-${i}`}>
              <circle cx={currentX} cy={lbl.trueY} r={16} />
            </clipPath>
          ))}
        </defs>

        {/* ZONA 2: Gráfico - Gridlines */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {niceScale.map((val, i) => {
            const y = chartTop + plotHeight - ((val - yMin) / (dynamicYMax - yMin || 0.0001)) * plotHeight;
            return (
              <React.Fragment key={i}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={2} />
                <text 
                  x={chartLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" 
                  style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontFamily: Theme.typography.fontFamily, fontWeight: 600 }}
                >
                  {formatValue(val)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Eixo X: Labels de Tempo */}
        <g opacity={interpolate(frame, [15, 30], [0, 1])}>
          {labels.map((lbl, i) => {
             // Reduz o número de labels visíveis se houver muitos
             if (labels.length > 20 && i % Math.ceil(labels.length / 10) !== 0 && i !== labels.length - 1) return null;
             const x = getX(i);
             const y = chartTop + plotHeight + 40;
             // Faz a label acender conforme a linha chega nela
             const opacity = interpolate(currentVisibleIndexFloat, [i - 1, i], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
             return (
               <text
                 key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                 style={{ fontSize: fs(18), fill: T.textMuted, fontFamily: Theme.typography.fontFamily, opacity }}
               >
                 {lbl}
               </text>
             );
          })}
        </g>

        {/* Linhas de Dados */}
        {series.map((s, sIndex) => {
          const isFocused = highlightSeries === undefined || sIndex === highlightSeries;
          const lineColor = s.color || T.colors[sIndex % T.colors.length];
          const strokeWidth = isFocused ? 4 : 2;
          const opacity = isFocused ? 1 : 0.25;

          let pathD = "";
          for (let i = 0; i <= indexFloor; i++) {
            const x = getX(i);
            const y = getY(s.data[i]);
            if (i === 0) pathD += `M ${x},${y}`;
            else pathD += ` L ${x},${y}`;
          }
          if (indexCeil > indexFloor && fraction > 0) {
            const val = interpolate(fraction, [0, 1], [s.data[indexFloor], s.data[indexCeil]]);
            const y = getY(val);
            pathD += ` L ${currentX},${y}`;
          }

          if (!pathD) return null;

          return (
            <g key={sIndex} opacity={opacity}>
              <path
                d={pathD} fill="none" stroke={lineColor} strokeWidth={strokeWidth}
                strokeLinejoin="round" strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Ícones Inline seguindo a cabeça da linha */}
        {inlineLabels.map((lbl, i) => {
          const opacity = interpolate(frame, [25, 40], [0, 1], { extrapolateLeft: 'clamp' });
          return (
            <g key={i} style={{ opacity, transition: 'y 0.1s linear' }}>
              <circle cx={currentX} cy={lbl.trueY} r={20} fill={lbl.color} stroke={resolvedBg} strokeWidth={4} />
              
              {lbl.code ? (
                <image 
                  href={`https://flagcdn.com/w80/${lbl.code}.png`} 
                  x={currentX - 16} y={lbl.trueY - 16} 
                  width={32} height={32} 
                  clipPath={`url(#circleClip-${i})`} 
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <text x={currentX} y={lbl.trueY} textAnchor="middle" dominantBaseline="central" style={{ fill: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: Theme.typography.fontFamily }}>
                  {lbl.label.charAt(0).toUpperCase()}
                </text>
              )}

              {showValueLabels && (
                 <text x={currentX + 28} y={lbl.trueY} dominantBaseline="central" style={{ fill: lbl.color, fontSize: Theme.typography.legendSize, fontWeight: 'bold', fontFamily: Theme.typography.fontFamily }}>
                   {formatValue(lbl.val, unit)}
                 </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Destaques (Highlights) Container Z-Index Superior */}
      {annotations.map((ann, i) => {
        if (!ann || ann.index === undefined || !series[ann.seriesIndex || 0]) return null;
        
        const sIdx = ann.seriesIndex || 0;
        const gIdx = Math.min(Math.max(0, ann.index), labels.length - 1);
        
        // A anotação só aparece quando a 'corrida' chega nela
        if (currentVisibleIndexFloat < gIdx) return null;

        const seriesData = series[sIdx].data;
        const val = seriesData[gIdx];
        
        const calloutX = getX(gIdx);
        const calloutY = getY(val);

        return (
          <HighlightCircle
            key={`ann-${i}`}
            x={calloutX}
            y={calloutY}
            delay={0} // Aparece imediatamente assim que alcançada
            color="#ff4d6d"
          />
        );
      })}

      {/* Legenda Clássica SEMPRE EXIBIDA para o Racing Chart */}
      <div style={{
        position: 'absolute', bottom: height * 0.08, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 40,
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
    </AbsoluteFill>
  );
};
