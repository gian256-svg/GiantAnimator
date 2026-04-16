import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
  Easing,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";

interface LineChartProps {
  data?: any;
  series?: { label: string; data: number[]; color?: string }[];
  labels?: string[];
  title: string;
  subtitle?: string;
  showArea?: boolean;
  colors?: string[];
  theme?: string;
  backgroundColor?: string;
  textColor?: string;
  unit?: string;
}

export const LineChart: React.FC<LineChartProps> = (props) => {
  const {
    data: rawData = [],
    series: propsSeries,
    labels: propsLabels,
    title = "",
    subtitle = "",
    showArea = true,
    colors,
    theme = "dark",
    backgroundColor,
    textColor,
    unit = '',
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Resolve tema
  const T = resolveTheme(theme);
  const resolvedBg = backgroundColor ?? T.background;
  const resolvedText = textColor ?? T.text;
  const resolvedColors = colors && colors.length > 0 ? colors : [...T.colors];

  // Normalização de dados
  let normalizedSeries: { label: string; data: number[]; color?: string }[] = [];
  let xAxisLabels: string[] = [];

  if (propsSeries && propsLabels) {
    normalizedSeries = propsSeries;
    xAxisLabels = propsLabels;
  } else if (rawData.labels && rawData.datasets) {
    normalizedSeries = rawData.datasets;
    xAxisLabels = rawData.labels;
  } else if (Array.isArray(rawData)) {
    normalizedSeries = [{ label: title, data: rawData.map((d: any) => d.value) }];
    xAxisLabels = rawData.map((d: any) => d.label);
  }

  if (xAxisLabels.length < 2) return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;

  // Layout 4K
  const fs = (base: number) => Math.round(base * (width / 1280));
  const pad = width * 0.04;
  const padTop = height * 0.15;
  const padBot = height * 0.12;
  const plotLeft = pad + width * 0.08;
  const plotTop = padTop;
  const plotWidth = width - plotLeft - (pad * 1.5);
  const plotHeight = height - padTop - padBot;

  const allValues = normalizedSeries.flatMap(s => s.data);
  const dataMax = Math.max(...allValues, 1);
  const dataMin = Math.min(...allValues, 0);
  const range = (dataMax - dataMin) * 1.2 || 1;
  const minV = dataMin - (dataMax - dataMin) * 0.05;

  const getX = (i: number) => plotLeft + (i / (xAxisLabels.length - 1)) * plotWidth;
  const getY = (v: number) => plotTop + plotHeight - ((v - minV) / range) * plotHeight;

  const progress = interpolate(frame, [30, 30 + 3 * fps], [0, 1], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: resolvedBg, fontFamily: Theme.typography.fontFamily }}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="line-reveal">
            <rect x={0} y={0} width={plotLeft + (plotWidth + 100) * progress} height={height} />
          </clipPath>
          {normalizedSeries.map((_, i) => (
            <linearGradient key={i} id={`lineGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={normalizedSeries[i].color || resolvedColors[i % resolvedColors.length]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={normalizedSeries[i].color || resolvedColors[i % resolvedColors.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* GRID */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const val = minV + v * range;
          const y = getY(val);
          const op = interpolate(frame, [10, 30], [0, 0.4], { extrapolateRight: 'clamp' });
          return (
            <React.Fragment key={v}>
              <line x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={T.grid} strokeWidth={Math.max(1, fs(1.5))} opacity={op} />
              <text x={plotLeft - fs(12)} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: fs(14), fill: T.textMuted, opacity: op, ...Theme.typography.tabularNums }}>
                {formatValue(val, unit)}
              </text>
            </React.Fragment>
          );
        })}

        {/* SÉRIES */}
        {normalizedSeries.map((s, sIndex) => {
          const color = s.color || resolvedColors[sIndex % resolvedColors.length];
          const linePoints = s.data.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
          const areaPath = `M ${getX(0)},${getY(s.data[0])} ` + s.data.slice(1).map((v, i) => `L ${getX(i + 1)},${getY(v)}`).join(" ") + ` L ${getX(s.data.length - 1)},${plotTop + plotHeight} L ${getX(0)},${plotTop + plotHeight} Z`;

          return (
            <g key={sIndex} clipPath="url(#line-reveal)">
              {showArea && <path d={areaPath} fill={`url(#lineGrad-${sIndex})`} />}
              <polyline points={linePoints} fill="none" stroke={color} strokeWidth={fs(5)} strokeLinecap="round" strokeLinejoin="round" />
              {s.data.map((v, i) => (
                <circle key={i} cx={getX(i)} cy={getY(v)} r={fs(6)} fill={resolvedBg} stroke={color} strokeWidth={fs(3)} />
              ))}
            </g>
          );
        })}

        {/* X AXIS */}
        {xAxisLabels.map((l, i) => {
          if (xAxisLabels.length > 12 && i % Math.ceil(xAxisLabels.length / 10) !== 0) return null;
          return (
            <text key={i} x={getX(i)} y={plotTop + plotHeight + fs(28)} textAnchor="middle" style={{ fontSize: fs(14), fill: T.textMuted, opacity: interpolate(frame, [40, 60], [0, 1]) }}>{l}</text>
          );
        })}
      </svg>

      {/* HEADER */}
      <div style={{ position: "absolute", top: height * 0.05, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), pointerEvents: 'none' }}>
        {title && <div style={{ fontSize: fs(44), fontWeight: 800, color: resolvedText, letterSpacing: "-0.5px" }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(24), color: T.textMuted, marginTop: fs(8), fontWeight: 500 }}>{subtitle}</div>}
      </div>

      {/* LEGEND */}
      {normalizedSeries.length > 1 && (
        <div style={{ position: 'absolute', bottom: height * 0.05, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: fs(50), opacity: interpolate(frame, [40, 60], [0, 1]), pointerEvents: 'none' }}>
          {normalizedSeries.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(12) }}>
              <div style={{ width: fs(30), height: fs(4), backgroundColor: s.color || resolvedColors[i % resolvedColors.length], borderRadius: fs(2) }} />
              <div style={{ fontSize: fs(20), color: resolvedText, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

export default LineChart;
