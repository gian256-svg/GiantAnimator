import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";
import { THEME } from "../theme"; // Assuming theme.ts is in the parent directory

// --- Constants & Configurations ---
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

const MARGIN_TOP = 100; // Extra margin for title, etc.
const MARGIN_BOTTOM = 100; // Extra for X-axis labels
const MARGIN_LEFT = 100; // For Y-axis labels
const MARGIN_RIGHT = 60; // For padding

const PLOT_PADDING_HORIZONTAL = 40; // Internal padding for the chart lines
const PLOT_PADDING_VERTICAL = 20;

const LINE_STROKE_WIDTH = 3.5;
const LEGEND_ITEM_HEIGHT = 20;
const LEGEND_SPACING = 10;
const LEGEND_ICON_SIZE = 16;

const ANIMATION_START_FRAME = 10; // Start lines animation after initial delay
const ANIMATION_END_FRAME = 70; // Lines finish drawing
const LABELS_FADE_IN_START = 60; // Labels start fading in
const LABELS_FADE_IN_END = 80; // Labels finish fading in

const SERIES_STAGGER_DELAY = 8; // Frames delay between each line's animation start

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
  overshootClamping: true,
};

const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

// --- Helper Functions ---
const formatNumber = (num: number): string => {
  if (num === 0) return "0";
  if (Math.abs(num) < 1000) return num.toFixed(0);
  if (Math.abs(num) < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
};

// --- Interfaces ---
interface SeriesData {
  label: string;
  color?: string; // Optional custom color
  data: number[];
}

interface MultiLineChartProps {
  series: SeriesData[];
  labels: string[]; // X-axis labels
  title?: string;
  showLegend?: boolean;
}

// --- Component ---
export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  series: rawSeries,
  labels: rawLabels,
  title,
  showLegend = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const scale = Math.min(width / VIDEO_WIDTH, height / VIDEO_HEIGHT);

  // Apply default values and robustness checks
  const series = Array.isArray(rawSeries) ? rawSeries : [];
  const labels = Array.isArray(rawLabels) ? rawLabels : [];

  if (series.length === 0 || labels.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 30 * scale,
          color: THEME.colors.text,
          fontFamily: THEME.fontFamily,
        }}
      >
        No data to display for Multi-Line Chart.
      </div>
    );
  }

  // Calculate dimensions based on scaled video config
  const chartWidth = VIDEO_WIDTH;
  const chartHeight = VIDEO_HEIGHT;

  const plotAreaWidth = chartWidth - MARGIN_LEFT - MARGIN_RIGHT;
  const plotAreaHeight = chartHeight - MARGIN_TOP - MARGIN_BOTTOM;

  const innerPlotWidth = plotAreaWidth - PLOT_PADDING_HORIZONTAL * 2;
  const innerPlotHeight = plotAreaHeight - PLOT_PADDING_VERTICAL * 2;

  // Find max value across all series for Y-axis scaling
  let maxValue = 0;
  series.forEach((s) => {
    s.data.forEach((val) => {
      if (val > maxValue) {
        maxValue = val;
      }
    });
  });

  // Ensure max value is positive to avoid division by zero
  if (maxValue <= 0) maxValue = 1; // Fallback to 1 to prevent division by zero

  // Y-axis ticks and labels
  const numYAxisTicks = 5;
  const yAxisLabels = Array.from({ length: numYAxisTicks + 1 }).map((_, i) => {
    const value = (maxValue / numYAxisTicks) * i;
    return {
      value,
      y:
        plotAreaHeight -
        (value / maxValue) * innerPlotHeight -
        PLOT_PADDING_VERTICAL,
    };
  });

  // X-axis label positions
  const labelXPositions = labels.map((_, i) => {
    // Distribute X labels evenly across the inner plot width
    const segmentWidth = labels.length > 1 ? innerPlotWidth / (labels.length - 1) : 0;
    return PLOT_PADDING_HORIZONTAL + i * segmentWidth;
  });


  // Pre-calculate points and path 'd' attribute for each series
  const seriesWithPoints = series.map((s, seriesIndex) => {
    const color = s.color || THEME.chartColors[seriesIndex % THEME.chartColors.length];
    const points = s.data.map((val, i) => {
      const x = labelXPositions[i];
      const y =
        plotAreaHeight -
        (val / maxValue) * innerPlotHeight -
        PLOT_PADDING_VERTICAL;
      return { x, y: isNaN(y) ? 0 : y }; // Protect against NaN
    });

    const d =
      "M" +
      points
        .map((p) => `${p.x},${p.y}`)
        .join(" L ");

    return { ...s, color, points, d };
  });

  // Animation for chart entrance (fade in the whole chart)
  const chartOpacity = interpolate(
    frame,
    [0, ANIMATION_START_FRAME],
    [0, 1],
    {
      extrapolateRight: "clamp",
    }
  );

  // Title Animation
  const titleOpacity = spring({
    frame: frame - (ANIMATION_START_FRAME / 2),
    config: SPRING_CONFIG_SUBTLE,
    durationInFrames: 30,
  });
  const titleTranslateY = interpolate(titleOpacity, [0, 1], [-20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIDEO_WIDTH} ${VIDEO_HEIGHT}`}
      style={{ fontFamily: THEME.fontFamily, backgroundColor: THEME.colors.background }}
    >
      <defs>
        <clipPath id="plotAreaClip">
          <rect
            x={MARGIN_LEFT + PLOT_PADDING_HORIZONTAL}
            y={MARGIN_TOP + PLOT_PADDING_VERTICAL}
            width={innerPlotWidth}
            height={innerPlotHeight}
            rx={4}
            ry={4}
          />
        </clipPath>
      </defs>

      <g
        transform={`scale(${scale})`}
        style={{ opacity: chartOpacity }}
      >
        {/* Title */}
        {title && (
          <text
            x={chartWidth / 2}
            y={MARGIN_TOP / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={THEME.fontSizes.title} // Use theme font size
            fontWeight={THEME.fontWeights.title}
            fill={THEME.colors.title}
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleTranslateY}px)`,
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {title}
          </text>
        )}

        {/* Plot Area Background */}
        <rect
          x={MARGIN_LEFT}
          y={MARGIN_TOP}
          width={plotAreaWidth}
          height={plotAreaHeight}
          fill="rgba(255,255,255,0.02)"
          rx={8}
          ry={8}
        />

        {/* Y-axis Grid Lines & Labels */}
        {yAxisLabels.map((label, i) => {
          const yPos = MARGIN_TOP + label.y;
          const isZeroLine = i === 0; // The first label is typically 0 for positive charts

          const lineOpacityProgress = spring({
            frame: frame - (ANIMATION_START_FRAME / 2),
            config: SPRING_CONFIG_SUBTLE,
            durationInFrames: 30,
          });

          const labelOpacityProgress = spring({
            frame: frame - LABELS_FADE_IN_START,
            config: SPRING_CONFIG_LABELS,
            durationInFrames: 30,
          });

          const labelScale = interpolate(labelOpacityProgress, [0, 1], [0.8, 1], {
            extrapolateRight: "clamp",
          });

          return (
            <React.Fragment key={`y-label-${i}`}>
              <line
                x1={MARGIN_LEFT + PLOT_PADDING_HORIZONTAL}
                y1={yPos}
                x2={MARGIN_LEFT + plotAreaWidth - PLOT_PADDING_HORIZONTAL}
                y2={yPos}
                stroke={isZeroLine ? THEME.colors.gridZeroLine : THEME.colors.gridLine}
                strokeDasharray={isZeroLine ? "none" : "4 4"}
                strokeWidth={isZeroLine ? 1.5 : 1}
                opacity={lineOpacityProgress}
              />
              <text
                x={MARGIN_LEFT - 10} // Padding from the grid
                y={yPos}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={THEME.fontSizes.axisLabel}
                fill={THEME.colors.axisLabel}
                opacity={labelOpacityProgress}
                transform={`scale(${labelScale})`}
                transform-origin={`${MARGIN_LEFT - 10}px ${yPos}px`}
              >
                {formatNumber(label.value)}
              </text>
            </React.Fragment>
          );
        })}

        {/* X-axis Labels */}
        {Array.isArray(labels) && labels.map((label, i) => {
          const xPos = MARGIN_LEFT + labelXPositions[i];
          const yPos = MARGIN_TOP + plotAreaHeight + 15; // Below the plot area

          const labelOpacityProgress = spring({
            frame: frame - LABELS_FADE_IN_START,
            config: SPRING_CONFIG_LABELS,
            durationInFrames: 30,
          });

          const labelScale = interpolate(labelOpacityProgress, [0, 1], [0.8, 1], {
            extrapolateRight: "clamp",
          });

          return (
            <text
              key={`x-label-${i}`}
              x={xPos}
              y={yPos}
              textAnchor="middle"
              dominantBaseline="hanging"
              fontSize={THEME.fontSizes.axisLabel}
              fill={THEME.colors.axisLabel}
              opacity={labelOpacityProgress}
              transform={`scale(${labelScale})`}
              transform-origin={`${xPos}px ${yPos}px`}
            >
              {label}
            </text>
          );
        })}

        {/* Lines */}
        <g clipPath="url(#plotAreaClip)">
          {Array.isArray(seriesWithPoints) && seriesWithPoints.map((s, seriesIndex) => {
            if (!Array.isArray(s.points) || s.points.length === 0) return null;

            // Approximate path length for strokeDashoffset animation
            // This needs to be a value large enough to cover any possible path length
            // A common heuristic is innerPlotWidth * 1.5 to account for diagonal segments
            const approximatePathLength = innerPlotWidth * 1.5; 

            const drawProgress = spring({
              frame: frame - (ANIMATION_START_FRAME + seriesIndex * SERIES_STAGGER_DELAY),
              config: SPRING_CONFIG_MAIN,
              durationInFrames: ANIMATION_END_FRAME - ANIMATION_START_FRAME, // Use full duration, stagger managed by `frame`
            });

            const strokeDashoffset = interpolate(
              drawProgress,
              [0, 1],
              [approximatePathLength, 0],
              {
                extrapolateRight: "clamp",
              }
            );

            return (
              <path
                key={`line-${seriesIndex}`}
                d={s.d}
                transform={`translate(${MARGIN_LEFT}, ${MARGIN_TOP})`}
                fill="none"
                stroke={s.color}
                strokeWidth={LINE_STROKE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={approximatePathLength}
                strokeDashoffset={strokeDashoffset}
                opacity={drawProgress} // Line itself fades in with drawing
              />
            );
          })}
        </g>

        {/* Legend */}
        {showLegend && (
          <g
            transform={`translate(${chartWidth - MARGIN_RIGHT - 180}, ${MARGIN_TOP + PLOT_PADDING_VERTICAL})`}
          >
            {Array.isArray(seriesWithPoints) && seriesWithPoints.map((s, seriesIndex) => {
              const legendEntranceProgress = spring({
                frame: frame - (LABELS_FADE_IN_START + seriesIndex * SERIES_STAGGER_DELAY), // Stagger with line appearance
                config: SPRING_CONFIG_LABELS,
                durationInFrames: 30,
              });

              const legendOpacity = interpolate(
                legendEntranceProgress,
                [0, 1],
                [0, 1],
                {
                  extrapolateRight: "clamp",
                }
              );
              const legendTranslateY = interpolate(
                legendEntranceProgress,
                [0, 1],
                [-10, 0],
                {
                  extrapolateRight: "clamp",
                }
              );

              return (
                <g
                  key={`legend-item-${seriesIndex}`}
                  transform={`translate(0, ${seriesIndex * (LEGEND_ITEM_HEIGHT + LEGEND_SPACING)})`}
                  style={{
                    opacity: legendOpacity,
                    transform: `translateY(${legendTranslateY}px)`,
                  }}
                >
                  <rect
                    x={0}
                    y={LEGEND_ITEM_HEIGHT / 2 - LEGEND_ICON_SIZE / 2}
                    width={LEGEND_ICON_SIZE}
                    height={LEGEND_ICON_SIZE}
                    fill={s.color}
                    rx={2}
                    ry={2}
                  />
                  <text
                    x={LEGEND_ICON_SIZE + 10}
                    y={LEGEND_ITEM_HEIGHT / 2}
                    dominantBaseline="middle"
                    fontSize={THEME.fontSizes.legend}
                    fill={THEME.colors.legend}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
};
