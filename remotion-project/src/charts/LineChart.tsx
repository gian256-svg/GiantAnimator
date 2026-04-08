import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
  subtitle?: string;
  showArea?: boolean;
}

const format = (n: number) => {
  if (Math.abs(n) >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return (n/1000).toFixed(1) + "k";
  return n.toLocaleString();
};

export const LineChart: React.FC<LineChartProps> = ({
  data = [],
  title,
  subtitle,
  showArea = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ÁREA ÚTIL 4K (REGRA GLOBAL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const usableWidth = 3584; 
  const usableHeight = 1920; 
  const originX = 128;
  const originY = 160;

  const yAxisLabelWidth = 160;
  const chartHeight = usableHeight * 0.85; // 1632
  const xAxisHeight = usableHeight * 0.15; // 288

  const plotWidth = usableWidth - yAxisLabelWidth;
  const plotHeight = chartHeight;
  const plotLeft = originX + yAxisLabelWidth;
  const plotTop = originY;

  if (data.length < 2) return null;

  const vals = data.map(d => d.value);
  const minV = Math.min(...vals, 0);
  const maxV = Math.max(...vals) * 1.15;
  const range = maxV - minV || 1;

  const getX = (i: number) => plotLeft + (i / (data.length - 1)) * plotWidth;
  const getY = (v: number) => plotTop + plotHeight - ((v - minV) / range) * plotHeight;

  // Animation
  const reveal = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 60 } });
  const count = Math.max(0, Math.floor(reveal * data.length));
  
  const points = data.slice(0, count).map((d, i) => `${getX(i)},${getY(d.value)}`).join(" ");
  const areaPoints = points + ` L ${getX(count - 1)} ${plotTop + plotHeight} L ${getX(0)} ${plotTop + plotHeight} Z`;

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      <div style={{ position: 'absolute', top: 40, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`lineGrad-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={Theme.chartColors[0]} stopOpacity={0.4} />
            <stop offset="100%" stopColor={Theme.chartColors[0]} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* GRID Y */}
        <g opacity={0.4}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const val = minV + v * range;
            const y = getY(val);
            return (
              <React.Fragment key={v}>
                <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={Theme.colors.grid} strokeWidth={2} />
                <text x={plotLeft - 30} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontFamily: Theme.typography.fontFamily }}>{format(val)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* LINE & AREA */}
        {count >= 1 && (
          <g>
            {showArea && count >= 2 && <path d={areaPoints} fill={`url(#lineGrad-${instanceId})`} />}
            <path d={points} fill="none" stroke={Theme.chartColors[0]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Dots */}
            {data.slice(0, count).map((d, i) => (
              <circle key={i} cx={getX(i)} cy={getY(d.value)} r={10} fill="#fff" stroke={Theme.chartColors[0]} strokeWidth={4} />
            ))}
          </g>
        )}

        {/* X AXIS LABELS */}
        <g>
          {data.map((d, i) => {
            if (data.length > 12 && i % Math.ceil(data.length / 10) !== 0) return null;
            return (
              <text key={i} x={getX(i)} y={plotTop + plotHeight + 60} textAnchor="middle" style={{ fontSize: 32, fill: Theme.colors.textSecondary, fontFamily: Theme.typography.fontFamily }}>
                {d.label}
              </text>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
