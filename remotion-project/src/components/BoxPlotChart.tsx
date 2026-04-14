import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface BoxSet {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

export interface BoxPlotChartProps {
  data: BoxSet[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  data: propData = [],
  title,
  subtitle,
  backgroundColor ?? T.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  const data = useMemo(() => (Array.isArray(propData) ? propData : []), [propData]);

  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor ?? T.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text, fontSize: Theme.typography.category.size }}>Nenhum dado para exibir.</p>
      </AbsoluteFill>
    );
  }

  // Safe Zone 4K (D2)
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotWidth = width - margin * 2 - 100;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;
  const chartLeft = margin + 100;

  const allVals = data.flatMap(d => [d.min, d.max, d.q1, d.q3, d.median, ...(d.outliers || [])]);
  const minVal = Math.min(...allVals, 0) * 0.95;
  const maxVal = Math.max(...allVals) * 1.05;
  const rangeY = (maxVal - minVal) || 1;

  const getX = (i: number) => chartLeft + (i + 0.5) * (plotWidth / data.length);
  const getY = (val: number) => chartTop + plotHeight - ((val - minVal) / rangeY) * plotHeight;

  const boxWidth = 120; // 4K Scale

  return (
    <AbsoluteFill style={{ backgroundColor ?? T.background }}>
      {/* ZONA 1 — Cabeçalho */}
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 20], [0, 1])
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
          {data.map((_, i) => (
            <linearGradient key={i} id={`boxGrad-${i}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.colors[i % T.colors.length]} />
              <stop offset="100%" stopColor={T.colors[i % T.colors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* ZONA 2 — Gráfico */}
        <g opacity={interpolate(frame, [5, 25], [0, 0.6])}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const val = minVal + v * (maxVal - minVal);
            const y = getY(val);
            return (
              <React.Fragment key={v}>
                <line x1={chartLeft} y1={y} x2={chartLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={1} />
                <text x={chartLeft - 20} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>
                  {Math.round(val).toLocaleString()}
                </text>
              </React.Fragment>
            );
          })}
        </g>

        {data.map((d, i) => {
          const x = getX(i);
          const yMedian = getY(d.median);
          const yQ1 = getY(d.q1);
          const yQ3 = getY(d.q3);
          const yMin = getY(d.min);
          const yMax = getY(d.max);

          const whiskerPop = spring({ frame: frame - 25 - i * 5, fps, config: { damping: 15, stiffness: 100 } });
          const boxPop = spring({ frame: frame - 40 - i * 5, fps, config: { damping: 14, stiffness: 100 } });

          return (
            <g key={i}>
              <line x1={x} y1={yMedian} x2={x} y2={yMedian + (yMin - yMedian) * whiskerPop} stroke={Theme.colors.ui.axisLine} strokeWidth={3} />
              <line x1={x} y1={yMedian} x2={x} y2={yMedian + (yMax - yMedian) * whiskerPop} stroke={Theme.colors.ui.axisLine} strokeWidth={3} />
              <line x1={x - 30} y1={yMin} x2={x + 30} y2={yMin} stroke={Theme.colors.ui.axisLine} strokeWidth={3} opacity={whiskerPop} />
              <line x1={x - 30} y1={yMax} x2={x + 30} y2={yMax} stroke={Theme.colors.ui.axisLine} strokeWidth={3} opacity={whiskerPop} />

              <rect
                x={x - boxWidth / 2}
                y={yMedian + (yQ3 - yMedian) * boxPop}
                width={boxWidth}
                height={Math.max(Math.abs((yQ1 - yQ3) * boxPop), 2)}
                fill={`url(#boxGrad-${i}-${instanceId})`}
                rx={6}
                opacity={boxPop}
              />
              <line x1={x - boxWidth / 2} y1={yMedian} x2={x + boxWidth / 2} y2={yMedian} stroke={"#fff"} strokeWidth={4} opacity={boxPop} />

              {d.outliers?.map((out, oIdx) => {
                const yOut = getY(out);
                const outPop = spring({ frame: frame - 60 - i * 5 - oIdx * 3, fps, config: { damping: 10, stiffness: 100 } });
                return (
                   <circle key={oIdx} cx={x} cy={yOut} r={10 * outPop} fill={Theme.colors.semantic.negative} opacity={outPop} />
                );
              })}

              <text x={x} y={chartTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
