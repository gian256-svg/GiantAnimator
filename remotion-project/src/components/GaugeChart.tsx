import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface GaugeChartProps {
  value: number;
  title: string;
  subtitle?: string;
  label?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value: propValue = 0,
  title,
  subtitle,
  label = "Taxa de Desempenho",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÁREA ÚTIL 4K (REGRA GLOBAL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const usableHeight = 1920; 
  const usableWidth = 3584;
  const originX = 128;
  const originY = 160;

  const cx = originX + usableWidth / 2;
  const cy = originY + usableHeight * 0.75; // Ponto central baixo para o arco
  const radius = Math.min(usableWidth, usableHeight * 1.5) * 0.42;
  const strokeWidth = radius * 0.25;

  const animatedValue = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 60 } });
  const finalValue = Math.min(100, Math.max(0, propValue)) * animatedValue;
  const rotation = interpolate(finalValue, [0, 100], [-90, 90]);

  const pToC = (r: number, a: number) => {
    const rad = ((a - 90) * Math.PI) / 180.0;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const getPath = (r: number, start: number, end: number) => {
    const s = pToC(r, start);
    const e = pToC(r, end);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Background Arc */}
        <path d={getPath(radius, -90, 90)} fill="none" stroke={Theme.colors.grid} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.2} />
        
        {/* Color Bands */}
        <path d={getPath(radius, -90, -30)} fill="none" stroke={Theme.colors.semantic.positive} strokeWidth={strokeWidth} opacity={0.3} />
        <path d={getPath(radius, -30, 30)} fill="none" stroke={Theme.colors.semantic.highlight} strokeWidth={strokeWidth} opacity={0.3} />
        <path d={getPath(radius, 30, 90)} fill="none" stroke={Theme.colors.semantic.negative} strokeWidth={strokeWidth} opacity={0.3} />

        {/* Value Arc */}
        {finalValue > 0 && (
          <path d={getPath(radius, -90, rotation)} fill="none" stroke={Theme.colors.accent} strokeWidth={strokeWidth} strokeLinecap="round" />
        )}

        {/* Needle */}
        <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
          <path d={`M ${cx - 25} ${cy} L ${cx + 25} ${cy} L ${cx} ${cy - radius - 50} Z`} fill={Theme.colors.text} />
          <circle cx={cx} cy={cy} r={40} fill={Theme.colors.text} stroke={Theme.colors.background} strokeWidth={10} />
        </g>

        {/* Text Central */}
        <text x={cx} y={cy + 150} textAnchor="middle" style={{ fontSize: radius * 0.4, fontWeight: 900, fill: Theme.colors.text, fontFamily: Theme.typography.fontFamily }}>
          {Math.round(finalValue)}%
        </text>
        <text x={cx} y={cy + 250} textAnchor="middle" style={{ fontSize: 56, fill: Theme.colors.textSecondary, fontWeight: 500, fontFamily: Theme.typography.fontFamily }}>
          {label}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
