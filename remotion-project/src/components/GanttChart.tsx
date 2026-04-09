import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme } from "../theme";

export interface GanttTask {
  id: string;
  label: string;
  start: number;
  duration: number;
  color?: string;
  dependencies?: string[];
}

export interface GanttChartProps {
  tasks: GanttTask[];
  title: string;
  subtitle?: string;
  totalDays?: number;
  backgroundColor?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks = [],
  title,
  subtitle,
  totalDays: propTotalDays = 0,
  backgroundColor = Theme.colors.background,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Safe Zone 4K
  const margin = Theme.spacing.padding || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;
  const sidebarWidth = 500;
  
  const totalDays = propTotalDays || Math.max(...tasks.map(t => t.start + t.duration), 1);
  const plotWidth = width - sidebarWidth - margin * 2;
  const plotHeight = height - margin * 2 - titleHeight - 100;
  const rowHeight = plotHeight / (tasks.length || 1);
  const barHeight = rowHeight * 0.55;

  const getDayX = (day: number) => sidebarWidth + margin + (day / totalDays) * plotWidth;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* ZONA 1 — Cabeçalho */}
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

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          {tasks.map((_, i) => (
            <linearGradient key={i} id={`ganttGrad-${i}-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} />
              <stop offset="100%" stopColor={Theme.chartColors[i % Theme.chartColors.length]} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>

        {/* Timeline Grid */}
        <g opacity={0.3}>
          {Array.from({ length: Math.ceil(totalDays) + 1 }).map((_, i) => (
            <React.Fragment key={i}>
              <line 
                x1={getDayX(i)} y1={margin + titleHeight} 
                x2={getDayX(i)} y2={margin + titleHeight + plotHeight} 
                stroke={Theme.colors.grid} strokeDasharray="8 8" 
              />
              <text x={getDayX(i)} y={margin + titleHeight + plotHeight + 50} textAnchor="middle" style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontFamily: Theme.typography.fontFamily }}>{i}d</text>
            </React.Fragment>
          ))}
        </g>

        {/* Dependencies */}
        {tasks.map((task, i) => (
           task.dependencies?.map(depId => {
              const depTask = tasks.find(t => t.id === depId);
              if (!depTask) return null;
              const depIdx = tasks.indexOf(depTask);
              const x1 = getDayX(depTask.start + depTask.duration);
              const y1 = margin + titleHeight + depIdx * rowHeight + rowHeight / 2;
              const x2 = getDayX(task.start);
              const y2 = margin + titleHeight + i * rowHeight + rowHeight / 2;
              const linkShow = spring({ frame: frame - 80 - i * 4, fps, config: { stiffness: 40 } });

              return (
                <path
                  key={`${task.id}-${depId}`}
                  d={`M ${x1} ${y1} H ${(x1+x2)/2} V ${y2} H ${x2}`}
                  fill="none" stroke={Theme.colors.ui.axisLine} strokeWidth={3}
                  strokeOpacity={0.5 * linkShow} strokeDasharray="6 6"
                />
              );
           })
        ))}

        {/* Tasks */}
        {tasks.map((task, i) => {
          const x = getDayX(task.start);
          const y = margin + titleHeight + i * rowHeight + rowHeight / 2;
          const barW = (task.duration / totalDays) * plotWidth;
          const barProgress = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 15, stiffness: 80 } });

          return (
            <g key={task.id} opacity={barProgress}>
              <text 
                 x={sidebarWidth + margin - 30} y={y} textAnchor="end" dominantBaseline="middle" 
                 style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.text, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}
              >
                {task.label}
              </text>

              <rect
                 x={x} y={y - barHeight / 2} width={barW * barProgress} height={barHeight}
                 fill={`url(#ganttGrad-${i}-${instanceId})`} rx={6}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
