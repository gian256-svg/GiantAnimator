import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: ChartData[];
  title: string;
  subtitle?: string;
  innerRadiusRatio?: number; 
}

const describeSlice = (cx: number, cy: number, ir: number, or: number, start: number, end: number) => {
  const polar = (r: number, a: number) => {
    const rad = ((a - 90) * Math.PI) / 180.0;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const sO = polar(or, end);
  const eO = polar(or, start);
  const sI = polar(ir, end);
  const eI = polar(ir, start);
  const largeArc = end - start <= 180 ? "0" : "1";
  return ["M", sI.x, sI.y, "L", sO.x, sO.y, "A", or, or, 0, largeArc, 0, eO.x, eO.y, "L", eI.x, eI.y, "A", ir, ir, 0, largeArc, 1, sI.x, sI.y, "Z"].join(" ");
};

export const DonutChart: React.FC<DonutChartProps> = ({
  data: propData = [],
  title,
  subtitle,
  innerRadiusRatio = 0.6,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const data = useMemo(() => (Array.isArray(propData) ? propData : []).filter(d => d.value > 0).slice(0, 10), [propData]);
  const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0) || 1, [data]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÁREA ÚTIL 4K (REGRA GLOBAL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const usableWidth = 3584; 
  const usableHeight = 1920; 
  const originX = 128;
  const originY = 160;

  const legendWidth = usableWidth * 0.25;
  const chartAreaWidth = usableWidth * 0.75;
  
  const outerRadius = Math.min(chartAreaWidth, usableHeight) * 0.42; // ~806.4px
  const innerRadius = outerRadius * innerRadiusRatio;
  const cx = originX + chartAreaWidth / 2;
  const cy = originY + usableHeight / 2;

  let curAngle = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const start = curAngle;
    curAngle += angle;
    return { ...d, start, angle, color: d.color || Theme.chartColors[i % Theme.chartColors.length] };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      {/* HEADER (ZONA 1) */}
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* CHART AREA */}
        <g>
          {slices.map((s, i) => {
            const pop = spring({ frame: frame - 15 - i * 4, fps, config: { damping: 15, stiffness: 100 } });
            const pD = describeSlice(cx, cy, innerRadius, outerRadius, s.start, s.start + s.angle * pop);
            return <path key={i} d={pD} fill={s.color} stroke={Theme.colors.background} strokeWidth={4} />;
          })}
          
          {innerRadiusRatio > 0 && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: outerRadius * 0.25, fontWeight: 900, fill: Theme.colors.text, fontFamily: Theme.typography.fontFamily }}>
              {total >= 1000000 ? (total / 1000000).toFixed(1) + "M" : total >= 1000 ? (total/1000).toFixed(1) + "k" : total}
            </text>
          )}
        </g>

        {/* LEGENDA (À DIREITA, 25%) */}
        <g transform={`translate(${originX + chartAreaWidth + 100}, ${cy - (slices.length * 80) / 2})`}>
          {slices.map((s, i) => {
            const entryPop = spring({ frame: frame - 40 - i * 4, fps, config: { damping: 12 } });
            return (
              <g key={i} transform={`translate(0, ${i * 90})`} opacity={entryPop}>
                <rect width={40} height={40} fill={s.color} rx={8} />
                <text x={60} y={30} style={{ fontSize: 36, fill: Theme.colors.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{s.label}</text>
                <text x={legendWidth - 100} y={30} textAnchor="end" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                  {((s.value / total) * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
