import React from "react";
import {
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme"; // Import THEME as per rules

// Spring Configurations - As per rules
const SPRING_CONFIG_MAIN = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // allows slight bounce
};

const SPRING_CONFIG_LABELS = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true, // no bounce
};

const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

// Interface for data passed to the component
export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

// Interface for component props
export interface PieChartProps {
  data: PieChartData[];
  title?: string;
}

// Helper component for empty state
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: THEME.colors.text.light,
      fontSize: 24,
      fontFamily: THEME.fontFamily,
      backgroundColor: THEME.colors.background.dark,
    }}
  >
    {message}
  </div>
);

// Helper function for number formatting (k/M)
const formatNumber = (num: number): string => {
  // Protection against NaN or non-finite numbers
  if (!Number.isFinite(num)) return "N/A";
  if (num === 0) return "0";
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1_000_000) {
    return `${sign}${(absNum / 1_000_000).toFixed(1)}M`;
  }
  if (absNum >= 1_000) {
    return `${sign}${(absNum / 1_000).toFixed(1)}k`;
  }
  return `${sign}${absNum.toLocaleString()}`;
};

// Helper for polar to cartesian coordinates
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  // Protect against NaN
  const safeRadius = isNaN(radius) ? 0 : radius;
  return {
    x: centerX + safeRadius * Math.cos(angleInRadians),
    y: centerY + safeRadius * Math.sin(angleInRadians),
  };
};

// Helper for describing a donut arc path
const describeArc = (
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
  animatedProgress: number // Animation progress from 0 to 1
) => {
  // Ensure angles and radii are finite and non-NaN, and positive for radii
  const safeX = isNaN(x) ? 0 : x;
  const safeY = isNaN(y) ? 0 : y;
  const safeOuterRadius = isNaN(outerRadius) || outerRadius < 0 ? 0 : outerRadius;
  const safeInnerRadius = isNaN(innerRadius) || innerRadius < 0 ? 0 : innerRadius;
  const safeStartAngle = isNaN(startAngle) ? 0 : startAngle;
  const safeEndAngle = isNaN(endAngle) ? 0 : endAngle;

  const currentEndAngle = interpolate(
    animatedProgress,
    [0, 1],
    [safeStartAngle, safeEndAngle],
    { extrapolateRight: "clamp" }
  );

  // If the slice is too small or invalid radii, don't draw
  if (currentEndAngle <= safeStartAngle + 0.001 || safeOuterRadius <= safeInnerRadius || safeOuterRadius === 0) {
    return "";
  }

  const startOuter = polarToCartesian(safeX, safeY, safeOuterRadius, safeStartAngle);
  const endOuter = polarToCartesian(safeX, safeY, safeOuterRadius, currentEndAngle);
  const startInner = polarToCartesian(safeX, safeY, safeInnerRadius, safeStartAngle);
  const endInner = polarToCartesian(safeX, safeY, safeInnerRadius, currentEndAngle);

  // largeArcFlag for angles greater than 180 degrees
  const largeArcFlag = currentEndAngle - safeStartAngle <= 180 ? "0" : "1";

  // SVG path commands for a donut segment
  const path = [
    "M", startOuter.x, startOuter.y, // Move to start of outer arc
    "A", safeOuterRadius, safeOuterRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y, // Outer arc (sweep flag 1 for clockwise)
    "L", endInner.x, endInner.y, // Line from end of outer arc to end of inner arc
    "A", safeInnerRadius, safeInnerRadius, 0, largeArcFlag, 0, startInner.x, startInner.y, // Inner arc (sweep flag 0 for counter-clockwise)
    "Z", // Close path
  ].join(" ");
  
  // Protect against NaN in generated path string
  if (path.includes('NaN')) {
      return '';
  }
  return path;
};

export const PieChart: React.FC<PieChartProps> = ({ data = [], title = "" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Scale calculations for responsive canvas (default 1920x1080)
  const defaultWidth = 1920;
  const defaultHeight = 1080;
  const scale = Math.min(width / defaultWidth, height / defaultHeight);

  // Plot area dimensions - apply minimum padding
  const basePadding = 40;
  const titleExtraPadding = title ? 24 : 0;
  const effectivePaddingTop = (basePadding + titleExtraPadding) * scale;
  const effectivePaddingSide = basePadding * scale;
  const effectivePaddingBottom = basePadding * scale;

  // Center of the SVG canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Donut radius based on the smaller dimension of the available plot area, scaled
  const plotWidth = width - 2 * effectivePaddingSide;
  const plotHeight = height - effectivePaddingTop - effectivePaddingBottom;
  const minDimension = Math.min(plotWidth, plotHeight);

  // Rule: Raio do donut: 35–40% da menor dimensão
  const donutRadiusRatio = 0.38; // Using ~38% as a midpoint
  const outerRadius = Math.max(0, (minDimension / 2) * donutRadiusRatio);

  // Rule: Donut: buraco interno = 50% do raio externo
  const innerRadius = Math.max(0, outerRadius * 0.5);

  // Data validation and processing
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState message="No data available for Pie Chart." />;
  }

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Calculate angles, percentages, and animation progress for each slice
  let currentAngle = 0; // Starting angle for the first slice (top-center)
  const chartData = data.map((item, index) => {
    const safeValue = Math.max(0, item.value); // Ensure positive value
    // Protect against division by zero for percentage calculation
    const percentage = totalValue > 0 ? (safeValue / totalValue) * 100 : 0;
    
    // Ensure angles are finite
    const startAngle = isNaN(currentAngle) ? 0 : currentAngle;
    const endAngle = isNaN(percentage) ? currentAngle : currentAngle + (percentage / 100) * 360;
    currentAngle = endAngle;

    // Use provided color or default from theme's charts palette
    const color = item.color || THEME.colors.charts[index % THEME.colors.charts.length];

    // Animation timing for each slice (staggered entry)
    const staggerDelay = index * 8; // 8 frames stagger as per reference
    const animationStartFrame = 10 + staggerDelay; // Animation not starting on frame 0
    const animationDuration = 60; // 60 frames for sweep animation
    const animationEndFrame = animationStartFrame + animationDuration;

    const animatedProgress = spring({
      frame: frame - animationStartFrame,
      config: SPRING_CONFIG_MAIN,
      fps: 30,
      durationInFrames: animationDuration,
      delay: 0, // Delay already handled in animationStartFrame
    });

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color,
      animatedProgress,
      animationEndFrame,
    };
  });

  // Determine when the last slice animation finishes to start total label fade
  const lastSliceAnimationEndFrame = Math.max(...chartData.map(d => d.animationEndFrame));
  const totalLabelFadeInStart = lastSliceAnimationEndFrame + 10; // 10 frames delay after last slice finishes
  const totalLabelFadeInDuration = 20; // 20 frames for fade
  
  const totalLabelOpacity = spring({
    frame: frame - totalLabelFadeInStart,
    config: SPRING_CONFIG_LABELS,
    fps: 30,
    durationInFrames: totalLabelFadeInDuration,
    delay: 0,
  });

  const totalLabelScale = interpolate(
    totalLabelOpacity, // Use opacity as base for scale, ensures start/end match
    [0, 1],
    [0.8, 1], // Scales from 80% to 100%
    { extrapolateRight: "clamp" }
  );

  // Title animation (fade and scale in early)
  const titleAnimationStart = 0;
  const titleAnimationDuration = 20;
  const titleOpacity = spring({
    frame: frame - titleAnimationStart,
    config: SPRING_CONFIG_SUBTLE,
    fps: 30,
    durationInFrames: titleAnimationDuration,
    delay: 0,
  });
  const titleScale = interpolate(titleOpacity, [0, 1], [0.8, 1], { extrapolateRight: "clamp" });

  // Label positioning and sizing
  const LABEL_OFFSET = 20 * scale; // Distance for external labels from outer radius
  const FONT_SIZE_LABELS = Math.round(12 * scale); // 11-13px as per rules
  const FONT_SIZE_TOTAL = Math.round(24 * scale); // Larger for total value
  const MIN_SLICE_PERCENTAGE_FOR_LABEL = 5; // Rule: show label only if fatia > 5%

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: THEME.colors.background.dark,
        fontFamily: THEME.fontFamily,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background rectangle to ensure a consistent background color for the canvas */}
        <rect x={0} y={0} width={width} height={height} fill={THEME.colors.background.dark} />

        {title && (
          <text
            x={centerX}
            y={effectivePaddingTop - 24 * scale} // Position title relative to top padding
            textAnchor="middle"
            dominantBaseline="auto"
            fontSize={Math.round(18 * scale)} // 18-22px, weight 700
            fontWeight={700}
            fill={THEME.colors.text.light}
            opacity={titleOpacity}
            // Apply transform via style for better control over origin
            style={{
                transform: `scale(${titleScale})`,
                transformBox: 'fill-box',
                transformOrigin: `${centerX}px ${effectivePaddingTop - 24 * scale}px`, // Scale from its own center
                textShadow: "0 1px 3px rgba(0,0,0,0.6)", // As per rules
            }}
          >
            {title}
          </text>
        )}

        {/* Donut Slices */}
        {Array.isArray(chartData) && chartData.map((item, index) => {
          const pathD = describeArc(
            centerX,
            centerY,
            outerRadius,
            innerRadius, // Use the calculated innerRadius
            item.startAngle,
            item.endAngle,
            item.animatedProgress
          );

          // Path will be an empty string if invalid or not animated yet.
          // No need for explicit NaN check here if describeArc handles it.
          // However, for extra robustness, a final check on pathD is good.
          const safePathD = pathD.includes('NaN') ? '' : pathD;

          return (
            <g key={item.label + index}>
              <path
                d={safePathD}
                fill={item.color}
                // Opacity also animates with the sweep of the slice
                opacity={interpolate(item.animatedProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" })}
              />
              {/* External Labels for slices */}
              {/* Labels appear when slice is halfway animated and meets size threshold */}
              {item.percentage >= MIN_SLICE_PERCENTAGE_FOR_LABEL && (
                <text
                  x={
                    polarToCartesian(
                      centerX,
                      centerY,
                      outerRadius + LABEL_OFFSET,
                      item.startAngle + (item.endAngle - item.startAngle) / 2 // Mid-angle for label position
                    ).x
                  }
                  y={
                    polarToCartesian(
                      centerX,
                      centerY,
                      outerRadius + LABEL_OFFSET,
                      item.startAngle + (item.endAngle - item.startAngle) / 2
                    ).y
                  }
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={FONT_SIZE_LABELS}
                  fontWeight={600}
                  fill={THEME.colors.text.light}
                  style={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.6)", // As per rules
                  }}
                  // Label fades in after a certain progress of the slice animation
                  opacity={interpolate(item.animatedProgress, [0.5, 1], [0, 1], { extrapolateRight: "clamp" })}
                >
                  {/* Truncate text if too long (max 12 chars + ...) */}
                  {`${item.label.length > 12 ? item.label.substring(0, 9) + '...' : item.label} (${item.percentage.toFixed(1)}%)`}
                </text>
              )}
            </g>
          );
        })}

        {/* Total Value in the center of the donut hole */}
        {totalValue > 0 && (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={FONT_SIZE_TOTAL}
            fontWeight={700}
            fill={THEME.colors.text.light}
            opacity={totalLabelOpacity}
            // Scale and fade from center of the donut hole
            style={{
                transform: `scale(${totalLabelScale})`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
                textShadow: "0 1px 3px rgba(0,0,0,0.6)", // As per rules
            }}
          >
            {formatNumber(totalValue)}
          </text>
        )}
      </svg>
    </div>
  );
};
