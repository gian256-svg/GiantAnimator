import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface RadarSeries {
  name: string;
  values: number[]; 
  color?: string;
}

export interface RadarChartProps {
  axes: string[];
  series: RadarSeries[];
  title: string;
  subtitle?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  axes = [],
  series = [],
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÁREA ÚTIL 4K (REGRA GLOBAL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const usableWidth = 3584; 
  const usableHeight = 1920; 
  const originX = 128;
  const originY = 160;

  const legendWidth = usableWidth * 0.25;
  const chartAreaWidth = usableWidth * 0.75;
  
  const radius = Math.min(chartAreaWidth, usableHeight) * 0.42;
  const cx = originX + chartAreaWidth / 2;
  const cy = originY + usableHeight / 2;

  if (axes.length === 0) return null;
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  const getPoint = (r: number, index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r * value,
      y: cy + Math.sin(angle) * r * value,
    };
  };

  const getPolygonPath = (values: number[], r: number) => {
    const pts = values.map((v, i) => getPoint(r, i, v));
    return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") + " Z";
  };

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* GRIDS CONCÊNTRICOS */}
        {[0.25, 0.5, 0.75, 1].map(v => (
          <path key={v} d={getPolygonPath(new Array(numAxes).fill(1), radius * v)} fill="none" stroke={Theme.colors.grid} strokeWidth={2} opacity={0.3} />
        ))}

        {/* EIXOS E LABELS */}
        {axes.map((ax, i) => {
          const pt = getPoint(radius, i, 1);
          const lp = getPoint(radius + 60, i, 1);
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke={Theme.colors.grid} strokeWidth={2} opacity={0.2} />
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                {ax}
              </text>
            </g>
          );
        })}

        {/* SÉRIES */}
        {series.map((s, si) => {
          const pop = spring({ frame: frame - 25 - si * 10, fps, config: { damping: 14, stiffness: 60 } });
          const color = s.color || Theme.chartColors[si % Theme.chartColors.length];
          const pathD = getPolygonPath(s.values.map(v => v * pop), radius);
          return (
            <g key={si} opacity={pop}>
              <path d={pathD} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={6} strokeLinejoin="round" />
              {s.values.map((v, ai) => {
                const pt = getPoint(radius, ai, v * pop);
                return <circle key={ai} cx={pt.x} cy={pt.y} r={12} fill={color} stroke={Theme.colors.background} strokeWidth={4} />;
              })}
            </g>
          );
        })}

        {/* LEGENDA (À DIREITA, 25%) */}
        <g transform={`translate(${originX + chartAreaWidth + 100}, ${cy - (series.length * 60) / 2})`}>
          {series.map((s, i) => {
            const entryPop = spring({ frame: frame - 40 - i * 4, fps, config: { damping: 12 } });
            return (
              <g key={i} transform={`translate(0, ${i * 80})`} opacity={entryPop}>
                <rect width={32} height={32} fill={s.color || Theme.chartColors[i % Theme.chartColors.length]} rx={6} />
                <text x={50} y={26} style={{ fontSize: 32, fill: Theme.colors.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{s.name}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
