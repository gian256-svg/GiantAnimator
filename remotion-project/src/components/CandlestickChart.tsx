import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface CandleData {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickChartProps {
  data: CandleData[];
  title?: string;
  subtitle?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data: propData = [],
  title,
  subtitle,
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');

  const data = useMemo(() => Array.isArray(propData) ? propData : [], [propData]);

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: T.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text, fontSize: Theme.typography.category.size }}>Aguardando dados...</p>
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

  const allValues = data.flatMap(d => [d.high, d.low]);
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const rangeY = (maxY - minY) || 1;
  const extentY = [minY, maxY];
  const screenRangeY = extentY[1] - extentY[0];

  const getY = (val: number) => chartTop + plotHeight - ((val - extentY[0]) / screenRangeY) * plotHeight;

  const barGap = 0.4;
  const categoryWidth = plotWidth / data.length;
  const candleWidth = categoryWidth * (1 - barGap);

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + "k";
    return val.toFixed(2);
  };

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        style={bgStyle} 
        baseColor={T.background} 
        accentColor={Theme.colors.semantic.positive} 
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
        {/* ZONA 2: GrÃ¡fico - Gridlines */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const val = extentY[0] + v * screenRangeY;
            const y = getY(val);
            return (
              <React.Fragment key={v}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={1} />
                <text x={chartLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>
                  {formatValue(val)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Candles */}
        {data.map((d, i) => {
          const barX = chartLeft + i * categoryWidth + (categoryWidth * barGap) / 2;
          const isBullish = d.close >= d.open;
          const color = isBullish ? Theme.colors.semantic.positive : Theme.colors.semantic.negative;

          const yHigh = getY(d.high);
          const yLow = getY(d.low);
          const yOpen = getY(d.open);
          const yClose = getY(d.close);
          
          // AnimaÃ§Ã£o Sequencial
          const startFrame = 20 + i * 4;
          const wickProgress = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 12, stiffness: 100 }
          });
          
          const bodyProgress = spring({
            frame: frame - startFrame - 8,
            fps,
            config: { damping: 14, stiffness: 100 }
          });

          const currentYHigh = interpolate(wickProgress, [0, 1], [(yHigh + yLow) / 2, yHigh]);
          const currentYLow = interpolate(wickProgress, [0, 1], [(yHigh + yLow) / 2, yLow]);

          const bodyTop = Math.min(yOpen, yClose);
          const bodyBottom = Math.max(yOpen, yClose);
          const rawHeight = bodyBottom - bodyTop;
          const currentHeight = interpolate(bodyProgress, [0, 1], [0, rawHeight]);
          const currentBodyY = bodyTop + (rawHeight - currentHeight) / 2;

          return (
            <g key={i}>
              {/* Wick */}
              <line 
                x1={barX + candleWidth / 2} y1={currentYHigh} x2={barX + candleWidth / 2} y2={currentYLow} 
                stroke={color} strokeWidth={3} opacity={wickProgress}
              />
              
              {/* Body */}
              <rect
                x={barX} y={currentBodyY} width={candleWidth} height={Math.max(currentHeight, 2)}
                fill={color} opacity={bodyProgress} rx={4}
              />

              {/* Label de Categoria */}
              {data.length < 20 && (
                <text
                  x={barX + candleWidth / 2} y={chartTop + plotHeight + 60}
                  textAnchor="middle"
                  style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
