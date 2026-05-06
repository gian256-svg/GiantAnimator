import React, { useId } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  Easing,
} from "remotion";
import { Theme, resolveTheme, formatValue, wrapText } from "../theme";
import { DynamicBackground } from "../layout/DynamicBackground";
import { SmartCallout } from "../components/SmartCallout";

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: any;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  sliceColors?: string[];
  colors?: string[];
  seriesColors?: string[]; // alias retornado pela IA vision
  showValueLabels?: boolean;
  unit?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light';
  includeCallouts?: boolean;
  theme?: 'dark' | 'light';
  legendPosition?: 'bottom' | 'right' | 'none';
  labelPosition?: 'inside' | 'outside' | 'auto';
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const {
    data: rawData = [],
    title = "",
    subtitle = "",
    showValueLabels = true,
    unit = "",
    theme = "dark",
    backgroundType,
    legendPosition = 'bottom',
    labelPosition = 'auto',
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // Resolve Tema
  const T = resolveTheme(theme, props.backgroundColor, backgroundType, props.colors || props.seriesColors, props.textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const sliceColors = T.colors;

  // Normalização
  let normalizedData: PieSlice[] = [];
  if (Array.isArray(rawData)) normalizedData = rawData;
  else if (rawData.data && Array.isArray(rawData.data)) normalizedData = rawData.data;
  else if (rawData.labels && rawData.series?.[0]?.data) {
    normalizedData = rawData.labels.map((l: string, i: number) => ({ label: l, value: rawData.series[0].data[i] || 0 }));
  }

  if (!normalizedData.length) return <AbsoluteFill style={{ backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : resolvedBg }} />;

  const totalValue = normalizedData.reduce((acc, s) => acc + s.value, 0) || 1;
  const slices = normalizedData.map((slice) => ({
    ...slice,
    angle: (slice.value / totalValue) * 2 * Math.PI,
    pct: (slice.value / totalValue) * 100,
  }));

  const fs = (base: number) => Math.round(base * (width / 1920));
  const margin = fs(128);
  const titleHeight = fs(160);

  const isRightLegend = legendPosition === 'right';
  const legendWidth = isRightLegend ? fs(500) : width * 0.9;
  const centerX = isRightLegend ? (width - legendWidth) / 2 : width / 2;
  const centerY = height / 2 + fs(40);
  const radius = Math.min((isRightLegend ? width * 0.28 : width * 0.3), height * 0.28);

  const LEGEND_FONT_SIZE = fs(24);
  const MAX_CHARS_PER_LINE = 22;

  let currentAngle = -Math.PI / 2;

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily,
      backgroundColor: backgroundType === 'transparent' ? 'rgba(0,0,0,0)' : undefined
    }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={sliceColors[0]} 
        backgroundType={backgroundType}
      />
      
      {/* Header */}
      <div style={{ position: "absolute", top: margin, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]) }}>
        {title && <div style={{ fontSize: fs(Theme.typography.title.size), fontWeight: 800, color: resolvedText }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(Theme.typography.subtitle.size), color: T.textMuted, marginTop: fs(10) }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: "visible", position: 'absolute', top: 0, left: 0 }}>
        <defs>
          {slices.map((slice, i) => {
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
          const progress = interpolate(frame - (30 + i * 5), [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });

          const currentSliceAngle = slice.angle * progress;
          const endAngle = startAngle + currentSliceAngle;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          const largeArcFlag = currentSliceAngle > Math.PI ? 1 : 0;
          const pathD = progress > 0 ? `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z` : "";
          const midAngle = startAngle + currentSliceAngle / 2;
          
          const labelInside = labelPosition === 'inside' ? true : labelPosition === 'outside' ? false : slice.pct >= 9;
          const labelDist = labelInside ? radius * 0.65 : radius * 1.25;
          const lx = centerX + labelDist * Math.cos(midAngle);
          const ly = centerY + labelDist * Math.sin(midAngle);

          currentAngle += slice.angle;
          if (progress <= 0) return null;

          return (
            <g key={i}>
              <path d={pathD} fill={`url(#pieGrad-${i}-${instanceId})`} stroke={resolvedBg} strokeWidth={fs(3)} />
              {showValueLabels && progress > 0.8 && (
                <g opacity={interpolate(progress, [0.8, 1], [0, 1])}>
                   {/* Label do nome da fatia (Mocha Marvels, etc) */}
                   <text 
                    x={lx} y={ly - fs(12)} textAnchor="middle" dominantBaseline="middle" 
                    fontSize={fs(labelInside ? 16 : 14)} 
                    fill={labelInside ? "#fff" : resolvedText} 
                    fontWeight="500"
                    style={{ textShadow: labelInside ? "0 2px 4px rgba(0,0,0,0.4)" : "none" }}
                  >
                    {slice.label}
                  </text>
                  {/* Valor da fatia */}
                  <text 
                    x={lx} y={ly + fs(12)} textAnchor="middle" dominantBaseline="middle" 
                    fontSize={fs(labelInside ? 22 : 20)} 
                    fill={labelInside ? "#fff" : resolvedText} 
                    fontWeight="800"
                    style={{ textShadow: labelInside ? "0 2px 4px rgba(0,0,0,0.4)" : "none", ...Theme.typography.tabularNums }}
                  >
                    {formatValue(slice.value, unit)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legenda Lateral ou Inferior */}
      {legendPosition !== 'none' && (
        <div style={{
          position: "absolute",
          bottom: isRightLegend ? 'auto' : fs(80),
          right: isRightLegend ? fs(80) : 'auto',
          left: isRightLegend ? 'auto' : '0',
          width: isRightLegend ? legendWidth : '100%',
          top: isRightLegend ? centerY - (slices.length * fs(30)) / 2 : 'auto',
          display: "flex",
          flexDirection: isRightLegend ? "column" : "row",
          justifyContent: "center",
          alignItems: isRightLegend ? "flex-start" : "center",
          flexWrap: "wrap",
          gap: fs(24),
          opacity: interpolate(frame, [40, 60], [0, 1])
        }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: fs(12) }}>
               <div style={{ width: fs(20), height: fs(20), borderRadius: "4px", backgroundColor: s.color || sliceColors[i % sliceColors.length] }} />
               <div style={{ fontSize: fs(24), color: resolvedText, fontWeight: 600 }}>
                {s.label} ({formatValue(s.value, unit)})
              </div>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
