import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface BulletMetric {
  label: string;
  value: number;
  target: number;
  ranges: number[];
}

export interface BulletChartProps {
  metrics: BulletMetric[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

export const BulletChart: React.FC<BulletChartProps> = ({
  metrics = [],
  title,
  subtitle,
  backgroundColor,
  theme = 'dark',
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.canvas.safeZoneX;
  const titleHeight = Theme.canvas.safeZoneTop;
  const paddingLeft = 400; // EspaÃ§o para labels longas
  const paddingRight = margin;
  
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - margin * 2 - titleHeight - 80;
  const metricHeight = plotHeight / (metrics.length || 1);
  const barThickness = 60;
  const rangeThickness = 120;

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        style={bgStyle} 
        baseColor={backgroundColor ?? T.background} 
        accentColor={T.colors[0]} 
      />
      {/* ZONA 1 â€” CabeÃ§alho */}
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

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {metrics.map((_, i) => (
            <linearGradient key={i} id={`bulletGrad-${i}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={T.colors[i % T.colors.length]} />
              <stop offset="100%" stopColor={T.colors[i % T.colors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {metrics.map((m, i) => {
          const centerY = margin + titleHeight + i * metricHeight + metricHeight / 2;
          const maxRangeValue = Math.max(...m.ranges, m.target, m.value, 1);
          const getX = (val: number) => paddingLeft + (val / maxRangeValue) * plotWidth;

          const barProgress = spring({ frame: frame - 20 - (i * 8), fps, config: { damping: 14, stiffness: 100 } });
          const targetPop = spring({ frame: frame - 60 - (i * 8), fps, config: { damping: 10, stiffness: 100 } });

          return (
            <g key={i}>
              <text
                x={paddingLeft - 40} y={centerY} textAnchor="end" dominantBaseline="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}
              >
                {m.label}
              </text>

              {/* Ranges */}
              {m.ranges.map((rangeVal, rIdx) => {
                const prevRange = rIdx === 0 ? 0 : m.ranges[rIdx - 1];
                const xStart = getX(prevRange);
                const xEnd = getX(rangeVal);
                return (
                  <rect
                    key={rIdx} x={xStart} y={centerY - rangeThickness / 2} width={xEnd - xStart} height={rangeThickness}
                    fill={T.text} opacity={0.05 + rIdx * 0.05} rx={4}
                  />
                );
              })}

              {/* Performance Bar */}
              <rect
                x={paddingLeft} y={centerY - barThickness / 2}
                width={(getX(m.value) - paddingLeft) * barProgress}
                height={barThickness} fill={`url(#bulletGrad-${i}-${instanceId})`} rx={4}
              />

              {/* Target Marker */}
              {targetPop > 0 && (
                <line
                  x1={getX(m.target)} y1={centerY - (rangeThickness / 2 + 20) * targetPop}
                  x2={getX(m.target)} y2={centerY + (rangeThickness / 2 + 20) * targetPop}
                  stroke={Theme.colors.highlight} strokeWidth={8} strokeLinecap="round"
                />
              )}

              {/* Ticks */}
              {i === metrics.length - 1 && (
                <g opacity={0.6}>
                   {[0, 0.5, 1].map(p => {
                     const val = p * maxRangeValue;
                     const x = getX(val);
                     return (
                       <text key={p} x={x} y={centerY + rangeThickness} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.textMuted, fontFamily: Theme.typography.fontFamily }}>{Math.round(val)}</text>
                     );
                   })}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
