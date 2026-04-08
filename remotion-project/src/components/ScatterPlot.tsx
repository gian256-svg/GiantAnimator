import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill
} from "remotion";
import { Theme } from "../theme";

export interface ScatterPoint {
  x: number;
  y: number;
  size?: number;
  group?: string;
  label?: string;
}

export interface ScatterPlotProps {
  data: ScatterPoint[];
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  sizeKey?: boolean;
  groupKey?: boolean;
  seriesColors?: string[];
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data: propData = [],
  title,
  subtitle,
  xLabel,
  yLabel,
  sizeKey = false,
  groupKey = false,
  seriesColors = Theme.colors.categorical,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const data = useMemo(() => Array.isArray(propData) ? propData : [], [propData]);

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: Theme.colors.text, fontSize: Theme.typography.category.size }}>Aguardando dados...</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K (D2 + Spacing)
  const margin = Theme.spacing.padding; // 128px
  const titleHeight = Theme.spacing.titleHeight; // 160px
  const plotWidth = width - margin * 2 - 100; // Recuo para legendas se houver
  const plotHeight = height - margin * 2 - titleHeight - 120; // Espaço para labels X
  const chartTop = margin + titleHeight;
  const chartLeft = margin + 100; // Recuo para labels Y

  // Range de Dados com respiro
  const rawMinX = Math.min(...data.map(d => d.x));
  const rawMaxX = Math.max(...data.map(d => d.x));
  const rawMinY = Math.min(...data.map(d => d.y));
  const rawMaxY = Math.max(...data.map(d => d.y));
  
  const rangeX = (rawMaxX - rawMinX) || 1;
  const rangeY = (rawMaxY - rawMinY) || 1;
  const extentX = [rawMinX - rangeX * 0.1, rawMaxX + rangeX * 0.1];
  const extentY = [rawMinY - rangeY * 0.1, rawMaxY + rangeY * 0.1];

  const minSizeValue = Math.min(...data.map(d => d.size || 0));
  const maxSizeValue = Math.max(...data.map(d => d.size || 0)) || 1;

  const groups = useMemo(() => Array.from(new Set(data.filter(d => !!d.group).map(d => d.group!))), [data]);
  const getGroupColor = (group?: string) => {
    if (!groupKey || groups.length === 0) return seriesColors[0];
    const idx = groups.indexOf(group || "");
    return seriesColors[idx % seriesColors.length];
  };

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + "k";
    return val.toFixed(1).replace(".0", "");
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
        {/* ZONA 2: Gráfico - Gridlines (Regra D3) */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const val = extentY[0] + v * (extentY[1] - extentY[0]);
            const y = chartTop + plotHeight - v * plotHeight;
            return (
              <React.Fragment key={`y-${v}`}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={Theme.colors.grid} strokeWidth={1} />
                <text x={chartLeft - 30} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>
                  {formatValue(val)}
                </text>
              </React.Fragment>
            );
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const val = extentX[0] + v * (extentX[1] - extentX[0]);
            const x = chartLeft + v * plotWidth;
            return (
              <React.Fragment key={`x-${v}`}>
                <line x1={x} y1={chartTop} x2={x} y2={chartTop + plotHeight} stroke={Theme.colors.grid} strokeWidth={1} opacity={0.3} />
                <text x={x} y={chartTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>
                  {formatValue(val)}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* Eixo Titulos */}
        {xLabel && <text x={chartLeft + plotWidth / 2} y={chartTop + plotHeight + 120} textAnchor="middle" style={{ fontSize: Theme.typography.axisTitle.size, fill: Theme.typography.axisTitle.color, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{xLabel}</text>}
        {yLabel && <text transform={`rotate(-90, ${margin}, ${chartTop + plotHeight / 2})`} x={margin} y={chartTop + plotHeight / 2} textAnchor="middle" style={{ fontSize: Theme.typography.axisTitle.size, fill: Theme.typography.axisTitle.color, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{yLabel}</text>}

        {/* Pontos */}
        {data.map((d, i) => {
          const xRatio = (d.x - extentX[0]) / (extentX[1] - extentX[0]);
          const yRatio = (d.y - extentY[0]) / (extentY[1] - extentY[0]);
          const cx = chartLeft + xRatio * plotWidth;
          const cy = chartTop + plotHeight - yRatio * plotHeight;

          const pop = spring({
            frame: frame - 20 - (i * 1.5), // Stagger rápido para scatter
            fps,
            config: { damping: 10, stiffness: 100 },
          });

          const baseRadius = 15; // 4K default
          const targetRadius = sizeKey 
            ? interpolate(d.size || 0, [minSizeValue, maxSizeValue], [10, 80]) 
            : baseRadius;

          return (
            <g key={i}>
              <circle
                cx={cx} cy={cy} r={targetRadius * pop}
                fill={getGroupColor(d.group)}
                fillOpacity={0.7}
                stroke={getGroupColor(d.group)}
                strokeWidth={2}
              />
              {d.label && pop > 0.8 && (
                <text 
                  x={cx} y={cy - targetRadius - 15} textAnchor="middle" 
                  style={{ fontSize: 24, fill: Theme.colors.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily, opacity: pop }}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Legenda Lateral */}
        {groupKey && groups.length > 0 && (
          <g transform={`translate(${chartLeft + plotWidth + 40}, ${chartTop})`}>
            {groups.map((g, i) => (
              <g key={g} transform={`translate(0, ${i * 60})`}>
                <circle cx={15} cy={15} r={10} fill={getGroupColor(g)} />
                <text x={40} y={22} style={{ fontSize: Theme.typography.legend.size, fill: Theme.typography.legend.color, fontFamily: Theme.typography.fontFamily }}>{g}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
