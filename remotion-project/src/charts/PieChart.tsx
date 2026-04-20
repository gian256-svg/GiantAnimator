import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
} from "remotion";
import { Theme, resolveTheme, formatValue } from "../theme";
import { DynamicBackground } from "../layout/DynamicBackground";
import { SmartCallout } from "../components/SmartCallout";

export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: any; // Suporta PieSlice[] ou objeto normalized do ChartRenderer
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  sliceColors?: string[];
  colors?: string[];
  showValueLabels?: boolean;
  unit?: string;
  animation?: any;
  bgStyle?: 'none' | 'mesh' | 'grid';
  backgroundType?: 'dark' | 'light';
  includeCallouts?: boolean;
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const {
    data: rawData = [],
    title,
    subtitle,
    showValueLabels = true,
    unit = "",
    theme = "dark",
    bgStyle = "none",
    includeCallouts = false,
    backgroundType,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // 1. Resolve Tema e Cores
  const T = resolveTheme(theme, props.backgroundColor, backgroundType);
  const resolvedBg = props.backgroundColor ?? T.background;
  const resolvedText = props.textColor ?? T.text;
  
  // Se theme for champagne e a cor for muito próxima de branco, vamos garantir o creme.
  // const isChampagne = theme?.toLowerCase() === 'champagne'; // Unused but kept for reference if needed
  
  const sliceColors = props.sliceColors || props.colors || [...T.colors];

  // 2. Normalização de dados (Suporta múltiplos formatos)
  let normalizedData: PieSlice[] = [];
  if (Array.isArray(rawData)) {
    normalizedData = rawData;
  } else if (rawData.labels && rawData.datasets && rawData.datasets[0]) {
    normalizedData = rawData.labels.map((label: string, i: number) => ({
      label,
      value: rawData.datasets[0].data[i] || 0,
    }));
  }

  // Se não houver dados, não renderiza nada ou renderiza placeholder (evita crashes)
  if (!normalizedData.length) return <AbsoluteFill style={{ backgroundColor: resolvedBg }} />;

  const totalValue = normalizedData.reduce((acc, s) => acc + s.value, 0) || 1;
  const slices = normalizedData.map((slice) => ({
    ...slice,
    angle: (slice.value / totalValue) * 2 * Math.PI,
    pct: (slice.value / totalValue) * 100,
  }));

  // 3. Layout Responsivo 4K com Safe Zones
  // Baseado no theme.ts: safeZoneX: 128, safeZoneTop: 160, safeZoneBottom: 80
  const safeL = Theme.canvas.safeZoneX;
  const safeR = width - safeL;
  const safeT = Theme.canvas.safeZoneTop;
  // const safeB = height - Theme.canvas.safeZoneBottom; // Unused

  const fs = (base: number) => Math.round(base * (width / 1280));

  // ── Layout (Zonas 1, 2, 3) ──
  const TITLE_SIZE = fs(38);
  const LEGEND_SIZE = fs(18); // Tamanho reduzido para evitar transbordamento (Anti-Colisão)
  
  const centerX = width / 2;
  
  // 🚀 CENTRO DE GRAVIDADE DINÂMICO (Regra 4K Anti-Colisão)
  // A legenda "empilha" para cima (bottom anchor + flexWrap = cresce verticalmente).
  // Estimamos o número de linhas baseado em ~4 legendas longas por linha.
  const estimatedLegendRows = Math.max(1, Math.ceil(slices.length / 4));
  // Puxa o gráfico para cima proporcionalmente à grossura da legenda
  const gravityShift = estimatedLegendRows * fs(30); 
  // Usa 48% como base + deslocamento dinâmico
  const centerY = (height * 0.48) - gravityShift; 
  
  // Raio Seguro: 28% da altura para preservar títulos e legendas
  const maxRadius = Math.min(width * 0.28, height * 0.28);
  const radius = maxRadius;

  // Renderização de Slices
  let currentAngle = -Math.PI / 2;

  return (
    <AbsoluteFill style={{ 
      fontFamily: Theme.typography.fontFamily,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <DynamicBackground 
        baseColor={resolvedBg} 
        accentColor={sliceColors[0]} 
        backgroundType={backgroundType}
      />
      
      {/* ── HEADER ── */}
      <div style={{
          position: "absolute", top: safeT, left: safeL, right: width - safeR,
          textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), pointerEvents: "none",
          zIndex: 10
        }}
      >
        {title && (
          <div style={{ fontSize: TITLE_SIZE, fontWeight: 800, color: resolvedText, letterSpacing: '-0.5px' }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: fs(24), color: T.textMuted, marginTop: fs(8), fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
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
          const startFrame = 30 + i * (60 / slices.length); // Distribui animação melhor
          const progress = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 12, stiffness: 90, mass: 0.8 }, // Usando config do Theme
          });

          const currentSliceAngle = slice.angle * progress;
          const endAngle = startAngle + currentSliceAngle;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          const largeArcFlag = currentSliceAngle > Math.PI ? 1 : 0;
          
          // Arco principal
          const pathD = progress > 0 ? `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z` : "";

          // const color = slice.color || sliceColors[i % sliceColors.length]; // Unused
          const midAngle = startAngle + currentSliceAngle / 2;
          
          // Labels baseadas em tamanho da fatia (Regra Unificada: >= 9%)
          const labelInside = slice.pct >= 9;
          const labelDist = labelInside ? radius * 0.65 : radius * 1.25;
          const lx = centerX + labelDist * Math.cos(midAngle);
          const ly = centerY + labelDist * Math.sin(midAngle);

          const op = interpolate(progress, [0.7, 1], [0, 1]);
          currentAngle += slice.angle;

          if (progress <= 0) return null;

          return (
            <g key={i}>
              <path 
                d={pathD} 
                fill={`url(#pieGrad-${i}-${instanceId})`} 
                stroke={resolvedBg} 
                strokeWidth={fs(3)} 
                style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.1))` }}
              />
              {showValueLabels && progress > 0.8 && (
                <text 
                  x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" 
                  fontSize={fs(labelInside ? 18 : 16)} 
                  fill={labelInside ? "#fff" : resolvedText} 
                  fontWeight="bold" opacity={op}
                  style={{ 
                    textShadow: labelInside ? "0 2px 4px rgba(0,0,0,0.4)" : "none",
                    fontFamily: Theme.typography.fontFamily,
                    ...Theme.typography.tabularNums
                  }}
                >
                  {formatValue(slice.value, unit)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── SMART CALLOUT (Apenas para a maior fatia) ── */}
      {includeCallouts && slices.length > 0 && (() => {
        let maxIdx = 0;
        let maxVal = -1;
        let currentIterAngle = -Math.PI / 2;
        let largestMidAngle = 0;
        
        slices.forEach((s, idx) => {
          if (s.value > maxVal) { maxVal = s.value; maxIdx = idx; largestMidAngle = currentIterAngle + s.angle / 2; }
          currentIterAngle += s.angle;
        });

        const largestSlice = slices[maxIdx];
        const labelDist = radius * 1.05;
        const calloutX = centerX + labelDist * Math.cos(largestMidAngle);
        const calloutY = centerY + labelDist * Math.sin(largestMidAngle);

        return (
          <SmartCallout
            x={calloutX}
            y={calloutY}
            label={largestSlice.label}
            value={formatValue(largestSlice.value, unit)}
            theme={theme}
            delay={160} // Surge no final do Ato 2 / Início do Ato 3
            color={largestSlice.color || sliceColors[maxIdx % sliceColors.length]}
          />
        );
      })()}

      {/* ── LEGEND (ZONA 3) ── */}
      <div style={{
          position: "absolute", bottom: height * 0.04, left: width * 0.05, right: width * 0.05,
          display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: fs(24),
          opacity: interpolate(frame, [40, 60], [0, 1]),
          pointerEvents: 'none'
        }}
      >
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: fs(8) }}>
            <div style={{ 
              width: fs(14), height: fs(14), borderRadius: "50%", 
              backgroundColor: s.color || sliceColors[i % sliceColors.length],
              border: `${fs(2)}px solid #fff`, boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }} />
            <div style={{ fontSize: LEGEND_SIZE, color: resolvedText, fontWeight: 500 }}>
              {s.label} ({formatValue(s.value, unit)})
            </div>
          </div>
        ))}
      </div>

    </AbsoluteFill>
  );
};
