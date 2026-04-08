import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { THEME } from "../theme";

interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

// Spring configurations
const SPRING_CONFIG_MAIN = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

const SPRING_CONFIG_LABELS = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

export const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Basic scaling for responsiveness
  const scale = Math.min(width / 1920, height / 1080);

  // Layout constants
  const PADDING = 40 * scale;
  const TITLE_HEIGHT = title ? 24 * scale : 0;
  const X_AXIS_LABEL_HEIGHT = 32 * scale; // For potentially rotated labels
  const PLOT_AREA_WIDTH = width - 2 * PADDING;
  const PLOT_AREA_HEIGHT =
    height - 2 * PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  // Handle empty or invalid data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          fontSize: 30 * scale,
          color: THEME.colors.text.secondary,
          display: "flex",
        }}
      >
        Sem dados para exibir
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const numBars = data.length;
  const barGap = 30 * scale; // 30-40% of bar width
  const barWidth = PLOT_AREA_WIDTH / numBars - barGap;
  const actualBarWidth = Math.max(
    (PLOT_AREA_WIDTH / numBars) * 0.58,
    barWidth
  ); // ~58% rule
  const spacePerBar = PLOT_AREA_WIDTH / numBars;

  // Calculate grid line count and spacing
  const numGridLines = 5;
  const gridLineSpacing = PLOT_AREA_HEIGHT / numGridLines;
  const valuePerGridLine = maxValue / numGridLines;

  return (
    <svg width={width} height={height}>
      {/* Background (optional, but good practice for full canvas components) */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={THEME.colors.background}
      />

      {/* Title */}
      {title && (
        <text
          x={width / 2}
          y={PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={18 * scale}
          fontWeight={700}
          fill={THEME.colors.text.primary}
          style={{
            opacity: spring({
              frame,
              fps,
              config: SPRING_CONFIG_SUBTLE,
              from: 0,
              to: 1,
              delay: 0,
            }),
          }}
        >
          {title}
        </text>
      )}

      {/* Plot Area Border (for reference, can be removed) */}
      {/* <rect
        x={PADDING}
        y={PADDING + TITLE_HEIGHT}
        width={PLOT_AREA_WIDTH}
        height={PLOT_AREA_HEIGHT}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
      /> */}

      {/* Grid Lines */}
      {Array.from({ length: numGridLines + 1 }).map((_, i) => {
        const yGrid =
          PADDING + TITLE_HEIGHT + PLOT_AREA_HEIGHT - i * gridLineSpacing;
        const opacity = spring({
          frame,
          fps,
          config: SPRING_CONFIG_SUBTLE,
          from: 0,
          to: 1,
          delay: 5, // Appear after title
        });

        // Highlight zero line
        const isZeroLine = i === 0;
        const strokeColor = isZeroLine
          ? "rgba(255,255,255,0.25)"
          : "rgba(255,255,255,0.08)";
        const strokeDasharray = isZeroLine ? "none" : "4 4";

        const safeYGrid = isNaN(yGrid) ? 0 : yGrid;

        return (
          <React.Fragment key={`grid-line-${i}`}>
            <line
              x1={PADDING}
              y1={safeYGrid}
              x2={width - PADDING}
              y2={safeYGrid}
              stroke={strokeColor}
              strokeWidth={1 * scale}
              strokeDasharray={strokeDasharray}
              opacity={opacity}
            />
            {/* Y-axis labels */}
            <text
              x={PADDING - 10 * scale}
              y={safeYGrid}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11 * scale}
              fill={THEME.colors.text.secondary}
              opacity={opacity}
            >
              {isZeroLine ? "0" : `${(i * valuePerGridLine).toFixed(0)}`}
            </text>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {data.map((d, index) => {
        const barX =
          PADDING +
          index * spacePerBar +
          (spacePerBar - actualBarWidth) / 2;

        const barHeightProgress = spring({
          frame: frame - 10 - index * 6, // Stagger delay: 10 frames initial + 6 frames per bar
          fps,
          config: SPRING_CONFIG_MAIN,
          from: 0,
          to: 1,
          durationInFrames: 60,
        });

        const safeHeight = maxValue > 0 ? (d.value / maxValue) * PLOT_AREA_HEIGHT : 0;
        const actualBarHeight = Math.max(safeHeight, d.value > 0 ? 4 * scale : 0); // Min height 4px for positive values

        const currentBarHeight = actualBarHeight * barHeightProgress;
        const barY =
          PADDING + TITLE_HEIGHT + PLOT_AREA_HEIGHT - currentBarHeight;

        // Ensure currentBarHeight is not NaN
        const safeCurrentBarHeight = isNaN(currentBarHeight)
          ? 0
          : currentBarHeight;
        const safeBarY = isNaN(barY) ? 0 : barY;
        const safeBarX = isNaN(barX) ? 0 : barX;

        // Label animation
        const labelOpacity = spring({
          frame: frame - 50 - index * 6, // Labels appear later
          fps,
          config: SPRING_CONFIG_LABELS,
          from: 0,
          to: 1,
          durationInFrames: 20,
          overshootClamping: true,
        });

        // Gradient for the bar
        const gradientId = `bar-gradient-${index}`;
        const barColor = THEME.colors.series[index % THEME.colors.series.length];

        return (
          <React.Fragment key={d.label}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={barColor} stopOpacity="1.0" />
                <stop offset="100%" stopColor={barColor} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <rect
              x={safeBarX}
              y={safeBarY}
              width={actualBarWidth}
              height={safeCurrentBarHeight}
              fill={`url(#${gradientId})`}
              rx={4 * scale} // Rounded top corners
              ry={4 * scale}
            />
            {/* Value label */}
            {safeCurrentBarHeight > 0 && (
              <text
                x={safeBarX + actualBarWidth / 2}
                y={safeBarY - 8 * scale} // 8px above the bar
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize={12 * scale}
                fontWeight={600}
                fill={THEME.colors.text.primary}
                opacity={labelOpacity}
                style={{
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                {d.value.toLocaleString("en-US")}
              </text>
            )}
            {/* X-axis label */}
            <text
              x={safeBarX + actualBarWidth / 2}
              y={height - PADDING - X_AXIS_LABEL_HEIGHT / 2 + 10 * scale}
              textAnchor="middle"
              dominantBaseline="hanging"
              fontSize={11 * scale}
              fill={THEME.colors.text.secondary}
              opacity={labelOpacity}
            >
              {d.label}
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
};
