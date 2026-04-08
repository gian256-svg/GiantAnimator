import React from "react";
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

// --- THEME Definition (Self-contained for compilability) ---
// In a full Remotion project, this would typically be imported from '../theme'.
// For a standalone, compilable component, we define it here.
const THEME = {
  fontFamily: 'Inter, "Helvetica Neue", sans-serif',
  colors: {
    background: '#1a1a2e', // Dark background as per rule
    text: '#FFFFFF',
    subtitle: '#AAAAAA',
    grid: 'rgba(255,255,255,0.08)', // Dark grid color
    axisLabel: '#999999',
    valueLabel: '#FFFFFF',
    series1: '#7CB5EC', // Highcharts default blue for main series
  },
  fontSizes: {
    title: 22,
    subtitle: 14,
    axisLabel: 12,
    valueLabel: 13,
  },
  fontWeights: {
    title: 700,
    subtitle: 400,
    axisLabel: 400,
    valueLabel: 600,
  },
};
// --- End THEME Definition ---

// Zod schema for props validation
const AreaChartPropsSchema = z.object({
  data: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().min(0, "Value must be non-negative"),
      })
    )
    .min(1, "Data array must not be empty"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  color: z.string().optional(),
  showGrid: z.boolean().optional().default(true),
  showXAxisLabels: z.boolean().optional().default(true),
  showYAxisLabels: z.boolean().optional().default(true),
  showValueLabels: z.boolean().optional().default(true),
});

export type AreaChartProps = z.infer<typeof AreaChartPropsSchema>;

// Helper component for empty state
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      fontSize: 30,
      color: THEME.colors.text,
      fontFamily: THEME.fontFamily,
    }}
  >
    {message}
  </AbsoluteFill>
);

// Constants for animation
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

// Animation timing (in frames)
const START_FRAME_DELAY = 10;
const ANIMATION_END_FRAME_LINE_FILL = 60;
const ANIMATION_END_FRAME_LABELS = 70;

// Layout constants (base for 1920x1080)
const PLOT_PADDING = 40;
const TITLE_OFFSET_TOP = 24;
const X_AXIS_LABEL_OFFSET_BOTTOM = 32;
const LINE_STROKE_WIDTH = 3; // Rule: 3-5px for area chart line

// Number formatting helper
const formatValue = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toFixed(0);
};

export const AreaChart: React.FC<AreaChartProps> = ({
  data: rawData,
  title,
  subtitle,
  color,
  showGrid,
  showXAxisLabels,
  showYAxisLabels,
  showValueLabels,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Validate data using Zod
  const validatedProps = AreaChartPropsSchema.safeParse({
    data: rawData,
    title,
    subtitle,
    color,
    showGrid,
    showXAxisLabels,
    showYAxisLabels,
    showValueLabels,
  });

  if (!validatedProps.success) {
    console.error("AreaChart Props Validation Error:", validatedProps.error);
    return <EmptyState message="Invalid Data Provided" />;
  }

  const { data, color: propColor } = validatedProps.data;
  const chartColor = propColor || THEME.colors.series1; // Default to first series color

  // Calculate global scale for responsiveness
  const aspectRatioWidth = 1920;
  const aspectRatioHeight = 1080;
  const scale = Math.min(width / aspectRatioWidth, height / aspectRatioHeight);

  // Responsive layout dimensions
  const chartWidth = width;
  const chartHeight = height;

  // Calculate dynamic padding based on title and labels presence
  const dynamicPaddingTop = PLOT_PADDING + (title || subtitle ? TITLE_OFFSET_TOP : 0);
  const dynamicPaddingBottom = PLOT_PADDING + (showXAxisLabels ? X_AXIS_LABEL_OFFSET_BOTTOM : 0);

  const plotAreaX = PLOT_PADDING * scale;
  const plotAreaY = dynamicPaddingTop * scale;
  const plotWidth = chartWidth - (PLOT_PADDING * 2 * scale);
  const plotHeight = chartHeight - (dynamicPaddingTop + dynamicPaddingBottom) * scale;

  if (plotWidth <= 0 || plotHeight <= 0) {
    return <EmptyState message="Chart dimensions too small or invalid" />;
  }

  // Find max value for Y-axis scaling, ensuring it's never zero for division
  const maxValue = Math.max(...data.map((d) => d.value));
  const safeMaxValue = maxValue > 0 ? maxValue : 1; // Protect against division by zero

  // Process data points to calculate SVG coordinates
  const processedData = Array.isArray(data)
    ? data.map((d, i) => {
        // X position: evenly distributed across the plot width
        const x = plotAreaX + (i / (data.length - 1 || 1)) * plotWidth;
        // Y position: scaled based on value and inverted for SVG coordinates (origin top-left)
        const y = plotAreaY + plotHeight - (d.value / safeMaxValue) * plotHeight;
        return { ...d, x, y: isNaN(y) ? plotAreaY + plotHeight : y }; // Protect Y from NaN
      })
    : [];

  // Generate SVG path 'd' attribute for the line
  const linePathD =
    Array.isArray(processedData) && processedData.length > 0
      ? processedData
          .map((d, i) => `${i === 0 ? "M" : "L"} ${d.x},${d.y}`)
          .join(" ")
      : "";

  // Generate SVG path 'd' attribute for the area, connecting to the X-axis (baseline)
  const areaPathD =
    Array.isArray(processedData) && processedData.length > 0
      ? `M ${processedData[0].x},${plotAreaY + plotHeight} ` + // Start at bottom-left of first point
        processedData.map((d) => `L ${d.x},${d.y}`).join(" ") + // Go up and connect all data points
        ` L ${processedData[processedData.length - 1].x},${
          plotAreaY + plotHeight
        } Z` // Go down to bottom-right of last point and close the path
      : "";

  // Calculate total length of the line for stroke-dasharray animation
  let totalLineLength = 0;
  if (Array.isArray(processedData) && processedData.length > 1) {
    for (let i = 0; i < processedData.length - 1; i++) {
      const p1 = processedData[i];
      const p2 = processedData[i + 1];
      totalLineLength += Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
    }
  }

  // Animation for line drawing (stroke-dashoffset)
  const lineProgress = spring({
    frame: frame - START_FRAME_DELAY,
    fps,
    config: SPRING_CONFIG_MAIN,
    from: 0,
    to: 1,
  });
  const animatedLineDashoffset = interpolate(
    lineProgress,
    [0, 1],
    [totalLineLength, 0],
    { extrapolateRight: "clamp" }
  );

  // Animation for area fill opacity, synchronized with line progress
  const areaFillOpacity = interpolate(
    lineProgress,
    [0, 1],
    [0, 1], // Goes from 0 to 1, then adjusted by gradient stop opacity
    { extrapolateRight: "clamp" }
  );

  // Animation for Y-axis elements (grid lines and labels)
  const yAxisFade = spring({
    frame: frame - START_FRAME_DELAY,
    fps,
    config: SPRING_CONFIG_SUBTLE,
    from: 0,
    to: 1,
  });

  // Animation for X-axis labels
  const xAxisFade = spring({
    frame: frame - START_FRAME_DELAY,
    fps,
    config: SPRING_CONFIG_SUBTLE,
    from: 0,
    to: 1,
  });

  // Animation for value labels (appear after line/area completes)
  const valueLabelSpring = spring({
    frame: frame - ANIMATION_END_FRAME_LINE_FILL + 10, // Start 10 frames after line/area finishes
    fps,
    config: SPRING_CONFIG_LABELS,
    from: 0,
    to: 1,
  });
  const valueLabelOpacity = interpolate(valueLabelSpring, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const valueLabelScale = interpolate(valueLabelSpring, [0, 1], [0.5, 1], {
    extrapolateRight: "clamp",
  });

  // Determine Y-axis tick values (e.g., 5 equal divisions)
  const numYAxisTicks = 5;
  const yAxisTickValues = Array.from({ length: numYAxisTicks + 1 }).map(
    (_, i) => (maxValue / numYAxisTicks) * i
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.colors.background,
        fontFamily: THEME.fontFamily,
      }}
    >
      <svg width={chartWidth} height={chartHeight}>
        {/* Definitions for linear gradient for the area fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            {/* Gradient from 0.5 opacity at top to 0.1 opacity at base, as per reference */}
            <stop
              offset="0%"
              stopColor={chartColor}
              stopOpacity={0.5 * areaFillOpacity}
            />
            <stop
              offset="100%"
              stopColor={chartColor}
              stopOpacity={0.1 * areaFillOpacity}
            />
          </linearGradient>
        </defs>

        {/* Chart Title */}
        {title && (
          <text
            x={plotAreaX}
            y={scale * (PLOT_PADDING - 10)} // Position above plot, considering padding
            fontSize={scale * THEME.fontSizes.title}
            fontWeight={THEME.fontWeights.title}
            fill={THEME.colors.text}
            opacity={yAxisFade}
            dominantBaseline="hanging"
          >
            {title}
          </text>
        )}
        {/* Chart Subtitle */}
        {subtitle && (
          <text
            x={plotAreaX}
            y={scale * (PLOT_PADDING - 10 + THEME.fontSizes.title + 4)} // Below title
            fontSize={scale * THEME.fontSizes.subtitle}
            fontWeight={THEME.fontWeights.subtitle}
            fill={THEME.colors.subtitle}
            opacity={yAxisFade}
            dominantBaseline="hanging"
          >
            {subtitle}
          </text>
        )}

        {/* Y-axis Grid Lines and Labels */}
        {showGrid &&
          Array.isArray(yAxisTickValues) &&
          yAxisTickValues.map((tickValue, i) => {
            const y = plotAreaY + plotHeight - (tickValue / safeMaxValue) * plotHeight;
            const safeY = isNaN(y) ? plotAreaY + plotHeight : y; // Protect against NaN

            // Highlight baseline (y=0) with higher opacity
            const isBaseline = i === 0;
            const gridLineOpacity = interpolate(
              yAxisFade,
              [0, 1],
              [0, isBaseline ? 0.25 : 0.08],
              { extrapolateRight: "clamp" }
            );

            return (
              <React.Fragment key={`y-axis-tick-${i}`}>
                <line
                  x1={plotAreaX}
                  y1={safeY}
                  x2={plotAreaX + plotWidth}
                  y2={safeY}
                  stroke={THEME.colors.grid}
                  strokeWidth={1 * scale}
                  strokeDasharray="4 4" // Dashed style for grid
                  opacity={gridLineOpacity}
                />
                {showYAxisLabels && (
                  <text
                    x={plotAreaX - scale * 10} // Position to the left of the grid
                    y={safeY}
                    textAnchor="end" // Align right
                    alignmentBaseline="middle"
                    fontSize={scale * THEME.fontSizes.axisLabel}
                    fill={THEME.colors.axisLabel}
                    opacity={yAxisFade}
                  >
                    {formatValue(tickValue)}
                  </text>
                )}
              </React.Fragment>
            );
          })}

        {/* X-axis Labels */}
        {showXAxisLabels &&
          Array.isArray(processedData) &&
          processedData.map((d, i) => (
            <text
              key={`x-axis-label-${i}`}
              x={d.x}
              y={plotAreaY + plotHeight + scale * 15} // Position below the plot area
              textAnchor="middle" // Center under each point
              fontSize={scale * THEME.fontSizes.axisLabel}
              fill={THEME.colors.axisLabel}
              opacity={xAxisFade}
            >
              {d.label}
            </text>
          ))}

        {/* Area Path */}
        {areaPathD && (
          <path
            d={areaPathD}
            fill="url(#areaGradient)" // Use the defined linear gradient
          />
        )}

        {/* Line Path (on top of the area) */}
        {linePathD && (
          <path
            d={linePathD}
            fill="none"
            stroke={chartColor}
            strokeWidth={LINE_STROKE_WIDTH * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLineLength} // For stroke-dashoffset animation
            strokeDashoffset={animatedLineDashoffset}
          />
        )}

        {/* Value Labels */}
        {showValueLabels &&
          Array.isArray(processedData) &&
          processedData.map((d, i) => {
            const safeX = isNaN(d.x) ? 0 : d.x;
            const safeY = isNaN(d.y) ? 0 : d.y;
            return (
              <text
                key={`value-label-${i}`}
                x={safeX}
                y={safeY - scale * 8} // Position 8px above the data point
                textAnchor="middle"
                alignmentBaseline="baseline"
                fontSize={scale * THEME.fontSizes.valueLabel}
                fontWeight={THEME.fontWeights.valueLabel}
                fill={THEME.colors.valueLabel}
                opacity={valueLabelOpacity}
                // Scale from the text's own position
                transform={`scale(${valueLabelScale})`}
                style={{
                  transformOrigin: `${safeX}px ${safeY - scale * 8}px`,
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)", // Text shadow for better contrast
                }}
              >
                {formatValue(d.value)}
              </text>
            );
          })}
      </svg>
    </AbsoluteFill>
  );
};
