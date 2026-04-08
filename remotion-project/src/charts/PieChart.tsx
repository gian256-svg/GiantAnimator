import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate
} from "remotion";
import { Theme } from "../theme";

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieSlice[];
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  sliceColors?: string[];
  elementColors?: string[];
  showValueLabels?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
}

/**
 * PieChart Component — Hardened & High Fidelity
 * Gráfico de pizza com animação de fatia por fatia.
 */
export const PieChart: React.FC<PieChartProps> = (props) => {
  // ✅ Guards (Hardening)
  const data = Array.isArray(props.data) ? props.data : [];
  const sliceColors = Array.isArray(props.sliceColors) ? props.sliceColors : Theme.colors.series;

  const {
    title,
    backgroundColor = Theme.colors.background,
    textColor = Theme.colors.text,
    showValueLabels = true,
    elementColors,
    x = 0,
    y = 0,
    scale: propScale = 1,
  } = props;

  const frameObj = useCurrentFrame();
  const ANIMATION_FRAMES = 120;
  const progressGlobal = Math.min(frameObj / ANIMATION_FRAMES, 1);
  const frame = Math.min(frameObj, ANIMATION_FRAMES);
  const { width: videoWidth, height: videoHeight, fps } = useVideoConfig();

  const width = props.width || videoWidth;
  const height = props.height || videoHeight;

  // Guard de renderização
  if (data.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#ff4444', fontSize: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
          ⚠️ Dados insuficientes para renderização (PieChart)
        </div>
      </AbsoluteFill>
    );
  }

  const scale = Math.min(width / 1280, height / 720);
  const totalValue = data.reduce((acc, slice) => acc + slice.value, 0);
  const centerX = width / 2;
  const centerY = height / 2 + 30 * scale;
  const radius = 220 * scale;

  let currentAngle = -Math.PI / 2; // Começa no topo

  return (
    <div style={{ flex: 1, backgroundColor: backgroundColor, fontFamily: Theme.font.family, position: 'absolute', left: x, top: y, width, height, transform: `scale(${propScale})`, transformOrigin: 'top left' }}>
      {title && (
        <div style={{
          position: 'absolute', top: 40 * scale, width: '100%', maxWidth: 1200 * scale, left: '50%', transform: 'translateX(-50%)',
          paddingLeft: 40 * scale, paddingRight: 40 * scale, textAlign: 'center', wordBreak: 'break-word', boxSizing: 'border-box',
          color: textColor ?? '#1a1a2e', fontSize: 32 * scale, fontWeight: 'bold', zIndex: 10
        }}>
          {title}
        </div>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>

        {data.map((slice, i) => {
          const sliceAngle = (slice.value / totalValue) * 2 * Math.PI;
          const startAngle = currentAngle;
          
          // Animação Sequencial (15 frames por fatia)
          const startFrame = 30 + i * 15;
          const progress = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 12, stiffness: 80 }
          });

          const currentSliceAngle = sliceAngle * progress;
          const endAngle = startAngle + currentSliceAngle;

          // Coordenadas SVG path arc
          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);

          const largeArcFlag = currentSliceAngle > Math.PI ? 1 : 0;
          const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          const color = elementColors?.[i] || slice.color || sliceColors[i % sliceColors.length];
          const midAngle = startAngle + currentSliceAngle / 2;
          const labelRadius = radius * 0.65;
          const labelX = centerX + labelRadius * Math.cos(midAngle);
          const labelY = centerY + labelRadius * Math.sin(midAngle);

          currentAngle += sliceAngle;

          return (
            <g key={i}>
              <path d={pathD} fill={color} stroke={backgroundColor} strokeWidth={2 * scale} />
              
              {showValueLabels && progress > 0.8 && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={14 * scale}
                  fill="#FFF"
                  fontWeight="bold"
                  style={{ filter: "drop-shadow(0px 0px 3px rgba(0,0,0,0.5))" }}
                  opacity={interpolate(progress, [0.8, 1], [0, 1])}
                >
                  {`${Math.round((slice.value / totalValue) * 100)}%`}
                </text>
              )}

              {/* Legend Label à Direita */}
              <text
                 x={centerX + radius + 40 * scale}
                 y={centerY - (data.length * 20 * scale) / 2 + i * 40 * scale}
                 fontSize={16 * scale}
                 fill="#1a1a2e"
              >
                  {slice.label}
              </text>
              <rect
                 x={centerX + radius + 20 * scale}
                 y={centerY - (data.length * 20 * scale) / 2 + i * 40 * scale - 12 * scale}
                 width={12 * scale}
                 height={12 * scale}
                 fill={color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default PieChart;
