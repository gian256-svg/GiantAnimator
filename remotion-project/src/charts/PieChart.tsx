import React, { useId } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  Easing,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";
import { DynamicBackground } from "../layout/DynamicBackground";


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
  seriesColors?: string[];
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
  const { width, height, fps: _fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  const T = resolveTheme(theme, props.backgroundColor, backgroundType, props.colors || props.seriesColors, props.textColor);
  const resolvedBg = T.background;
  const resolvedText = T.text;
  const sliceColors = T.colors;

  // Normalização
  let normalizedData: PieSlice[] = [];
  if (Array.isArray(rawData)) normalizedData = rawData;
  else if (rawData.data && Array.isArray(rawData.data)) normalizedData = rawData.data;
  else if (rawData.labels && rawData.series?.[0]?.data) {
    normalizedData = rawData.labels.map((l: string, i: number) => ({
      label: l,
      value: rawData.series[0].data[i] || 0,
    }));
  }

  if (!normalizedData.length) {
    return <AbsoluteFill style={{ backgroundColor: (backgroundType as string) === 'transparent' ? 'rgba(0,0,0,0)' : resolvedBg }} />;
  }

  const totalValue = normalizedData.reduce((acc, s) => acc + s.value, 0) || 1;
  const slices = normalizedData.map((slice) => ({
    ...slice,
    angle: (slice.value / totalValue) * 2 * Math.PI,
    pct: (slice.value / totalValue) * 100,
  }));

  const fs = (base: number) => Math.round(base * (width / 1920));
  const margin = fs(128);

  const isRightLegend = legendPosition === 'right';
  const legendWidth = isRightLegend ? fs(500) : width * 0.9;
  const centerX = isRightLegend ? (width - legendWidth) / 2 : width / 2;
  const centerY = height / 2 + fs(40);
  const radius = Math.min((isRightLegend ? width * 0.28 : width * 0.3), height * 0.28);

  // ── Pré-computação de geometria (ângulos finais, não animados) ──
  const OUTSIDE_R   = radius * 1.38;
  const LEADER_R    = radius * 1.05;
  const MIN_GAP     = fs(30);  // espaço mínimo vertical entre labels externas

  let angleAcc = -Math.PI / 2;
  const geo = slices.map((slice, i) => {
    const sa  = angleAcc;
    angleAcc += slice.angle;
    const ea  = angleAcc;
    const mid = sa + slice.angle / 2;

    const inside = labelPosition === 'inside'  ? true
                 : labelPosition === 'outside' ? false
                 : slice.pct >= 8;

    const lDist = inside ? radius * 0.65 : OUTSIDE_R;
    const color = slice.color || sliceColors[i % sliceColors.length];

    return {
      i, sa, ea, mid, inside, color,
      lx: centerX + lDist * Math.cos(mid),
      ly: centerY + lDist * Math.sin(mid),
      ex: centerX + LEADER_R * Math.cos(mid),  // ponta da linha no bordo da fatia
      ey: centerY + LEADER_R * Math.sin(mid),
      side: Math.cos(mid) >= 0 ? 'right' : 'left',
    };
  });

  // ── Resolução de colisões Y para labels externas ──────────────
  const adjY = geo.map(s => s.ly);

  function pushApart(idxs: number[]) {
    // ordena por Y atual
    const sorted = [...idxs].sort((a, b) => adjY[a] - adjY[b]);
    for (let iter = 0; iter < 50; iter++) {
      let moved = false;
      for (let k = 0; k < sorted.length - 1; k++) {
        const gap = adjY[sorted[k + 1]] - adjY[sorted[k]];
        if (gap < MIN_GAP) {
          const d = (MIN_GAP - gap) / 2;
          adjY[sorted[k]]     -= d;
          adjY[sorted[k + 1]] += d;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }

  const outsideLeft  = geo.filter(s => !s.inside && s.side === 'left').map(s => s.i);
  const outsideRight = geo.filter(s => !s.inside && s.side === 'right').map(s => s.i);
  pushApart(outsideLeft);
  pushApart(outsideRight);

  return (
    <AbsoluteFill style={{
      fontFamily: Theme.typography.fontFamily,
      backgroundColor: backgroundType === 'transparent' ? 'rgba(0,0,0,0)' : undefined,
    }}>
      <DynamicBackground
        baseColor={resolvedBg}
        accentColor={sliceColors[0]}
        backgroundType={backgroundType}
      />

      {/* Header */}
      <div style={{ position: "absolute", top: margin, width: "100%", textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]) }}>
        {title    && <div style={{ fontSize: fs(Theme.typography.title.size),    fontWeight: 800, color: resolvedText }}>{title}</div>}
        {subtitle && <div style={{ fontSize: fs(Theme.typography.subtitle.size), color: T.textMuted, marginTop: fs(10) }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: "visible", position: 'absolute', top: 0, left: 0 }}>
        <defs>
          {geo.map((s) => {
            const edgeOpacity = (backgroundType as string) === 'transparent' ? 1 : 0.8;
            return (
              <radialGradient key={s.i} id={`pieGrad-${s.i}-${instanceId}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={s.color} />
                <stop offset="100%" stopColor={s.color} stopOpacity={edgeOpacity} />
              </radialGradient>
            );
          })}
        </defs>

        {geo.map((s) => {
          const progress = interpolate(
            frame - (30 + s.i * 5), [0, 45], [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) }
          );
          if (progress <= 0) return null;

          // Fatia animada
          const sweepAngle = s.sa + (s.ea - s.sa) * progress;
          const x1 = centerX + radius * Math.cos(s.sa);
          const y1 = centerY + radius * Math.sin(s.sa);
          const x2 = centerX + radius * Math.cos(sweepAngle);
          const y2 = centerY + radius * Math.sin(sweepAngle);
          const largeArc = ((s.ea - s.sa) * progress) > Math.PI ? 1 : 0;
          const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          // Label — posição FIXA (sem animação de posição)
          const labelOpacity = interpolate(progress, [0.85, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const lx  = s.lx;
          const ly  = adjY[s.i];  // Y ajustado para anti-colisão
          const fSz = fs(s.inside ? 16 : 13);
          const vSz = fs(s.inside ? 22 : 18);
          const gap = fs(s.inside ? 13 : 11);
          const fill = s.inside ? "#fff" : resolvedText;

          return (
            <g key={s.i}>
              <path
                d={pathD}
                fill={`url(#pieGrad-${s.i}-${instanceId})`}
                stroke={resolvedBg}
                strokeWidth={fs(3)}
              />

              {showValueLabels && progress > 0.85 && (
                <g opacity={labelOpacity}>
                  {/* Linha de ligação para labels externas */}
                  {!s.inside && (
                    <line
                      x1={s.ex} y1={s.ey}
                      x2={lx}   y2={ly}
                      stroke={s.color}
                      strokeWidth={1.5}
                      strokeOpacity={0.55}
                    />
                  )}

                  <text
                    x={lx} y={ly - gap}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={fSz} fill={fill} fontWeight="500"
                    style={s.inside ? { textShadow: "0 2px 4px rgba(0,0,0,0.4)" } : undefined}
                  >
                    {s.inside ? `${slices[s.i].label}` : slices[s.i].label}
                  </text>

                  <text
                    x={lx} y={ly + gap}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={vSz} fill={fill} fontWeight="800"
                    style={{ ...(s.inside ? { textShadow: "0 2px 4px rgba(0,0,0,0.4)" } : {}), ...Theme.typography.tabularNums }}
                  >
                    {formatValue(slices[s.i].value, unit)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legenda */}
      {legendPosition !== 'none' && (
        <div style={{
          position: "absolute",
          bottom:    isRightLegend ? 'auto' : fs(80),
          right:     isRightLegend ? fs(80) : 'auto',
          left:      isRightLegend ? 'auto' : '0',
          width:     isRightLegend ? legendWidth : '100%',
          top:       isRightLegend ? centerY - (slices.length * fs(30)) / 2 : 'auto',
          display:        "flex",
          flexDirection:  isRightLegend ? "column" : "row",
          justifyContent: "center",
          alignItems:     isRightLegend ? "flex-start" : "center",
          flexWrap:       "wrap",
          gap:            fs(24),
          opacity:        interpolate(frame, [40, 60], [0, 1]),
        }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: fs(12) }}>
              <div style={{ width: fs(20), height: fs(20), borderRadius: "4px", backgroundColor: geo[i].color }} />
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
