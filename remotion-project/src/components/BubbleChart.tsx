import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface BubblePoint {
  x: number;
  y: number;
  size: number;
  group?: string;
  label?: string;
  color?: string;
}

export interface BubbleChartProps {
  data: BubblePoint[];
  title: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  showLabels?: boolean;
  showTrendLine?: boolean;
  backgroundColor?: string;
}

export const BubbleChart: React.FC<BubbleChartProps> = ({
  data: propData = [],
  title,
  subtitle,
  xLabel,
  yLabel,
  showLabels = true,
  showTrendLine = false,
  backgroundColor = Theme.colors.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const data = useMemo(() => (Array.isArray(propData) ? propData : []), [propData]);

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: Theme.colors.text, fontSize: Theme.typography.category.size }}>Aguardando dados...</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotWidth = width - margin * 2 - 200;
  const plotHeight = height - margin * 2 - titleHeight - 120;
  const chartTop = margin + titleHeight;
  const chartLeft = margin + 150;

  // Calc Ranges
  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x)) || 1;
  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y)) || 1;
  const maxSize = Math.max(...data.map(d => d.size)) || 1;

  const extentX = [minX - (maxX - minX) * 0.1, maxX + (maxX - minX) * 0.1];
  const extentY = [minY - (maxY - minY) * 0.1, maxY + (maxY - minY) * 0.1];

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + "k";
    return val.toFixed(1).replace(".0", "");
  };

  // Trend Line simple regression (X, Y)
  const trendLine = useMemo(() => {
    if (!showTrendLine || data.length < 2) return null;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    data.forEach(d => {
      sumX += d.x;
      sumY += d.y;
      sumXY += d.x * d.y;
      sumX2 += d.x * d.x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const x1 = extentX[0];
    const y1 = slope * x1 + intercept;
    const x2 = extentX[1];
    const y2 = slope * x2 + intercept;
    
    return { x1, y1, x2, y2 };
  }, [data, showTrendLine, extentX]);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* ZONA 1 — Cabeçalho */}
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
        {/* ZONA 2 — Gridlines */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.4])}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const yVal = extentY[0] + v * (extentY[1] - extentY[0]);
            const xVal = extentX[0] + v * (extentX[1] - extentX[0]);
            const yPos = chartTop + plotHeight - v * plotHeight;
            const xPos = chartLeft + v * plotWidth;
            return (
              <React.Fragment key={v}>
                <line x1={chartLeft} y1={yPos} x2={chartLeft + plotWidth} y2={yPos} stroke={Theme.colors.grid} strokeWidth={1} />
                <line x1={xPos} y1={chartTop} x2={xPos} y2={chartTop + plotHeight} stroke={Theme.colors.grid} strokeWidth={1} />
                <text x={chartLeft - 20} y={yPos} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{formatValue(yVal)}</text>
                <text x={xPos} y={chartTop + plotHeight + 50} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{formatValue(xVal)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Eixo Labels */}
        {xLabel && <text x={chartLeft + plotWidth / 2} y={chartTop + plotHeight + 120} textAnchor="middle" style={{ fontSize: Theme.typography.axisTitle.size, fill: Theme.typography.axisTitle.color, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{xLabel}</text>}
        {yLabel && <text transform={`rotate(-90, ${margin + 40}, ${chartTop + plotHeight / 2})`} x={margin + 40} y={chartTop + plotHeight / 2} textAnchor="middle" style={{ fontSize: Theme.typography.axisTitle.size, fill: Theme.typography.axisTitle.color, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>{yLabel}</text>}

        {/* Trend Line */}
        {trendLine && (
          <line
            x1={chartLeft + ((trendLine.x1 - extentX[0]) / (extentX[1] - extentX[0])) * plotWidth}
            y1={chartTop + plotHeight - ((trendLine.y1 - extentY[0]) / (extentY[1] - extentY[0])) * plotHeight}
            x2={chartLeft + ((trendLine.x2 - extentX[0]) / (extentX[1] - extentX[0])) * plotWidth}
            y2={chartTop + plotHeight - ((trendLine.y2 - extentY[0]) / (extentY[1] - extentY[0])) * plotHeight}
            stroke={Theme.colors.accent}
            strokeWidth={4}
            strokeDasharray="12 12"
            opacity={interpolate(frame, [100, 130], [0, 0.6], { extrapolateLeft: 'clamp' })}
          />
        )}

        {/* Bolhas */}
        {data.map((d, i) => {
          const cx = chartLeft + ((d.x - extentX[0]) / (extentX[1] - extentX[0])) * plotWidth;
          const cy = chartTop + plotHeight - ((d.y - extentY[0]) / (extentY[1] - extentY[0])) * plotHeight;
          const maxRadius = 120;
          const radius = Math.sqrt(Math.max(0, d.size) / maxSize) * maxRadius;

          const pop = spring({
            frame: frame - 20 - i * 3,
            fps,
            config: { damping: 12, stiffness: 100, mass: 0.8 }
          });
          
          const color = d.color || Theme.chartColors[i % Theme.chartColors.length];

          return (
            <g key={i}>
              <circle
                cx={cx} cy={cy} r={radius * pop}
                fill={color} fillOpacity={0.6}
                stroke={color} strokeWidth={3} strokeOpacity={0.8}
              />
              {showLabels && d.label && radius * pop > 40 && (
                <text
                  x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: 24, fill: "#fff", fontWeight: 700, fontFamily: Theme.typography.fontFamily, opacity: interpolate(pop, [0.9, 1], [0, 1]) }}
                >
                  {d.label}
                </text>
              )}
              {showLabels && d.label && radius * pop <= 40 && pop > 0.8 && (
                <text
                  x={cx} y={cy - radius - 15} textAnchor="middle"
                  style={{ fontSize: 20, fill: Theme.colors.text, fontWeight: 500, fontFamily: Theme.typography.fontFamily }}
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
