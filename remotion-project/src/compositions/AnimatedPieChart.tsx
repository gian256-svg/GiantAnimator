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
  colors?: string[];
}

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

export const AnimatedPieChart: React.FC<Props> = ({
  title,
  labels,
  values,
  unit = "",
  colors = DEFAULT_COLORS,
}) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
  const { fps } = useVideoConfig();

  const total = values.reduce((acc, v) => acc + v, 0) || 1;
  let currentOffset = 0;

  const slices = values.map((val, i) => {
    const percentage = val / total;
    const strokeDasharray = `${percentage * 100} 100`;
    const offset = currentOffset;
    currentOffset -= percentage * 100;

    // Calcula o ângulo médio para posicionar a label (de 0 a 360 graus)
    const midAngle = (Math.abs(offset) + (percentage * 100) / 2) * 3.6;
    // Converte para radianos, ajustando pois svg começa do topo (270 ou -90)
    const midAngleRad = (midAngle - 90) * (Math.PI / 180);

    return { val, label: labels[i], percentage, strokeDasharray, strokeDashoffset: offset, color: colors[i % colors.length], midAngleRad };
  });

  const pieProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 100, mass: 2, stiffness: 20 },
  });

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
          marginBottom: 40,
          textAlign: "center",
          width: "100%",
        }}
      >
        {title}
      </div>

      <div style={{ position: "relative", width: 600, height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg
          viewBox="0 0 32 32"
          style={{ width: 400, height: 400, transform: "rotate(-90deg)", borderRadius: "50%" }}
        >
          {slices.map((slice, i) => (
            <circle
              key={i}
              r="16"
              cx="16"
              cy="16"
              fill="transparent"
              stroke={slice.color}
              strokeWidth="32"
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={interpolate(pieProgress, [0, 1], [0, slice.strokeDashoffset])}
              style={{
                transition: "stroke-dashoffset 0s", // avoid CSS conflicts
              }}
            />
          ))}
        </svg>

        {/* Labels - animated pop up */}
        {slices.map((slice, i) => {
          const delay = 40 + i * 10;
          const labelScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          // Posição no circulo maior (raio do circulo visual é 200, mais um espaço de ~100)
          const radius = 260;
          const x = 300 + Math.cos(slice.midAngleRad) * radius;
          const y = 300 + Math.sin(slice.midAngleRad) * radius;

          return (
            <div
              key={`label-${i}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${labelScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(15, 23, 42, 0.8)",
                padding: "8px 16px",
                borderRadius: 8,
                border: `2px solid ${slice.color}`,
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ color: "#F1F5F9", fontSize: 24, fontWeight: "bold" }}>
                {slice.val}{unit}
              </div>
              <div style={{ color: "#94A3B8", fontSize: 18, whiteSpace: "nowrap" }}>
                {slice.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
