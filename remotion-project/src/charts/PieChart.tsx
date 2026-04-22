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
  theme?: string;
  legendPosition?: 'bottom' | 'right' | 'none';
  labelPosition?: 'inside' | 'outside' | 'auto';
}

export const PieChart: React.FC<PieChartProps> = (props) => {
  const {
    data: rawData = [],
    title,
    subtitle,
    showValueLabels = true,
    unit = "",
    theme = "dark",
    // bgStyle = "none", // Removido por não ser mais necessário no DynamicBackground
    includeCallouts = false,
    backgroundType,
    legendPosition = 'bottom',
    labelPosition = 'auto',
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  // 1. Resolve Tema e Cores
  const T = resolveTheme(theme, props.backgroundColor, backgroundType);
  
  // REGRA DE OURO: Se o usuário forçou um tipo de fundo (Dark/Light), respeitamos o T.background.
  // Caso contrário, usamos a cor extraída (props.backgroundColor) se disponível.
  const resolvedBg = backgroundType ? T.background : (props.backgroundColor ?? T.background);
  const resolvedText = backgroundType ? T.text : (props.textColor ?? T.text);
  
  // Se theme for champagne e a cor for muito próxima de branco, vamos garantir o creme.
  // const isChampagne = theme?.toLowerCase() === 'champagne'; // Unused but kept for reference if needed
  
  const sliceColors = props.sliceColors || props.colors || [...T.colors];

  // 2. Normalização de dados (Suporta múltiplos formatos)
  let normalizedData: PieSlice[] = [];
  const raw = rawData || {};
  
  if (Array.isArray(rawData)) {
    normalizedData = rawData;
  } else if (raw.data && Array.isArray(raw.data)) {
    // Formato 'data' direto: [{label, value}, ...]
    normalizedData = raw.data;
  } else if (raw.labels && raw.series && raw.series[0] && Array.isArray(raw.series[0].data)) {
    // Formato 'series' (Padrão GiantAnimator para MultiLine/Bar)
    normalizedData = raw.labels.map((label: string, i: number) => ({
      label,
      value: raw.series[0].data[i] ?? 0,
      color: raw.series[0].color,
    }));
  } else if (raw.labels && raw.datasets && raw.datasets[0] && Array.isArray(raw.datasets[0].data)) {
    // Formato 'datasets' (Padrão Chart.js)
    normalizedData = raw.labels.map((label: string, i: number) => ({
      label,
      value: raw.datasets[0].data[i] ?? 0,
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

  const fs = (base: number) => Math.round(base * (width / 1920));

  // ── Layout (Zonas 1, 2, 3) ──
  const TITLE_SIZE = fs(38);
  const LEGEND_SIZE = fs(24); // Aumentado para melhor legibilidade UHD
  
  // 🚀 POSICIONAMENTO DINÂMICO (Bottom vs Right)
  const isRightLegend = legendPosition === 'right';
  const legendWidth = isRightLegend ? fs(580) : width * 0.9;
  
  const centerX = isRightLegend ? (width - legendWidth) / 2 : width / 2;
  
  // Se a legenda for pequena, mantemos o gráfico mais centralizado para evitar colisão com o título.
  const estimatedLegendRows = Math.max(1, Math.ceil(slices.length / (isRightLegend ? 1 : 4)));
  const gravityShift = estimatedLegendRows * fs(30); 
  
  // Base 0.50 (centro real) e só sobe se houver muitas linhas de legenda (apenas se for bottom)
  const centerY = (height * 0.50) - (!isRightLegend && estimatedLegendRows > 2 ? gravityShift : 0); 
  
  // Raio Seguro: 28% da altura (ou menos se for lateral para evitar corte)
  const maxRadius = Math.min((isRightLegend ? width * 0.30 : width * 0.28), height * 0.28);
  const radius = maxRadius;

  // 🚀 POSICIONAMENTO DINÂMICO DA LEGENDA (Regra Anti-Vacuo)
  const chartBottom = centerY + radius;
  const idealGap = fs(60);
  const legendHeight = estimatedLegendRows * fs(35);
  // Se o gráfico + gap + legenda cabem com folga, puxamos a legenda para cima
  const spaceBelow = height - chartBottom;
  const dynamicLegendBottom = spaceBelow > (idealGap + legendHeight + fs(40))
    ? height - (chartBottom + idealGap + legendHeight)
    : height * 0.04;

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
          position: "absolute", top: height * 0.04, left: 0, right: 0,
          textAlign: "center", opacity: interpolate(frame, [0, 20], [0, 1]), pointerEvents: "none",
          zIndex: 10, padding: `0 ${fs(100)}px`
        }}
      >
        {title && (
          <div style={{ fontSize: fs(40), fontWeight: 800, color: resolvedText, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
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
          // Animação fluida "Easy Out" solicitada pelo usuário
          const progress = interpolate(
            frame - startFrame,
            [0, 45], // Duração de 45 frames para o reveal de cada fatia
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.exp),
            }
          );

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
          // Labels baseadas em tamanho da fatia (Regra Unificada: >= 9%) ou preferência
          const labelInside = labelPosition === 'inside' ? true : labelPosition === 'outside' ? false : slice.pct >= 9;
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
      {legendPosition !== 'none' && (
        <div style={{
            position: "absolute", 
            bottom: isRightLegend ? 'auto' : dynamicLegendBottom, 
            top: isRightLegend ? centerY - (slices.length * fs(45)) / 2 : 'auto',
            left: isRightLegend ? width - legendWidth : width * 0.05, 
            right: isRightLegend ? fs(50) : width * 0.05,
            display: "flex", 
            flexDirection: isRightLegend ? "column" : "row",
            justifyContent: isRightLegend ? "center" : "center", 
            alignItems: isRightLegend ? "flex-start" : "center", 
            flexWrap: "wrap", 
            gap: fs(isRightLegend ? 18 : 24),
            opacity: interpolate(frame, [40, 60], [0, 1]),
            pointerEvents: 'none'
          }}
        >
          {slices.map((s, i) => (
               <div style={{ 
                 width: fs(18), height: fs(18), borderRadius: "2px", // Aumentado de 14 para 18
                 backgroundColor: s.color || sliceColors[i % sliceColors.length],
                 border: `${fs(2)}px solid #fff`, boxShadow: '0 0 10px rgba(0,0,0,0.3)'
               }} />
               <div style={{ fontSize: LEGEND_SIZE, color: resolvedText, fontWeight: 600, display: 'flex', gap: fs(12) }}>
                {s.label} ({formatValue(s.value, unit)})
              </div>
            </div>
          ))}
        </div>
      )}

    </AbsoluteFill>
  );
};
