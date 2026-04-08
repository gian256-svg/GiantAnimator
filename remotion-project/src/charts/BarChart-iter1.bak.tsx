import React from "react";
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { THEME } from "../theme";

// Animação principal — barras, linhas, áreas
const SPRING_CONFIG_MAIN = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

// Animação de labels — sem bounce
const SPRING_CONFIG_LABELS = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

// Animação sutil — linhas de grid, fade
const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data: rawData = [],
  title = "Bar Chart",
  showValues = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const data = Array.isArray(rawData) ? rawData : [];

  if (data.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: THEME.colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontFamily: THEME.fontFamily, color: THEME.colors.text }}>
          No data available
        </h1>
      </AbsoluteFill>
    );
  }

  const chartPadding = 80;
  const plotWidth = width - chartPadding * 2;
  const plotHeight = height - chartPadding * 2 - 60; // Extra space for title

  const maxValue = Math.max(...data.map((d) => d.value));
  const barGap = 0.4; // 40% gap
  const barWidthRatio = 1 - barGap; // 60% bar width

  const categoryWidth = plotWidth / data.length;
  const barWidth = categoryWidth * barWidthRatio;

  const yAxisLabelCount = 5;
  const yAxisStep = maxValue / (yAxisLabelCount - 1);

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const entranceProgress = spring({
    frame: frame - 10,
    fps,
    config: SPRING_CONFIG_SUBTLE,
  });

  const titleScale = interpolate(entranceProgress, [0, 1], [0.8, 1], {
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(entranceProgress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      {/* Title */}
      <h1
        style={{
          fontFamily: THEME.fontFamily,
          color: THEME.colors.text,
          fontSize: 22,
          fontWeight: 700,
          position: "absolute",
          top: chartPadding / 2,
          left: chartPadding,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          transformOrigin: "bottom left",
        }}
      >
        {title}
      </h1>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradient for bars */}
          {Array.isArray(data) &&
            data.map((_, index) => {
              const barColor = THEME.colors.series[index % THEME.colors.series.length];
              return (
                <linearGradient
                  key={`barGradient-${index}`}
                  id={`barGradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={barColor} stopOpacity={0.7} />
                </linearGradient>
              );
            })}
        </defs>

        <g transform={`translate(${chartPadding}, ${chartPadding + 60})`}>
          {/* Y-axis Grid Lines and Labels */}
          {Array.from({ length: yAxisLabelCount }).map((_, i) => {
            const yValue = i * yAxisStep;
            const y = plotHeight - (yValue / maxValue) * plotHeight;
            const safeY = isNaN(y) ? 0 : y;

            const gridLineProgress = spring({
              frame: frame - 20 - i * 3, // Stagger grid lines
              fps,
              config: SPRING_CONFIG_SUBTLE,
              durationInFrames: 30,
            });

            const gridLineOpacity = interpolate(gridLineProgress, [0, 1], [0, 1], {
              extrapolateRight: "clamp",
            });
            const gridLineTranslateY = interpolate(gridLineProgress, [0, 1], [20, 0], {
              extrapolateRight: "clamp",
            });

            return (
              <g
                key={`grid-line-${i}`}
                style={{
                  opacity: gridLineOpacity,
                  transform: `translateY(${gridLineTranslateY}px)`,
                }}
              >
                <line
                  x1={0}
                  y1={safeY}
                  x2={plotWidth}
                  y2={safeY}
                  stroke={
                    i === 0
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.08)"
                  }
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? "0" : "4 4"}
                />
                <text
                  x={-10}
                  y={safeY + 5}
                  textAnchor="end"
                  fontFamily={THEME.fontFamily}
                  fontSize={11}
                  fill={THEME.colors.axisLabel}
                >
                  {formatValue(yValue)}
                </text>
              </g>
            );
          })}

          {/* Bars and X-axis Labels */}
          {Array.isArray(data) &&
            data.map((item, index) => {
              const x = index * categoryWidth + (categoryWidth - barWidth) / 2;

              const barHeightScaleProgress = spring({
                frame: frame - 30 - index * 6, // Stagger animation for each bar
                fps,
                config: SPRING_CONFIG_MAIN,
                durationInFrames: 60,
              });

              const barHeightRaw = (item.value / maxValue) * plotHeight;
              const animatedBarHeight = interpolate(
                barHeightScaleProgress,
                [0, 1],
                [0, barHeightRaw],
                { extrapolateRight: "clamp" }
              );

              // Protect against division by zero and ensure min height for visibility
              const safeBarHeight =
                item.value > 0
                  ? Math.max(animatedBarHeight, 4)
                  : Math.min(animatedBarHeight, -4); // For negative values

              const barY = plotHeight - safeBarHeight;
              const safeY = isNaN(barY) ? 0 : barY;
              const safeX = isNaN(x) ? 0 : x;

              const barColor = THEME.colors.series[index % THEME.colors.series.length];

              // Label fade in and Y position animation
              const labelFadeProgress = spring({
                frame: frame - 60 - index * 6, // Label appears after bar
                fps,
                config: SPRING_CONFIG_LABELS,
                durationInFrames: 30,
              });

              const labelOpacity = interpolate(labelFadeProgress, [0, 1], [0, 1], {
                extrapolateRight: "clamp",
              });
              const labelTranslateY = interpolate(
                labelFadeProgress,
                [0, 1],
                [10, 0],
                { extrapolateRight: "clamp" }
              );

              return (
                <g key={item.label}>
                  <rect
                    x={safeX}
                    y={plotHeight} // Start from the bottom
                    width={barWidth}
                    height={0} // Initial height 0
                    fill={`url(#barGradient-${index})`}
                    rx={4}
                    ry={4}
                    transform={`translate(0, ${-safeBarHeight})`} // Animate Y translation
                    style={{
                      transformOrigin: `bottom`,
                      transition: `height 0s, transform 0s`, // Handled by Remotion, no CSS
                      height: safeBarHeight,
                      // Mask for rounded corners on top only
                      mask: `url(#mask-bar-${index})`,
                    }}
                  />
                  {/* Define mask for top rounded corners */}
                  <mask id={`mask-bar-${index}`}>
                    <rect
                      x={safeX}
                      y={safeY}
                      width={barWidth}
                      height={safeBarHeight + 10} // extend mask height to cover bottom
                      fill="white"
                      rx={4}
                      ry={4}
                    />
                  </mask>

                  {/* Value Label */}
                  {showValues && (
                    <text
                      x={safeX + barWidth / 2}
                      y={safeY - 8}
                      textAnchor="middle"
                      fontFamily={THEME.fontFamily}
                      fontSize={12}
                      fontWeight={600}
                      fill={THEME.colors.text}
                      style={{
                        opacity: labelOpacity,
                        transform: `translateY(${labelTranslateY}px)`,
                        textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                      }}
                    >
                      {formatValue(item.value)}
                    </text>
                  )}

                  {/* X-axis Label */}
                  <text
                    x={safeX + barWidth / 2}
                    y={plotHeight + 20}
                    textAnchor="middle"
                    fontFamily={THEME.fontFamily}
                    fontSize={12}
                    fill={THEME.colors.axisLabel}
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
