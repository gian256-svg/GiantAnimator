import React, { useMemo } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface RadarSeries {
  label: string;
  values: number[]; 
  color?: string;
}

export interface RadarChartProps {
  axes: string[];
  series: RadarSeries[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  axes = [],
  series = [],
  title,
  subtitle,
  backgroundColor = "#111827",
  textColor = "#FFFFFF",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');

  // Layout 4K
  const margin = 200;
  const cx = width / 2 - 200; // Recuado para dar espaço à legenda
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  if (axes.length === 0) return null;
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  const getPoint = (r: number, index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    // Normalização: assumindo inputs de 0 a 100 se houver valores > 1, ou 0 a 1 caso contrário
    // Para o gauntlet, os valores são 0-100 ou 0-10. Vamos detectar o max.
    const maxValInSeries = Math.max(...series.flatMap(s => s.values), 1);
    const normalize = maxValInSeries > 1.1 ? 100 : 1; 
    // No gauntlet T08, os valores são 80, 70 etc -> normalize 100.
    const actualNormalize = maxValInSeries > 10 ? 100 : (maxValInSeries > 1 ? 10 : 1);
    
    const val = value / actualNormalize;
    return {
      x: cx + Math.cos(angle) * r * val,
      y: cy + Math.sin(angle) * r * val,
    };
  };

  const getPolygonPath = (r: number, values: number[], scale: number = 1) => {
    const pts = values.map((v, i) => getPoint(r, i, v * scale));
    return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") + " Z";
  };

  return (
    <AbsoluteFill style={{ backgroundColor, color: textColor, fontFamily: "sans-serif" }}>
      {/* TÍTULO */}
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
        fontSize: 84, fontWeight: 800, opacity: interpolate(frame, [0, 20], [0, 1])
      }}>
        {title}
      </div>

      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {/* GRIDS POLIGONAIS */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
          <path
            key={i}
            d={getPolygonPath(radius * v, new Array(numAxes).fill(100))} 
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={3}
          />
        ))}

        {/* EIXOS RADIAIS */}
        {axes.map((ax, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = cx + Math.cos(angle) * radius;
          const y2 = cy + Math.sin(angle) * radius;
          const lx = cx + Math.cos(angle) * (radius + 60);
          const ly = cy + Math.sin(angle) * (radius + 60);

          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
              <text
                x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 36, fill: textColor, fontWeight: 600, opacity: 0.8 }}
              >
                {ax}
              </text>
            </g>
          );
        })}

        {/* SÉRIES RADAR */}
        {series.map((s, si) => {
          const progress = spring({
            frame: frame - 30 - (si * 15),
            fps,
            config: { damping: 80, stiffness: 200, overshoot_clamp: true }
          });
          if (progress <= 0) return null;

          const color = s.color || T.colors[si % T.colors.length];
          const pathD = getPolygonPath(radius, s.values, progress);

          return (
            <g key={si}>
              <path
                d={pathD}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeWidth={8}
                strokeLinejoin="round"
              />
              {/* PONTOS NAS QUINAS */}
              {s.values.map((v, valIdx) => {
                const pt = getPoint(radius, valIdx, v * progress);
                return (
                  <circle
                    key={valIdx}
                    cx={pt.x}
                    cy={pt.y}
                    r={12}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  />
                );
              })}
            </g>
          );
        })}

        {/* LEGENDA (Canto Direito) */}
        <g transform={`translate(${width - 450}, ${cy - (series.length * 60) / 2})`}>
          {series.map((s, i) => (
            <g key={i} transform={`translate(0, ${i * 80})`}>
              <rect width={40} height={24} fill={s.color || T.colors[i % T.colors.length]} rx={4} />
              <text x={60} y={22} style={{ fontSize: 36, fill: textColor, fontWeight: 500 }}>{s.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
