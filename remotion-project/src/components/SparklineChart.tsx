import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface SparklineItem {
  label: string;
  data: number[];
  color?: string;
}

export interface SparklineChartProps {
  items: SparklineItem[];
  title: string;
  subtitle?: string;
  columns?: number;
  backgroundColor?: string;
  theme?: string;
  colors?: string[];
  textColor?: string;
}

const Sparkline: React.FC<{
  item: SparklineItem;
  width: number;
  height: number;
  index: number;
  instanceId: string;
}> = ({ item, width, height, index, instanceId }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = item.data || [];
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const range = max - min || 1;
  const color = item.color || T.colors[index % T.colors.length];

  const getX = (i: number) => (i / (data.length - 1 || 1)) * width;
  const getY = (val: number) => height - ((val - min) / range) * height;

  const reveal = spring({ frame: frame - 30 - index * 6, fps, config: { damping: 15, stiffness: 60 } });
  const count = Math.floor(reveal * data.length);
  if (count < 2) return null;

  const points = data.slice(0, count).map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const lastVal = data[data.length - 1];

  return (
    <g>
      <text x={0} y={-20} style={{ fontSize: Theme.typography.axis.size, fill: T.textMuted, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}>{item.label}</text>
      <polyline points={points} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={getX(count-1)} cy={getY(data[count-1])} r={6} fill={color} />
      <text x={width + 20} y={height / 2} dominantBaseline="middle" style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily, opacity: reveal }}>
        {lastVal.toLocaleString()}
      </text>
    </g>
  );
};

export const SparklineChart: React.FC<SparklineChartProps> = ({
  items = [],
  title,
  subtitle,
  columns = 2,
  backgroundColor,
}) => {
  const { width, height } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const gap = 150;
  const plotWidth = width - margin * 2;
  const itemWidth = (plotWidth - (columns - 1) * gap) / columns;
  const itemHeight = 150;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor ?? T.background }}>
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(useCurrentFrame(), [0, 15], [0, 1])
      }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {items.map((item, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);
          const x = margin + col * (itemWidth + gap);
          const y = margin + titleHeight + 100 + row * (itemHeight + 120);

          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <Sparkline item={item} width={itemWidth - 150} height={itemHeight} index={i} instanceId={instanceId} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
