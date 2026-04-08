import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface WaterfallPoint {
  label: string;
  value: number;
}

export interface WaterfallChartProps {
  data: WaterfallPoint[];
  title?: string;
  subtitle?: string;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data: propData = [],
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  const data = useMemo(() => Array.isArray(propData) ? propData : [], [propData]);

  const waterfallData = useMemo(() => {
    let acc = 0;
    const items = data.map((d) => {
      const start = acc;
      acc += d.value;
      return {
        label: d.label,
        value: d.value,
        start,
        end: acc,
        type: d.value >= 0 ? "positive" : "negative",
      };
    });
    items.push({
      label: "Total",
      value: acc,
      start: 0,
      end: acc,
      type: "total",
    });
    return items;
  }, [data]);

  if (waterfallData.length <= 1) {
    return (
      <AbsoluteFill style={{ backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: Theme.colors.text, fontSize: Theme.typography.category.size }}>Aguardando dados...</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K
  const margin = Theme.spacing.padding;
  const titleHeight = Theme.spacing.titleHeight;
  const plotWidth = width - margin * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;
  const chartLeft = margin;

  const allBounds = waterfallData.flatMap(d => [d.start, d.end, 0]);
  const minY = Math.min(...allBounds);
  const maxY = Math.max(...allBounds);
  const rangeY = (maxY - minY) || 1;

  const getY = (val: number) => chartTop + plotHeight - ((val - minY) / rangeY) * plotHeight;

  const barGap = 0.3;
  const categoryWidth = plotWidth / waterfallData.length;
  const barWidth = categoryWidth * (1 - barGap);

  const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return sign + (absVal / 1000000).toFixed(1) + "M";
    if (absVal >= 1000) return sign + (absVal / 1000).toFixed(1) + "k";
    return val.toString();
  };

  const getColor = (type: string) => {
    if (type === "positive") return Theme.colors.semantic.positive;
    if (type === "negative") return Theme.colors.semantic.negative;
    return Theme.colors.categorical[0];
  };

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      {/* ZONA 1: Cabeçalho (Regra D2) */}
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

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {waterfallData.map((d, i) => (
            <linearGradient key={i} id={`waterGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={getColor(d.type)} />
              <stop offset="100%" stopColor={getColor(d.type)} stopOpacity={0.85} />
            </linearGradient>
          ))}
        </defs>

        {/* ZONA 2: Gráfico - Gridlines */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const val = minY + v * rangeY;
            const y = getY(val);
            const isZero = Math.abs(val) < 0.1;
            return (
              <React.Fragment key={v}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={Theme.colors.grid} strokeWidth={isZero ? 2 : 1} opacity={isZero ? 1 : 0.6} />
                <text x={chartLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>
                  {formatValue(val)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Barras Waterfall */}
        {waterfallData.map((d, i) => {
          const barX = chartLeft + i * categoryWidth + (categoryWidth * barGap) / 2;
          
          // Animação Sequencial (Stagger 8f)
          const progress = spring({
            frame: frame - 20 - (i * 8),
            fps,
            config: { damping: 14, stiffness: 60 },
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
                  stroke={Theme.colors.ui.axisText} strokeDasharray="6 6" opacity={0.5} 
                />
              )}
              
              <rect
                x={barX} y={barY} width={barWidth} height={Math.max(barH, 2)}
                fill={`url(#waterGrad-${i}-${instanceId})`}
                rx={Theme.spacing.barRadius}
              />

              {/* Label de Valor (D8) */}
              {progress > 0.8 && (
                <text
                  x={barX + barWidth / 2}
                  y={d.type === "negative" ? barY + barH + 40 : barY - 20}
                  textAnchor="middle"
                  style={{ 
                    fontSize: Theme.typography.value.size - 4, 
                    fill: Theme.typography.value.color, 
                    fontWeight: 700,
                    fontFamily: Theme.typography.fontFamily,
                    opacity: interpolate(progress, [0.8, 1], [0, 1])
                  }}
                >
                  {formatValue(d.value)}
                </text>
              )}

              {/* Label de Categoria */}
              <text
                x={barX + barWidth / 2} y={chartTop + plotHeight + 60}
                textAnchor="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
