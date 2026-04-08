import React from "react";
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  type InterpolateConfig,
  Easing,
} from "remotion";
import { THEME } from "../theme"; // Adjust path as necessary
import type { CSSProperties } from "react";

// --- Spring Configurations ---
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

// --- Interfaces ---
interface SeriesData {
  label: string;
  color: string;
  data: number[];
}

interface MultiLineChartProps {
  series: SeriesData[];
  labels: string[];
  title?: string;
  showLegend?: boolean;
  durationInFrames?: number;
}

// --- Constants ---
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const PADDING_X_BASE = 80;
const PADDING_Y_BASE = 60;
const TITLE_OFFSET_Y_BASE = 24;
const X_AXIS_LABEL_OFFSET_Y_BASE = 32;
const Y_AXIS_LABEL_OFFSET_X_BASE = 10;
const LINE_STROKE_WIDTH_BASE = 2.5;
const DOT_RADIUS_BASE = 6;
const LINE_STAGGER_DELAY_FRAMES = 10;
const GRID_COLOR = THEME.gridColor; // rgba(255,255,255,0.08)
const ZERO_BASELINE_COLOR = THEME.zeroBaselineColor; // rgba(255,255,255,0.25)

// --- Helper Functions ---
const formatNumber = (value: number, isCurrency = false, isPercentage = false): string => {
  if (isNaN(value)) {
    return "";
  }
  const absValue = Math.abs(value);
  let formatted: string;

  if (isPercentage) {
    formatted = `${(value * 100).toFixed(1)}%`;
  } else if (absValue < 1000) {
    formatted = value.toFixed(0);
  } else if (absValue < 1_000_000) {
    formatted = `${(value / 1000).toFixed(1)}k`;
  } else {
    formatted = `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (isCurrency) {
    return `${value < 0 ? "-" : ""}R$ ${formatted.replace(/^-/, "")}`;
  }
  return formatted;
};

// --- Component ---
export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  series: initialSeries = [],
  labels: initialLabels = [],
  title = "",
  showLegend = true,
  durationInFrames = 90,
}) => {
  const frame = useCurrentFrame();
  const { width: videoWidth, height: videoHeight } = useVideoConfig();

  // Calculate scale based on standard resolution
  const scale = Math.min(videoWidth / BASE_WIDTH, videoHeight / BASE_HEIGHT);

  const paddingX = PADDING_X_BASE * scale;
  const paddingY = PADDING_Y_BASE * scale;
  const titleOffsetY = TITLE_OFFSET_Y_BASE * scale;
  const xAxisLabelOffsetY = X_AXIS_LABEL_OFFSET_Y_BASE * scale;
  const yAxisLabelOffsetX = Y_AXIS_LABEL_OFFSET_X_BASE * scale;
  const lineStrokeWidth = LINE_STROKE_WIDTH_BASE * scale;
  const dotRadius = DOT_RADIUS_BASE * scale;

  // Robustness: ensure data is an array
  const series = Array.isArray(initialSeries) ? initialSeries : [];
  const labels = Array.isArray(initialLabels) ? initialLabels : [];

  if (series.length === 0 || labels.length === 0 || series[0].data.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 24 * scale,
          color: THEME.textColor,
          backgroundColor: THEME.backgroundColor,
        }}
      >
        Sem dados para exibir o gráfico.
      </div>
    );
  }

  const plotWidth = videoWidth - 2 * paddingX;
  const plotHeight = videoHeight - 2 * paddingY - (title ? titleOffsetY : 0) - xAxisLabelOffsetY;

  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(...allValues, 0); // Ensure min 0 for scale
  const minValue = Math.min(...allValues, 0); // Allow negative values

  // For y-axis, we always start at 0, unless all values are negative.
  // In that case, we will adapt to show the negative range from the top.
  const effectiveMinValue = Math.min(0, minValue);
  const effectiveMaxValue = maxValue;
  const valueRange = effectiveMaxValue - effectiveMinValue;

  // Protect against division by zero if all values are identical or zero
  const yScale = valueRange > 0 ? plotHeight / valueRange : 0;
  const xScale = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;

  // Calculate Y position for a given value
  const getY = (value: number) => {
    // If all values are positive, 0 is at plotHeight.
    // If values are negative, 0 is higher up, and lowest negative value is at plotHeight.
    // So, it's (effectiveMaxValue - value) * yScale + (offset for min value if negative)
    return (effectiveMaxValue - value) * yScale + (title ? paddingY + titleOffsetY : paddingY);
  };

  const getX = (index: number) => paddingX + index * xScale;

  // Y-axis grid lines and labels
  const numGridLines = 5;
  const gridStep = valueRange / numGridLines;

  // Clip path ID
  const clipPathId = "plot-area-clip";

  return (
    <svg width={videoWidth} height={videoHeight} viewBox={`0 0 ${videoWidth} ${videoHeight}`}>
      {/* Background */}
      <rect x="0" y="0" width={videoWidth} height={videoHeight} fill={THEME.backgroundColor} />

      {/* Title */}
      {title && (
        <text
          x={videoWidth / 2}
          y={paddingY + titleOffsetY / 2}
          textAnchor="middle"
          fill={THEME.textColor}
          fontSize={18 * scale}
          fontWeight={700}
          fontFamily="'Inter', 'Helvetica Neue', sans-serif"
          style={{
            opacity: interpolate(
              frame,
              [0, 20],
              [0, 1],
              { extrapolateRight: "clamp" }
            ),
          }}
        >
          {title}
        </text>
      )}

      {/* Clip path definition for the plot area */}
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={paddingX}
            y={title ? paddingY + titleOffsetY : paddingY}
            width={plotWidth}
            height={plotHeight}
          />
        </clipPath>
      </defs>

      {/* Y-axis Grid Lines and Labels */}
      {Array.from({ length: numGridLines + 1 }).map((_, i) => {
        const value = effectiveMinValue + i * gridStep;
        const y = getY(value);
        const isZeroBaseline = Math.abs(value) < (gridStep / 10); // Check if close to zero

        const lineOpacity = spring({
          frame: frame - 10, // Animate after initial respiro
          config: SPRING_CONFIG_SUBTLE,
          from: 0,
          to: 1,
          durationInFrames: 30,
        });

        const textOpacity = spring({
          frame: frame - 20, // Animate labels slightly later
          config: SPRING_CONFIG_LABELS,
          from: 0,
          to: 1,
          durationInFrames: 30,
        });

        // Protection against NaN in SVG attributes
        const safeY = isNaN(y) ? 0 : y;

        return (
          <React.Fragment key={`grid-${i}`}>
            <line
              x1={paddingX}
              y1={safeY}
              x2={paddingX + plotWidth}
              y2={safeY}
              stroke={isZeroBaseline ? ZERO_BASELINE_COLOR : GRID_COLOR}
              strokeWidth={1 * scale}
              strokeDasharray="4 4"
              opacity={lineOpacity}
            />
            <text
              x={paddingX - yAxisLabelOffsetX}
              y={safeY + (4 * scale)} // Adjust for vertical alignment
              textAnchor="end"
              fill={THEME.axisLabelColor}
              fontSize={11 * scale}
              fontFamily="'Inter', 'Helvetica Neue', sans-serif"
              opacity={textOpacity}
            >
              {formatNumber(value)}
            </text>
          </React.Fragment>
        );
      })}

      {/* X-axis Labels */}
      {Array.isArray(labels) && labels.map((label, i) => {
        const x = getX(i);
        const y = (title ? paddingY + titleOffsetY : paddingY) + plotHeight + xAxisLabelOffsetY / 2;

        const textOpacity = spring({
          frame: frame - 30,
          config: SPRING_CONFIG_LABELS,
          from: 0,
          to: 1,
          durationInFrames: 30,
        });

        // Protection against NaN in SVG attributes
        const safeX = isNaN(x) ? 0 : x;
        const safeY = isNaN(y) ? 0 : y;

        return (
          <text
            key={`x-label-${i}`}
            x={safeX}
            y={safeY}
            textAnchor="middle"
            fill={THEME.axisLabelColor}
            fontSize={11 * scale}
            fontFamily="'Inter', 'Helvetica Neue', sans-serif"
            opacity={textOpacity}
          >
            {label}
          </text>
        );
      })}

      {/* Lines, Dots, and Inline Labels */}
      {Array.isArray(series) &&
        series.map((s, seriesIndex) => {
          const pathPoints = Array.isArray(s.data)
            ? s.data.map((val, i) => `${getX(i)},${getY(val)}`)
            : [];

          if (pathPoints.length < 2) {
            return null; // Need at least two points to draw a line
          }

          // Generate a smooth SVG path string (cubic bezier)
          const getSmoothPathD = (points: string[]): string => {
            if (points.length === 0) return "";
            if (points.length === 1) return `M ${points[0]}`;

            let path = `M ${points[0]}`;
            for (let i = 0; i < points.length - 1; i++) {
              const p1 = points[i].split(",").map(Number);
              const p2 = points[i + 1].split(",").map(Number);

              // Control points for cubic bezier spline
              // A common way to approximate is to use a fraction of the distance between points
              // as tangents, often pointing towards the next point.
              // For simplicity, a direct connection might be 'L' or if smooth required,
              // calculate control points. Remotion's cubic bezier rule means we must curve.
              // A simple approximation for C command:
              // C x1 y1, x2 y2, x y
              // p1.x + (p2.x - p1.x)/2, p1.y
              // p1.x + (p2.x - p1.x)/2, p2.y
              // For now, let's use a simpler cubic bezier based on midpoint.
              // A more robust implementation would involve calculating actual tangents.
              const cp1x = p1[0] + (p2[0] - p1[0]) * 0.3;
              const cp1y = p1[1];
              const cp2x = p1[0] + (p2[0] - p1[0]) * 0.7;
              const cp2y = p2[1];

              path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
            }
            return path;
          };

          const pathD = getSmoothPathD(pathPoints);

          const totalLength = pathD
            ? document.createElementNS("http://www.w3.org/2000/svg", "path").setAttribute("d", pathD) ||
              (document.createElementNS("http://www.w3.org/2000/svg", "path").getTotalLength() || 0) // Fallback for headless testing
            : 0;

          // Stagger animation start for each line
          const lineAnimationStartFrame = 10 + seriesIndex * LINE_STAGGER_DELAY_FRAMES;
          const lineAnimationEndFrame = lineAnimationStartFrame + 50; // Total 50 frames for line draw

          const lineProgress = spring({
            frame: frame - lineAnimationStartFrame,
            config: SPRING_CONFIG_MAIN,
            from: 0,
            to: 1,
            durationInFrames: lineAnimationEndFrame - lineAnimationStartFrame,
          });

          const strokeDashoffset = interpolate(
            lineProgress,
            [0, 1],
            [totalLength, 0],
            { extrapolateRight: "clamp" }
          );

          // Dot animation (scale)
          const dotAnimationStartFrame = lineAnimationStartFrame + 30; // Dots appear after line is mostly drawn
          const dotScale = (index: number) =>
            spring({
              frame: frame - dotAnimationStartFrame - index * 2, // Stagger dot appearance
              config: SPRING_CONFIG_LABELS,
              from: 0,
              to: 1,
              durationInFrames: 20,
            });

          // Label animation (fade-in)
          const labelAnimationStartFrame = lineAnimationStartFrame + 40; // Labels appear after dots
          const labelOpacity = (index: number) =>
            spring({
              frame: frame - labelAnimationStartFrame - index * 2,
              config: SPRING_CONFIG_LABELS,
              from: 0,
              to: 1,
              durationInFrames: 20,
            });

          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              <path
                d={pathD}
                stroke={s.color}
                strokeWidth={lineStrokeWidth}
                fill="none"
                strokeDasharray={totalLength}
                strokeDashoffset={strokeDashoffset}
                clipPath={`url(#${clipPathId})`} // Apply clip path
              />

              {/* Render dots for each data point */}
              {s.data.map((value, dataIndex) => {
                const cx = getX(dataIndex);
                const cy = getY(value);

                // Protection against NaN in SVG attributes
                const safeCx = isNaN(cx) ? 0 : cx;
                const safeCy = isNaN(cy) ? 0 : cy;

                return (
                  <React.Fragment key={`dot-${seriesIndex}-${dataIndex}`}>
                    <circle
                      cx={safeCx}
                      cy={safeCy}
                      r={dotRadius}
                      fill={s.color}
                      transformOrigin={`${safeCx}px ${safeCy}px`}
                      transform={`scale(${dotScale(dataIndex)})`}
                      clipPath={`url(#${clipPathId})`}
                    />
                    {/* Inline Labels (show only when <= 3 series) */}
                    {series.length <= 3 && (
                      <text
                        x={safeCx}
                        y={safeCy - dotRadius - (5 * scale)} // Position above dot
                        textAnchor="middle"
                        fill={THEME.dataLabelColor}
                        fontSize={11 * scale}
                        fontWeight={600}
                        fontFamily="'Inter', 'Helvetica Neue', sans-serif"
                        opacity={labelOpacity(dataIndex)}
                        style={{
                          textShadow: `0 ${1 * scale}px ${3 * scale}px rgba(0,0,0,0.6)`,
                        }}
                        clipPath={`url(#${clipPathId})`}
                      >
                        {formatNumber(value)}
                      </text>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

      {/* Legend */}
      {showLegend && (
        <g transform={`translate(${videoWidth - paddingX - 100 * scale}, ${paddingY})`}>
          {Array.isArray(series) &&
            series.map((s, seriesIndex) => {
              const legendAnimationStartFrame = 60 + seriesIndex * LINE_STAGGER_DELAY_FRAMES / 2; // Appear slightly after lines
              const legendOpacity = spring({
                frame: frame - legendAnimationStartFrame,
                config: SPRING_CONFIG_LABELS,
                from: 0,
                to: 1,
                durationInFrames: 20,
              });

              return (
                <g
                  key={`legend-${seriesIndex}`}
                  transform={`translate(0, ${seriesIndex * 20 * scale})`}
                  opacity={legendOpacity}
                >
                  <rect x="0" y="0" width={12 * scale} height={12 * scale} fill={s.color} />
                  <text
                    x={18 * scale}
                    y={9 * scale}
                    fill={THEME.legendColor}
                    fontSize={12 * scale}
                    fontFamily="'Inter', 'Helvetica Neue', sans-serif"
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
        </g>
      )}
    </svg>
  );
};
