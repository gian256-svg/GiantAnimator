import React, { useMemo, useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';

export interface TreemapNode {
  id: string;
  label: string;
  value: number;
  group?: string;
}

export interface TreemapChartProps {
  data: TreemapNode[];
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  data: TreemapNode;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({
  data: propData = [],
  title,
  subtitle,
  backgroundColor ?? T.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark');
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const plotWidth = width - margin * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const chartTop = margin + titleHeight;

  const data = useMemo(() => {
    return Array.isArray(propData) ? [...propData].sort((a, b) => b.value - a.value) : [];
  }, [propData]);

  const rects = useMemo(() => {
    if (data.length === 0) return [];
    const results: Rect[] = [];
    const totalValue = data.reduce((acc, d) => acc + d.value, 0) || 1;
    const scaleArea = (plotWidth * plotHeight) / totalValue;

    const squarify = (elements: TreemapNode[], x: number, y: number, w: number, h: number) => {
      if (elements.length === 0) return;
      const getRatio = (row: TreemapNode[], length: number) => {
        if (row.length === 0) return Infinity;
        const rowTotal = row.reduce((acc, d) => acc + d.value, 0);
        const maxVal = Math.max(...row.map(d => d.value));
        const minVal = Math.min(...row.map(d => d.value));
        const s = rowTotal * scaleArea;
        const widthSq = length * length;
        return Math.max((widthSq * maxVal * scaleArea) / (s * s), (s * s) / (widthSq * minVal * scaleArea));
      };

      const layoutRow = (row: TreemapNode[], length: number, curX: number, curY: number, isVertical: boolean) => {
        const rowTotal = row.reduce((acc, d) => acc + d.value, 0);
        const rowBreadth = (rowTotal * scaleArea) / length;
        let offset = 0;
        row.forEach((d) => {
          const itemLen = (d.value * scaleArea) / rowBreadth;
          if (isVertical) results.push({ x: curX, y: curY + offset, w: rowBreadth, h: itemLen, data: d });
          else results.push({ x: curX + offset, y: curY, w: itemLen, h: rowBreadth, data: d });
          offset += itemLen;
        });
        return rowBreadth;
      };

      let i = 0;
      let cX = x, cY = y, cW = w, cH = h;
      while (i < elements.length) {
        let length = Math.min(cW, cH);
        let isV = cW > cH;
        let row: TreemapNode[] = [];
        let lastRatio = Infinity;
        while (i < elements.length) {
          row.push(elements[i]);
          let curRatio = getRatio(row, length);
          if (curRatio > lastRatio) { row.pop(); break; }
          lastRatio = curRatio;
          i++;
        }
        let breadth = layoutRow(row, length, cX, cY, isV);
        if (isV) { cX += breadth; cW -= breadth; } else { cY += breadth; cH -= breadth; }
      }
    };

    squarify(data, margin, chartTop, plotWidth, plotHeight);
    return results;
  }, [data, plotWidth, plotHeight, margin, chartTop]);

  const groups = Array.from(new Set(data.map(d => d.group || "default")));

  return (
    <AbsoluteFill style={{ backgroundColor ?? T.background }}>
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {rects.map((r, i) => {
          const gIdx = groups.indexOf(r.data.group || "default");
          const color = T.colors[gIdx % T.colors.length];
          const pop = spring({ frame: frame - 20 - i * 4, fps, config: { damping: 15, stiffness: 60 } });

          return (
            <g key={r.data.id}>
              <rect
                 x={r.x} y={r.y} width={r.w} height={r.h} fill={color} opacity={0.8 * pop} stroke={backgroundColor ?? T.background} strokeWidth={2}
              />
              {r.w > 200 && r.h > 100 && pop > 0.9 && (
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: Theme.typography.axis.size, fill: "#fff", fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
                >
                  {r.data.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
