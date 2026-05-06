import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme, getNiceScale } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface WaterfallPoint {
  label: string;
  value: number;
  valueStr?: string;
  isTotal?: boolean;
}

export interface WaterfallChartProps {
  data: WaterfallPoint[];
  title?: string;
  subtitle?: string;
  unit?: string;
  theme?: 'dark' | 'light';
  backgroundColor?: string;
  backgroundType?: 'dark' | 'light' | 'transparent';
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data: propData = [],
  title,
  subtitle,
  unit,
  theme = 'dark',
  backgroundType,
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  const data = useMemo(() => Array.isArray(propData) ? propData : [], [propData]);

  const waterfallData = useMemo(() => {
    let acc = 0;
    const items = data.map((d, i) => {
      const isActuallyTotal = d.isTotal || 
        d.label.toLowerCase() === "total" || 
        d.label.toLowerCase() === "end" || 
        (i === 0 && d.label.toLowerCase() === "start");

      if (isActuallyTotal) {
        acc = d.value;
        return {
          label: d.label,
          value: d.value,
          valueStr: d.valueStr,
          start: 0,
          end: d.value,
          type: "total",
        };
      } else {
        const start = acc;
        acc += d.value;
        return {
          label: d.label,
          value: d.value,
          valueStr: d.valueStr,
          start,
          end: acc,
          type: d.value >= 0 ? "positive" : "negative",
        };
      }
    });
    
    // Só adiciona a coluna "Total" sintética se a última coluna não for declarada como total
    if (items.length > 0 && items[items.length - 1].type !== "total") {
      items.push({
        label: "Total",
        value: acc,
        start: 0,
        end: acc,
        type: "total",
      });
    }
    return items;
  }, [data]);

  if (waterfallData.length <= 1) {
    return (
      <AbsoluteFill style={{ backgroundColor: backgroundType === 'transparent' ? 'rgba(0,0,0,0)' : T.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text, fontSize: Theme.typography.subtitle.size }}>Aguardando dados...</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K
  const margin = 128;
  const titleHeight = 160;
  const chartLeft = margin + 160; // Extra padding para proteger números grandes de violar a safe margin esquerda
  const plotWidth = width - chartLeft - margin;
  const plotHeight = height - margin * 2 - titleHeight - 160; // Mais espaço para a legenda (-160)
  const chartTop = margin + titleHeight;

  const allBounds = waterfallData.flatMap(d => [d.start, d.end, 0]);
  const minYRaw = Math.min(...allBounds);
  const maxYRaw = Math.max(...allBounds);
  
  const niceScale = getNiceScale(maxYRaw * 1.1, minYRaw, 5);
  const minY = niceScale[0];
  const maxY = niceScale[niceScale.length - 1];
  
  const rangeY = (maxY - minY) || 1;

  const getY = (val: number) => chartTop + plotHeight - ((val - minY) / rangeY) * plotHeight;

  const barGap = 0.3;
  const categoryWidth = plotWidth / waterfallData.length;
  const barWidth = categoryWidth * (1 - barGap);

  const formatValue = (val: number, displayUnit?: string) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    let numStr = absVal.toString();
    if (absVal >= 1000000) numStr = (absVal / 1000000).toFixed(1) + "M";
    else if (absVal >= 1000) numStr = (absVal / 1000).toFixed(1) + "k";
    
    if (displayUnit) {
      let prefix = "";
      let suffix = "";
      
      const pMatch = displayUnit.match(/^([^a-zA-Z0-9\s]+)/);
      if (pMatch) prefix = pMatch[1].trim();
      
      const sMatch = displayUnit.match(/([a-zA-Z%]+.*)$/);
      if (sMatch) {
        suffix = sMatch[1].trim();
        if (suffix.length > 1 && suffix !== "mln" && !suffix.startsWith("M")) {
          suffix = " " + suffix;
        } else if (suffix === "mln") {
           suffix = " mln";
        }
      }
      return `${sign}${prefix}${numStr}${suffix}`;
    }
    return sign + numStr;
  };

  const getColor = (type: string, index: number) => {
    if (type === "total") return T.colors[0];
    if (type === "positive") return "#10b981";
    if (type === "negative") return "#ef4444";
    return T.colors[index % T.colors.length];
  };

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily,
      backgroundColor: backgroundType === 'transparent' ? 'rgba(0,0,0,0)' : undefined
    }}>
      <DynamicBackground
        baseColor={T.background}
        accentColor={T.colors[0]}
        backgroundType={backgroundType}
      />
      {/* ZONA 1: CabeÃ§alho (Regra D2) */}
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ 
          fontSize: Theme.typography.title.size, 
          fontWeight: Theme.typography.title.weight, 
          color: Theme.typography.title.color,
          fontFamily: Theme.typography.fontFamily,
          marginBottom: 10
        }}>{title}</div>}
        {subtitle && <div style={{ 
          fontSize: Theme.typography.subtitle.size, 
          fontWeight: Theme.typography.subtitle.weight, 
          color: Theme.typography.subtitle.color,
          fontFamily: Theme.typography.fontFamily
        }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {waterfallData.map((d, i) => (
            <linearGradient key={i} id={`waterGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={getColor(d.type, i)} />
              <stop offset="100%" stopColor={getColor(d.type, i)} stopOpacity={0.85} />
            </linearGradient>
          ))}
        </defs>

        {/* ZONA 2: GrÃ¡fico - Gridlines */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {niceScale.map((val) => {
            const y = getY(val);
            const isZero = Math.abs(val) < 0.1;
            return (
              <React.Fragment key={val}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={isZero ? 2 : 1} opacity={isZero ? 1 : 0.6} />
                <text x={chartLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui?.axisText || T.textMuted, fontFamily: Theme.typography.fontFamily }}>
                  {formatValue(val, unit)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Barras Waterfall */}
        {waterfallData.map((d, i) => {
          const barX = chartLeft + i * categoryWidth + (categoryWidth * barGap) / 2;
          
          // AnimaÃ§Ã£o Sequencial (Stagger 8f)
          const progress = spring({
            frame: frame - 20 - (i * 8),
            fps,
            config: { damping: 14, stiffness: 60, overshootClamping: true },
          });

          const yStart = getY(d.start);
          const yEnd = getY(d.end);
          const currentYEnd = interpolate(progress, [0, 1], [yStart, yEnd]);
          const barY = Math.min(yStart, currentYEnd);
          const barH = Math.abs(yStart - currentYEnd);

          return (
            <g key={i}>
              {/* Conector */}
              {i < waterfallData.length - 1 && progress > 0.9 && (
                <line 
                  x1={barX + barWidth} y1={yEnd} x2={barX + categoryWidth + (categoryWidth * barGap) / 2} y2={yEnd} 
                  stroke={T.textMuted} strokeDasharray="6 6" opacity={0.5} 
                />
              )}
              
              <rect
                x={barX} y={barY} width={barWidth} height={Math.max(barH, 2)}
                fill={`url(#waterGrad-${i}-${instanceId})`}
                rx={6}
              />

              {/* Label de Valor (D8) */}
              {progress > 0.8 && (
                <text
                  x={barX + barWidth / 2}
                  y={d.type === "negative" ? barY + barH + 40 : barY - 20}
                  textAnchor="middle"
                  style={{ 
                    fontSize: Theme.typography.axis.size - 4, 
                    fill: T.text, 
                    fontWeight: 700,
                    fontFamily: Theme.typography.fontFamily,
                    opacity: interpolate(progress, [0.8, 1], [0, 1])
                  }}
                >
                  {d.valueStr || formatValue(d.value, unit)}
                </text>
              )}

              {/* Label de Categoria */}
              <text
                x={barX + barWidth / 2} y={chartTop + plotHeight + 60}
                textAnchor="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontFamily: Theme.typography.fontFamily }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* LEGEND */}
      <div style={{ position: 'absolute', bottom: height * 0.08, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 60, opacity: interpolate(frame, [40, 60], [0, 1]), pointerEvents: 'none' }}>
        {[
          { label: "Total", color: getColor("total", 0) },
          { label: "Aumento", color: getColor("positive", 0) },
          { label: "Queda", color: getColor("negative", 0) }
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 24, height: 24, borderRadius: '4px', backgroundColor: item.color, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
            <div style={{ fontSize: Theme.typography.axis.size, color: T.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{item.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
