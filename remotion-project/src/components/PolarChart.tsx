import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface PolarData {
  label: string;
  value: number;
}

export interface PolarChartProps {
  data: PolarData[];
  title: string;
  subtitle?: string;
}

export const PolarChart: React.FC<PolarChartProps> = ({
  data = [],
  title,
  subtitle,
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

  const cx = originX + usableWidth / 2;
  const cy = originY + usableHeight / 2;
  const maxRadius = usableHeight * 0.42;

  if (data.length === 0) return null;

  const numSectors = data.length;
  const angleStep = (Math.PI * 2) / numSectors;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background }}>
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {data.map((_, i) => (
            <radialGradient key={i} id={`polarGrad-${i}-${instanceId}`}>
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.8} />
            </radialGradient>
          ))}
        </defs>

        {/* Concêntricos */}
        {[0.25, 0.5, 0.75, 1].map(v => (
          <circle key={v} cx={cx} cy={cy} r={maxRadius * v} fill="none" stroke={Theme.colors.grid} strokeWidth={2} opacity={0.3} strokeDasharray="16 8" />
        ))}

        {/* Rose Sectors */}
        {data.map((d, i) => {
          const startAngle = i * angleStep - Math.PI / 2;
          const endAngle = (i + 1) * angleStep - Math.PI / 2;
          const pop = spring({ frame: frame - 25 - i * 5, fps, config: { damping: 14, stiffness: 60 } });
          const curR = (d.value / maxValue) * maxRadius * pop;
          
          const x1 = cx + Math.cos(startAngle) * curR;
          const y1 = cy + Math.sin(startAngle) * curR;
          const x2 = cx + Math.cos(endAngle) * curR;
          const y2 = cy + Math.sin(endAngle) * curR;
          const largeArc = angleStep > Math.PI ? 1 : 0;
          const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${curR} ${curR} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          const labelAngle = startAngle + angleStep / 2;
          const lp = { x: cx + Math.cos(labelAngle) * (curR + 50), y: cy + Math.sin(labelAngle) * (curR + 50) };

          return (
            <g key={i}>
              <path d={pathD} fill={`url(#polarGrad-${i}-${instanceId})`} stroke={Theme.colors.background} strokeWidth={2} opacity={0.85} />
              {pop > 0.9 && (
                <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fill: Theme.colors.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}>
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
