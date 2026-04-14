import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface ChordEntity {
  id: string;
  label: string;
}

export interface ChordFlow {
  source: string;
  target: string;
  value: number;
}

export interface ChordChartProps {
  entities: ChordEntity[];
  flows: ChordFlow[];
  title: string;
  subtitle?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const ChordChart: React.FC<ChordChartProps> = ({
  entities = [],
  flows = [],
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÁREA ÚTIL 4K (REGRA GLOBAL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = height * 0.42;
  const innerRadius = outerRadius * 0.94;
  const padAngle = 0.05;

  const entityTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    entities.forEach(e => totals[e.id] = 0);
    flows.forEach(f => {
      totals[f.source] += f.value;
      totals[f.target] += f.value;
    });
    return totals;
  }, [entities, flows]);

  const totalAll = Object.values(entityTotals).reduce((a, b) => a + b, 0) || 1;

  const arcs = useMemo(() => {
    let curAngle = 0;
    const totalAvail = Math.PI * 2 - (entities.length * padAngle);
    return entities.map(e => {
      const angle = (entityTotals[e.id] / totalAll) * totalAvail;
      const start = curAngle;
      const end = curAngle + angle;
      curAngle = end + padAngle;
      return { ...e, start, end };
    });
  }, [entities, entityTotals, totalAll]);

  const getPos = (r: number, a: number) => ({
    x: cx + Math.cos(a - Math.PI/2) * r,
    y: cy + Math.sin(a - Math.PI/2) * r
  });

  return (
    <AbsoluteFill style={{ backgroundColor: T.background }}>
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Flows (Ribbons) */}
        {flows.map((flow, i) => {
          const s = arcs.find(a => a.id === flow.source);
          const t = arcs.find(a => a.id === flow.target);
          if (!s || !t) return null;

          const prog = spring({ frame: frame - 60 - i * 3, fps, config: { damping: 15, stiffness: 60 } });
          const p1 = getPos(innerRadius, (s.start + s.end)/2);
          const p2 = getPos(innerRadius, (t.start + t.end)/2);

          return (
            <path
              key={i} d={`M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`}
              fill="none" stroke={T.colors[entities.indexOf(s) % T.colors.length]}
              strokeWidth={Math.max(6, (flow.value / totalAll) * 180)}
              strokeOpacity={0.3 * prog} strokeLinecap="round"
            />
          );
        })}

        {/* Entities Arcs */}
        {arcs.map((arc, i) => {
          const pop = spring({ frame: frame - 20 - i * 5, fps, config: { damping: 15, stiffness: 100 } });
          const mid = (arc.start + arc.end) / 2;
          const lXArr = arc.end - arc.start > Math.PI ? 1 : 0;
          const d = `M ${cx + Math.cos(arc.start - Math.PI/2) * innerRadius} ${cy + Math.sin(arc.start - Math.PI/2) * innerRadius}
                     A ${innerRadius} ${innerRadius} 0 ${lXArr} 1 ${cx + Math.cos(arc.end - Math.PI/2) * innerRadius} ${cy + Math.sin(arc.end - Math.PI/2) * innerRadius}
                     L ${cx + Math.cos(arc.end - Math.PI/2) * outerRadius} ${cy + Math.sin(arc.end - Math.PI/2) * outerRadius}
                     A ${outerRadius} ${outerRadius} 0 ${lXArr} 0 ${cx + Math.cos(arc.start - Math.PI/2) * outerRadius} ${cy + Math.sin(arc.start - Math.PI/2) * outerRadius}
                     Z`;
          const lp = getPos(outerRadius + 80, mid);
          return (
            <g key={arc.id}>
              <path d={d} fill={T.colors[i % T.colors.length]} opacity={pop} />
              {pop > 0.8 && (
                <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                  {arc.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
