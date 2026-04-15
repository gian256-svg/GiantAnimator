import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieSlice[];
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  sliceColors?: string[];
  colors?: string[];
  showValueLabels?: boolean;
  theme?: string;
  unit?: string;
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const {
    data = [],
    title,
    subtitle,
    showValueLabels = true,
    unit = "",
    theme = "dark",
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  const T = resolveTheme(theme);
  const resolvedBg = props.backgroundColor ?? T.background;
  const resolvedText = props.textColor ?? T.text;
  const sliceColors = props.sliceColors || props.colors || [...T.colors];

  const fs = (base: number) => Math.round(base * (width / 1280));

  // ── Layout (Zonas 1, 2, 3) ──
  const TITLE_SIZE = fs(38);
  const LEGEND_SIZE = fs(18);
  
  const centerX = width / 2;
  const centerY = height * 0.46; // Zona 2
  const maxRadius = Math.min(width * 0.35, height * 0.30);
  const radius = maxRadius;

  const totalValue = data.reduce((acc, s) => acc + s.value, 0) || 1;


  const slices = data.map((slice) => ({
    ...slice,
    angle: (slice.value / totalValue) * 2 * Math.PI,
    pct: (slice.value / totalValue) * 100,
  }));

  let currentAngle = -Math.PI / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg, fontFamily: Theme.typography.fontFamily }}>
      

      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs>
          {data.map((slice, i) => {
            const color = slice.color || sliceColors[i % sliceColors.length];
            return (
              <radialGradient key={i} id={`pieGrad-${i}-${instanceId}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity={0.8} />
              </radialGradient>
            );
          })}
        </defs>

        {slices.map((slice, i) => {
          const startAngle = currentAngle;
          const startFrame = 20 + i * 8;
          const progress = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 16, stiffness: 100, overshootClamping: true },
          });

          const currentSliceAngle = slice.angle * progress;
          const endAngle = startAngle + currentSliceAngle;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          const largeArcFlag = currentSliceAngle > Math.PI ? 1 : 0;
          const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          const color = slice.color || sliceColors[i % sliceColors.length];
          const midAngle = startAngle + currentSliceAngle / 2;
          
          const labelInside = slice.pct >= 10;
          const labelDist = labelInside ? radius * 0.65 : radius * 1.25;
          const lx = centerX + labelDist * Math.cos(midAngle);
          const ly = centerY + labelDist * Math.sin(midAngle);

          const op = interpolate(progress, [0.7, 1], [0, 1]);
          currentAngle += slice.angle;

          return (
            <g key={i}>
              <path d={pathD} fill={`url(#pieGrad-${i}-${instanceId})`} stroke={resolvedBg} strokeWidth={fs(2)} />
              {showValueLabels && progress > 0.7 && (
                <text 
                  x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" 
                  fontSize={fs(16)} fill={labelInside ? "#fff" : resolvedText} 
                  fontWeight="bold" opacity={op}
                  style={{ textShadow: labelInside ? "0 2px 4px rgba(0,0,0,0.5)" : "none" }}
                >
                  {formatValue(slice.value, unit)}
                </text>
              )}
            </g>
          );
        })}
      </svg>


      {/* ── LEGEND (ZONA 3) ── */}
      <div style={{
          position: "absolute", bottom: height * 0.05, left: width * 0.05, right: width * 0.05,
          display: "flex", justifyContent: "center", flexWrap: "wrap", gap: fs(45),
          opacity: interpolate(frame, [40, 60], [0, 1]),
          pointerEvents: 'none'
        }}
      >
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: fs(14) }}>
            <div style={{ 
              width: fs(22), height: fs(22), borderRadius: "50%", 
              backgroundColor: s.color || sliceColors[i % sliceColors.length],
              border: `${fs(3)}px solid #fff`, boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }} />
            <div style={{ fontSize: fs(28), color: resolvedText, fontWeight: 500 }}>
              {s.label} ({formatValue(s.value, unit)})
            </div>
          </div>
        ))}
      </div>

      {/* ── HEADER (Movido para APÓS SVG para Z-Index) ── */}
      <div style={{
          position: "absolute", top: height * 0.04, left: 0, right: 0,
          textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), pointerEvents: "none",
        }}
      >
        {title && (
          <div style={{ fontSize: TITLE_SIZE, fontWeight: 700, color: resolvedText }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: fs(18), color: T.textMuted, marginTop: fs(4) }}>
            {subtitle}
          </div>
        )}
      </div>

    </AbsoluteFill>
  );
};

export default PieChart;
