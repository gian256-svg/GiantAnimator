import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
  primaryColor?: string;
}

export const AnimatedLineChart: React.FC<Props> = ({
  title,
  labels,
  values,
  unit = "",
  primaryColor = "#10B981",
}) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...values, 1);
  const chartWidth = 1000;
  const chartHeight = 400;

  // Calculate coordinates
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (val / maxValue) * chartHeight;
    return { x, y, val, label: labels[i] };
  });

  const pathData = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`
    : "";

  const pathProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 100, mass: 2, stiffness: 20 },
  });

  // Calculate rough path length
  const fakeLength = chartWidth * 2; 

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0F172A",
        padding: 60,
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Título */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#F1F5F9",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          marginBottom: 60,
          textAlign: "center",
          width: "100%",
        }}
      >
        {title}
      </div>

      <div style={{ position: "relative", width: chartWidth, height: chartHeight + 100, marginTop: 40 }}>
        <svg
          style={{ overflow: "visible", width: "100%", height: chartHeight }}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke={primaryColor}
              strokeWidth={8}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={fakeLength}
              strokeDashoffset={interpolate(pathProgress, [0, 1], [fakeLength, 0])}
            />
          )}

          {points.map((p, i) => {
            const pointDelay = 15 + i * (60 / (points.length || 1));
            const pointScale = spring({
              frame: frame - pointDelay,
              fps,
              config: { damping: 10, mass: 0.5, stiffness: 100 },
            });

            return (
              <g key={i} style={{ transform: `scale(${pointScale})`, transformOrigin: `${p.x}px ${p.y}px` }}>
                <circle cx={p.x} cy={p.y} r={12} fill="#0F172A" stroke={primaryColor} strokeWidth={4} />
              </g>
            );
          })}
        </svg>

        {/* Labels & Values */}
        {points.map((p, i) => {
          const pointDelay = 15 + i * (60 / (points.length || 1));
          const opacity = interpolate(frame, [pointDelay, pointDelay + 10], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={`label-${i}`} style={{ position: "absolute", left: p.x, top: 0, opacity, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: p.y - 50, color: "#F1F5F9", fontSize: 28, fontWeight: "bold" }}>
                {p.val}
                {unit}
              </div>
              <div style={{ position: "absolute", top: chartHeight + 20, color: "#94A3B8", fontSize: 24, textAlign: "center", width: 120 }}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
