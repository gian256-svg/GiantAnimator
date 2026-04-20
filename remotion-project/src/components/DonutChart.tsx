import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

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
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
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
  theme = 'dark',
  backgroundColor,
  colors,
  textColor,
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme);
  const instanceId = useId().replace(/:/g, "");

  const resolvedBg     = backgroundColor ?? T.background;
  const resolvedText   = textColor       ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Helper: lighten a color for gradient highlight
  const lighten = (hex: string, amount: number): string => {
    if (!hex.startsWith('#')) return hex;
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((n >> 8)  & 0xff) + Math.round(255 * amount));
    const b = Math.min(255,  (n        & 0xff) + Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  };

  const data = useMemo(() => (Array.isArray(propData) ? propData : []).filter(d => d.value > 0).slice(0, 10), [propData]);
  const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0) || 1, [data]);

  const legendWidth = 800;
  const chartAreaWidth = width - legendWidth;
  const cx = Theme.canvas.safeZoneX + chartAreaWidth / 2;
  const cy = height / 2;
  const outerRadius = height * 0.28; // Reduzido de 0.35 para 0.28 (Anti-ColisÃ£o 4K)
  const innerRadius = outerRadius * innerRadiusRatio;

  let curAngle = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const start = curAngle;
    curAngle += angle;
    return { ...d, start, angle, color: d.color || resolvedColors[i % resolvedColors.length] };
  });

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={resolvedColors[0]} 
      />
      {/* HEADER */}
      <div style={{ position: 'absolute', top: Theme.canvas.safeZoneTop, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: resolvedText, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: T.textMuted, fontFamily: Theme.typography.fontFamily, marginTop: 24 }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {/* Radial gradient per slice: base color inner â†’ lighter outer (gloss effect) */}
          {slices.map((s, i) => (
            <radialGradient
              key={i}
              id={`donutGrad-${i}-${instanceId}`}
              cx="50%" cy="40%" r="70%"
              fx="40%" fy="30%"
            >
              <stop offset="0%"   stopColor={lighten(s.color, 0.22)} />
              <stop offset="55%"  stopColor={s.color} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.80} />
            </radialGradient>
          ))}
        </defs>

        {/* CHART AREA */}
        <g>
          {slices.map((s, i) => {
            const pop = spring({
              frame: frame - 30 - i * 3,
              fps,
              config: { damping: 80, stiffness: 200, overshootClamping: true }
            });
            if (pop <= 0) return null;

            const pD = describeSlice(cx, cy, innerRadius, outerRadius, s.start, s.start + s.angle * pop);
            return <path key={i} d={pD} fill={`url(#donutGrad-${i}-${instanceId})`} stroke={resolvedBg} strokeWidth={4} />;
          })}
          
          {innerRadiusRatio > 0 && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 100, fontWeight: 900, fill: resolvedText, fontFamily: Theme.typography.fontFamily }}>
              {total >= 1000000 ? (total / 1000000).toFixed(1) + "M" : total >= 1000 ? (total/1000).toFixed(1) + "k" : total}
            </text>
          )}
        </g>

        {/* LEGENDA */}
        <g transform={`translate(${width - legendWidth + 100}, ${cy - (data.length * 80) / 2})`}>
          {data.map((s, i) => {
            const entryPop = spring({
              frame: frame - 60 - i * 3,
              fps,
              config: { damping: 80, stiffness: 200, overshootClamping: true }
            });
            const sliceColor = s.color || resolvedColors[i % resolvedColors.length];
            return (
              <g key={i} transform={`translate(0, ${i * 90})`} opacity={entryPop}>
                <rect width={50} height={50} fill={sliceColor} rx={12} />
                <text x={80} y={38} style={{ fontSize: 44, fill: resolvedText, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{s.label}</text>
                <text x={legendWidth - 250} y={38} textAnchor="end" style={{ fontSize: 40, fill: T.textMuted, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
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
