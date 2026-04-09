import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export interface ScatterPlotProps {
  title: string;
  subtitle?: string;
  series: {
    label: string;
    data: { x: number; y: number; r?: number }[];
    color?: string;
  }[];
  xLabel?: string;
  yLabel?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  title,
  subtitle,
  series = [],
  xLabel = "Eixo X",
  yLabel = "Eixo Y",
  backgroundColor = "#111827",
  textColor = "#FFFFFF",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Layout 4K - Margens ampliadas para legibilidade
  const MARGIN = { top: 160, right: 300, bottom: 200, left: 240 };
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const allPoints = useMemo(() => series.flatMap((s) => s.data), [series]);

  if (allPoints.length === 0) return null;

  const xMin = Math.min(...allPoints.map((p) => p.x));
  const xMax = Math.max(...allPoints.map((p) => p.x));
  const yMin = Math.min(...allPoints.map((p) => p.y));
  const yMax = Math.max(...allPoints.map((p) => p.y));

  const xRange = (xMax - xMin) || 1;
  const yRange = (yMax - yMin) || 1;

  // Helpers de Escala
  const toPixelX = (x: number) => MARGIN.left + ((x - xMin) / xRange) * plotWidth;
  const toPixelY = (y: number) => MARGIN.top + (1 - (y - yMin) / yRange) * plotHeight;

  return (
    <AbsoluteFill style={{ backgroundColor, color: textColor, fontFamily: "sans-serif" }}>
      {/* 1. TÍTULO */}
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
        fontSize: 84, fontWeight: 800, opacity: interpolate(frame, [0, 20], [0, 1])
      }}>
        {title}
      </div>
      {subtitle && <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontSize: 36, opacity: 0.7 }}>{subtitle}</div>}

      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {/* 2 & 3. GRID & AXIS TICKS */}
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
            const yPos = MARGIN.top + (1 - v) * plotHeight;
            const xPos = MARGIN.left + v * plotWidth;
            const yVal = yMin + v * yRange;
            const xVal = xMin + v * xRange;

            return (
              <React.Fragment key={i}>
                {/* Grid Horiz */}
                <line x1={MARGIN.left} y1={yPos} x2={MARGIN.left + plotWidth} y2={yPos} stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
                <text x={MARGIN.left - 40} y={yPos} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 36, fill: textColor, opacity: 0.7 }}>
                  {yVal.toFixed(1).replace(".0", "")}
                </text>

                {/* Grid Vert */}
                <line x1={xPos} y1={MARGIN.top} x2={xPos} y2={MARGIN.top + plotHeight} stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
                <text x={xPos} y={MARGIN.top + plotHeight + 60} textAnchor="middle" style={{ fontSize: 36, fill: textColor, opacity: 0.7 }}>
                  {xVal.toFixed(1).replace(".0", "")}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {/* 7 & 8. AXIS LABELS */}
        <text x={MARGIN.left + plotWidth / 2} y={MARGIN.top + plotHeight + 160} textAnchor="middle" style={{ fontSize: 48, fontWeight: 600, fill: textColor }}>
          {xLabel}
        </text>
        <text
          x={80} y={MARGIN.top + plotHeight / 2} textAnchor="middle"
          transform={`rotate(-90, 80, ${MARGIN.top + plotHeight / 2})`}
          style={{ fontSize: 48, fontWeight: 600, fill: textColor }}
        >
          {yLabel}
        </text>

        {/* 9. DATA POINTS */}
        {series.map((s, sIdx) => {
          const color = s.color || "#3B82F6";
          return (
            <g key={sIdx}>
              {s.data.map((p, pIdx) => {
                const delay = 30 + (sIdx * 10) + (pIdx * 3);
                const pop = spring({
                  frame: frame - delay,
                  fps,
                  config: { damping: 80, stiffness: 200, overshoot_clamp: true }
                });
                if (pop <= 0) return null;

                return (
                  <circle
                    key={pIdx}
                    cx={toPixelX(p.x)}
                    cy={toPixelY(p.y)}
                    r={20 * pop}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="#FFFFFF"
                    strokeWidth={4}
                  />
                );
              })}
            </g>
          );
        })}

        {/* 10. LEGENDA (Fixed Size) */}
        <g transform={`translate(${width - MARGIN.right + 40}, ${MARGIN.top})`}>
          {series.map((s, i) => (
            <g key={i} transform={`translate(0, ${i * 60})`}>
              <rect width={40} height={24} fill={s.color || "#3B82F6"} rx={4} />
              <text x={55} y={20} style={{ fontSize: 32, fill: textColor, fontWeight: 500 }}>{s.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
