import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { THEME } from "../theme";

// Define spring configurations as per rules
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

// Helper to format numbers (k/M)
const formatNumber = (num: number): string => {
  if (Math.abs(num) < 1000) {
    return num.toFixed(0);
  }
  if (Math.abs(num) < 1_000_000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return `${(num / 1_000_000).toFixed(1)}M`;
};

interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  chartColor?: string; // Optional custom color, defaults to THEME.colors.primary
  showGrid?: boolean;
}

// Empty State Component for robustness
const EmptyState: React.FC<{ message: string }> = ({ message }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({
    frame,
    fps,
    config: SPRING_CONFIG_SUBTLE,
    from: 0,
    to: 1,
    durationInFrames: 30,
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: THEME.colors.textSecondary,
        fontSize: "24px",
        fontFamily: THEME.fontFamily,
        opacity,
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {message}
    </div>
  );
};

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title = "Area Chart",
  subtitle = "",
  chartColor = THEME.colors.primary,
  showGrid = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Calculate scale for responsiveness based on 1920x1080 standard
  const scale = Math.min(width / 1920, height / 1080);

  // --- Layout Dimensions ---
  const outerPadding = 40 * scale;
  const titleSpace = title ? 24 * scale : 0;
  const subtitleSpace = subtitle ? 14 * scale : 0;
  const labelsXSpace = 32 * scale; // Extra space for X-axis labels

  // Calculate plot area dimensions and margins
  const plotMargin = {
    top: outerPadding + titleSpace + subtitleSpace,
    right: outerPadding,
    bottom: outerPadding + labelsXSpace,
    left: outerPadding + (50 * scale), // Added space for Y-axis labels
  };

  const plotWidth = width - plotMargin.left - plotMargin.right;
  const plotHeight = height - plotMargin.top - plotMargin.bottom;

  // Robustness: Handle insufficient plot dimensions
  if (plotWidth <= 0 || plotHeight <= 0) {
    return <EmptyState message="Gráfico muito pequeno para renderizar." />;
  }

  // --- Data Processing ---
  // Robustness: Check for empty or invalid data array
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState message="Nenhum dado para exibir." />;
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 0); // Ensure Y-axis starts at 0

  // Robustness: Protect against division by zero for yAxisScale
  const yAxisScale = maxValue > 0 ? plotHeight / maxValue : 0;

  // Calculate X positions for each data point
  const barWidth = plotWidth / data.length; // Space allocated per point
  const xCoords = data.map(
    (_, i) => i * barWidth + barWidth / 2 // Center points
  );

  // --- Path Generation ---
  let currentPathLength = 0; // To calculate strokeDashoffset for line animation
  let prevX = 0;
  let prevY = 0;

  // Generate SVG path for the line and calculate its length
  let linePath = "";
  if (data.length > 0) {
    const points = data
      .map((d, i) => {
        const x = xCoords[i];
        const y = plotHeight - d.value * yAxisScale;

        // Robustness: NaN protection for coordinates
        const safeX = isNaN(x) ? 0 : x;
        const safeY = isNaN(y) ? 0 : y;

        if (i === 0) {
          prevX = safeX;
          prevY = safeY;
        } else {
          const dx = safeX - prevX;
          const dy = safeY - prevY;
          currentPathLength += Math.sqrt(dx * dx + dy * dy);
          prevX = safeX;
          prevY = safeY;
        }
        return `${safeX},${safeY}`;
      })
      .join("L");
    linePath = `M${points}`;
  }

  const pathLength = currentPathLength; // Use the calculated path length

  // Generate SVG path for the area (connects to the bottom of the plot area)
  let areaPath = "";
  if (data.length > 0) {
    const firstX = xCoords[0];
    const lastX = xCoords[xCoords.length - 1];

    const areaPoints = data
      .map((d, i) => {
        const x = xCoords[i];
        const y = plotHeight - d.value * yAxisScale;
        // Robustness: NaN protection
        return `${isNaN(x) ? 0 : x},${isNaN(y) ? 0 : y}`;
      })
      .join("L");

    // Robustness: NaN protection for start/end points
    areaPath = `M${isNaN(firstX) ? 0 : firstX},${plotHeight}L${areaPoints}L${
      isNaN(lastX) ? 0 : lastX
    },${plotHeight}Z`;
  }

  // --- Animations ---
  // Chart entrance (fade + scale) from frames 0-20
  const chartEntranceProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIG_SUBTLE,
    from: 0,
    to: 1,
    durationInFrames: 20, // frames 0-20
  });

  const chartScale = interpolate(
    chartEntranceProgress,
    [0, 1],
    [0.8, 1], // slight scale up
    { extrapolateRight: "clamp" }
  );

  const chartOpacity = interpolate(
    chartEntranceProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Line and Area draw animation (frames 10-60)
  const drawStartFrame = 10;
  const drawEndFrame = 60;
  const drawProgress = spring({
    frame: frame - drawStartFrame,
    fps,
    config: SPRING_CONFIG_MAIN,
    from: 0,
    to: 1,
    durationInFrames: drawEndFrame - drawStartFrame,
  });

  // Animate strokeDashoffset for line drawing
  const animatedStrokeDashoffset = interpolate(
    drawProgress,
    [0, 1],
    [pathLength, 0],
    { extrapolateRight: "clamp" }
  );

  // Animate area fill opacity simultaneously with line draw
  const areaFillAnimationOpacity = interpolate(
    drawProgress,
    [0, 1],
    [0, 1], // Fades from 0 to 1 as line draws
    { extrapolateRight: "clamp" }
  );

  // Label fade-in animation (frames 50-70)
  const labelStartFrame = 50;
  const labelEndFrame = 70;
  const labelsOpacity = spring({
    frame: frame - labelStartFrame,
    fps,
    config: SPRING_CONFIG_LABELS,
    from: 0,
    to: 1,
    durationInFrames: labelEndFrame - labelStartFrame,
  });

  // --- Y-axis Grid Lines and Labels ---
  const numYTicks = 5; // e.g., 0%, 25%, 50%, 75%, 100%
  const yTicks = Array.from({ length: numYTicks }).map((_, i) => {
    const value = (maxValue / (numYTicks - 1)) * i;
    const y = plotHeight - value * yAxisScale;
    return { value, y };
  });

  // Determine grid line colors based on theme
  const gridLineColor = THEME.isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.08)";
  const zeroLineColor = THEME.isDark
    ? "rgba(255,255,255,0.25)"
    : "rgba(0,0,0,0.25)";

  return (
    <svg
      width={width}
      height={height}
      style={{
        backgroundColor: THEME.colors.background,
        fontFamily: THEME.fontFamily,
      }}
    >
      <defs>
        {/* Gradient for area fill, with animated opacity */}
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={chartColor}
            stopOpacity={0.5 * areaFillAnimationOpacity} // Top opacity 0.5
          />
          <stop
            offset="100%"
            stopColor={chartColor}
            stopOpacity={0.1 * areaFillAnimationOpacity} // Base opacity 0.1
          />
        </linearGradient>
      </defs>

      <g
        style={{
          transform: `scale(${chartScale})`,
          transformOrigin: "center center",
          opacity: chartOpacity,
        }}
      >
        {/* Title */}
        {title && (
          <text
            x={width / 2}
            y={outerPadding + 18 * scale} // Position adjusted for font size
            textAnchor="middle"
            fill={THEME.colors.textPrimary}
            fontSize={`${18 * scale}px`}
            fontWeight={700}
            opacity={labelsOpacity}
          >
            {title}
          </text>
        )}
        {/* Subtitle */}
        {subtitle && (
          <text
            x={width / 2}
            y={outerPadding + titleSpace + 10 * scale} // Position below title
            textAnchor="middle"
            fill={THEME.colors.textSecondary}
            fontSize={`${13 * scale}px`}
            fontWeight={400}
            opacity={labelsOpacity}
          >
            {subtitle}
          </text>
        )}

        <g transform={`translate(${plotMargin.left}, ${plotMargin.top})`}>
          {/* Y-axis Grid Lines and Labels */}
          {showGrid &&
            yTicks.map((tick, i) => (
              <React.Fragment key={`y-tick-${i}`}>
                <line
                  x1={0}
                  y1={isNaN(tick.y) ? 0 : tick.y} // NaN protection
                  x2={plotWidth}
                  y2={isNaN(tick.y) ? 0 : tick.y} // NaN protection
                  stroke={tick.value === 0 ? zeroLineColor : gridLineColor}
                  strokeWidth={1}
                  strokeDasharray="4 4" // Dashed style
                  opacity={
                    spring({
                      frame: frame - (drawStartFrame + i * 2), // Staggered appearance
                      fps,
                      config: SPRING_CONFIG_SUBTLE,
                      from: 0,
                      to: 1,
                      durationInFrames: 20,
                    })
                  }
                />
                <text
                  x={-10 * scale} // Aligned right of plot area
                  y={isNaN(tick.y) ? 0 : tick.y + 4 * scale} // Centered vertically on line
                  textAnchor="end"
                  fill={THEME.colors.textSecondary}
                  fontSize={`${11 * scale}px`}
                  opacity={labelsOpacity}
                >
                  {formatNumber(tick.value)}
                </text>
              </React.Fragment>
            ))}

          {/* Area Path */}
          <path
            d={areaPath}
            fill="url(#areaGradient)" // Use the animated gradient
            stroke="none"
          />

          {/* Line Path (rendered on top of the area) */}
          <path
            d={linePath}
            fill="none"
            stroke={chartColor}
            strokeWidth={4 * scale} // Stroke width 3-5px, using 4px
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            strokeDashoffset={animatedStrokeDashoffset}
          />

          {/* X-axis Labels */}
          {data.map((d, i) => {
            const x = xCoords[i];
            return (
              <text
                key={`x-label-${i}`}
                x={isNaN(x) ? 0 : x} // NaN protection
                y={plotHeight + 15 * scale}
                textAnchor="middle"
                fill={THEME.colors.textSecondary}
                fontSize={`${11 * scale}px`}
                opacity={labelsOpacity}
              >
                {d.label}
              </text>
            );
          })}

          {/* Value Labels on points */}
          {data.map((d, i) => {
            const x = xCoords[i];
            const y = plotHeight - d.value * yAxisScale;
            return (
              <text
                key={`value-label-${i}`}
                x={isNaN(x) ? 0 : x} // NaN protection
                y={isNaN(y) ? 0 : y - 10 * scale} // Positioned above the point
                textAnchor="middle"
                fill={THEME.colors.textPrimary}
                fontSize={`${12 * scale}px`}
                fontWeight={600}
                opacity={labelsOpacity}
                textShadow="0 1px 3px rgba(0,0,0,0.6)" // Rule: Labels de valor
              >
                {formatNumber(d.value)}
              </text>
            );
          })}
        </g>
      </g>
    </svg>
  );
};
