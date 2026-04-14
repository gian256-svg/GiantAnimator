import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface GaugeChartProps {
  value: number;
  title: string;
  subtitle?: string;
  label?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value: propValue = 0,
  title,
  subtitle,
  label = "Taxa de Desempenho",
  theme = 'dark',
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme);
  const instanceId = useId().replace(/:/g, "");

  const resolvedBg   = backgroundColor ?? T.background;
  const resolvedText = textColor       ?? T.text;

  const cx = width / 2;
  const cy = height * 0.75;
  const radius = Math.min(width, height * 1.5) * 0.42;
  const strokeWidth = radius * 0.22;

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

  // Determina cor do ponteiro baseada no valor (UI/UX: Red→Yellow→Green)
  const needleColor =
    finalValue < 33 ? '#ef4444'   // vermelho — baixo desempenho
    : finalValue < 66 ? '#f59e0b'  // âmbar  — médio
    : '#22c55e';                    // verde   — alto

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg }}>
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && (
          <div style={{
            fontSize: Theme.typography.title.size,
            fontWeight: Theme.typography.title.weight,
            color: resolvedText,
            fontFamily: Theme.typography.fontFamily,
          }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{
            fontSize: Theme.typography.subtitle.size,
            color: T.textMuted,
            fontFamily: Theme.typography.fontFamily,
          }}>
            {subtitle}
          </div>
        )}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {/* ── Gradiente Red→Yellow→Green para o arco de fundo ── */}
          <linearGradient id={`gaugeTrack-${instanceId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.35} />
            <stop offset="50%"  stopColor="#f59e0b" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.35} />
          </linearGradient>

          {/* ── Gradiente do arco de valor (dinâmico pela cor do ponteiro) ── */}
          <linearGradient id={`gaugeValue-${instanceId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#22c55e" />
            <stop offset="50%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          {/* ── Glow filter no ponteiro ── */}
          <filter id={`gaugeGlow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Track Arc (fundo) ── */}
        <path
          d={getPath(radius, -90, 90)}
          fill="none"
          stroke={`url(#gaugeTrack-${instanceId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* ── Value Arc ── */}
        {finalValue > 0 && (
          <path
            d={getPath(radius, -90, rotation)}
            fill="none"
            stroke={`url(#gaugeValue-${instanceId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* ── Needle ── */}
        <g transform={`rotate(${rotation}, ${cx}, ${cy})`} filter={`url(#gaugeGlow-${instanceId})`}>
          <path
            d={`M ${cx - 14} ${cy} L ${cx + 14} ${cy} L ${cx} ${cy - radius - 30} Z`}
            fill={needleColor}
          />
          <circle cx={cx} cy={cy} r={32} fill={needleColor} stroke={resolvedBg} strokeWidth={8} />
        </g>

        {/* ── Valor Central ── */}
        <text
          x={cx} y={cy + 120}
          textAnchor="middle"
          style={{
            fontSize: Theme.typography.title.size * 2.2,
            fontWeight: 900,
            fill: needleColor,
            fontFamily: Theme.typography.fontFamily,
            filter: `drop-shadow(0 0 12px ${needleColor}55)`,
          }}
        >
          {Math.round(finalValue)}%
        </text>
        <text
          x={cx} y={cy + 220}
          textAnchor="middle"
          style={{
            fontSize: Theme.typography.subtitle.size,
            fill: T.textMuted,
            fontWeight: 500,
            fontFamily: Theme.typography.fontFamily,
          }}
        >
          {label}
        </text>

        {/* ── Rótulos dos extremos ── */}
        {(() => {
          const low  = pToC(radius + strokeWidth * 0.8, -90);
          const high = pToC(radius + strokeWidth * 0.8,  90);
          return (
            <>
              <text x={low.x}  y={low.y  - 16} textAnchor="middle" style={{ fontSize: 36, fill: '#ef4444', fontFamily: Theme.typography.fontFamily }}>0%</text>
              <text x={high.x} y={high.y - 16} textAnchor="middle" style={{ fontSize: 36, fill: '#22c55e', fontFamily: Theme.typography.fontFamily }}>100%</text>
            </>
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};
