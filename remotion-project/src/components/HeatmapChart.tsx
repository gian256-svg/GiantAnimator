import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolateColors,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface HeatmapChartProps {
  data: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
  subtitle?: string;
  seriesColors?: string[]; // Min, Max colors
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data = [],
  xLabels = [],
  yLabels = [],
  title,
  subtitle,
  seriesColors = [Theme.colors.ui.gridline, Theme.colors.categorical[0]],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const minMax = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 1 };
    const vals = data.map(d => d.value);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data]);

  // Safe Zone 4K
  const margin = Theme.spacing.padding;
  const titleHeight = Theme.spacing.titleHeight;
  const paddingLeft = 300; // Espaço para labels Y
  const paddingTop = margin + titleHeight + 80; // Espaço para labels X
  
  const plotWidth = width - paddingLeft - margin;
  const plotHeight = height - paddingTop - margin;

  const cellSizeX = plotWidth / (xLabels.length || 1);
  const cellSizeY = plotHeight / (yLabels.length || 1);
  const cellGap = 6;

  const getColor = (val: number) => {
    const norm = (val - minMax.min) / (minMax.max - minMax.min || 1);
    return interpolateColors(norm, [0, 1], [seriesColors[0], seriesColors[1]]);
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
        {/* Labels Y (Linhas) */}
        {yLabels.map((lbl, i) => (
          <text
            key={`y-${lbl}`}
            x={paddingLeft - 30}
            y={paddingTop + i * cellSizeY + cellSizeY / 2}
            textAnchor="end"
            dominantBaseline="middle"
            style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily, opacity: interpolate(frame, [10, 25], [0, 1]) }}
          >
            {lbl}
          </text>
        ))}

        {/* Labels X (Colunas) */}
        {xLabels.map((lbl, i) => (
          <text
            key={`x-${lbl}`}
            x={paddingLeft + i * cellSizeX + cellSizeX / 2}
            y={paddingTop - 30}
            textAnchor="middle"
            style={{ fontSize: Theme.typography.axis.size - 4, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily, opacity: interpolate(frame, [15, 30], [0, 1]) }}
          >
            {lbl}
          </text>
        ))}

        {/* Grid de Células */}
        {yLabels.map((yLbl, rowIdx) => (
          xLabels.map((xLbl, colIdx) => {
            const cell = data.find(d => d.x === xLbl && d.y === yLbl);
            if (!cell) return null;

            const cellIdx = rowIdx * xLabels.length + colIdx;
            const startFrame = 20 + cellIdx * 0.5; // Stagger ultra rápido
            const pop = spring({
              frame: frame - startFrame,
              fps,
              config: { damping: 15, stiffness: 100 }
            });

            if (pop <= 0) return null;

            const x = paddingLeft + colIdx * cellSizeX;
            const y = paddingTop + rowIdx * cellSizeY;
            const color = getColor(cell.value);

            return (
              <rect
                key={`${xLbl}-${yLbl}`}
                x={x + cellGap / 2}
                y={y + cellGap / 2}
                width={(cellSizeX - cellGap) * pop}
                height={(cellSizeY - cellGap) * pop}
                fill={color}
                rx={8}
                style={{ opacity: pop }}
              />
            );
          })
        ))}
      </svg>
    </AbsoluteFill>
  );
};
