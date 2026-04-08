import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs
// Animação principal — barras, linhas, áreas
const SPRING_CONFIG_MAIN: SpringConfig = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

// Animação de labels — sem bounce
const SPRING_CONFIG_LABELS: SpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

// Animação sutil — linhas de grid, fade
const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface MultiLineChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper function to generate an SVG path string with cubic bezier curves
// Baseado em: https://medium.com/@francoisromain/smooth-a-svg-path-with-bezier-curves-a450655c7bfe
const getSvgPath = (
  points: { x: number; y: number }[],
  tension: number = 0.4 // Ajustar a tensão para mais/menos curva
): string => {
  if (points.length < 2) return '';

  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    
    // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em coordenadas
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;
    const safeP2x = isNaN(p2.x) ? p1.x : p2.x;
    const safeP2y = isNaN(p2.y) ? p1.y : p2.y;

    path += ` C${safeCp1x},${safeCp1y},${safeCp2x},${safeCp2y},${safeP2x},${safeP2y}`;
  }
  return path;
};


// [REGRAS DE CORES] - Paleta padrão GiantAnimator
const GA_COLORS = [
  '#7CB5EC', // azul suave
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y (ajustado para $XXXX.Xk)
  const LEGEND_ROW_HEIGHT = Math.round(20 * scale);
  const LEGEND_HEIGHT = series.length > 0 ? LEGEND_ROW_HEIGHT : 0; // Se houver múltiplas séries, considerar uma linha de legenda.

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - LEGEND_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0]?.data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#1a1a2e',
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  // Encontrar o valor máximo em todas as séries para escala do eixo Y
  let maxValue = 0;
  series.forEach(s => {
    // [EDGE CASES E ROBUSTEZ] - Proteger contra dados vazios ou não numéricos
    if (Array.isArray(s.data)) {
        s.data.forEach(val => {
            if (typeof val === 'number' && !isNaN(val)) {
                maxValue = Math.max(maxValue, val);
            }
        });
    }
  });

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const effectiveMaxValue = maxValue === 0 ? 1 : maxValue; // Evitar divisão por zero se todos os valores forem 0

  const numPoints = labels.length;
  // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero se houver apenas 1 ponto
  const pointSpacing = plotWidth / (numPoints > 1 ? numPoints - 1 : 1); // Espaçamento entre pontos no eixo X

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const dotRadius = Math.round(6 * scale); // [Line Chart] 6px raio
  const lineStrokeWidth = Math.round(2.5 * scale); // [Line Chart] 2.5px espessura para todas as séries principais
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(effectiveMaxValue, numYTicks);

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntrance = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering MultiLineChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a2e', // Fundo do canvas padrão dark
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={textColor}
          style={{ textShadow: labelTextShadow }}
        >
          {title}
        </text>

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        <g
          transform={`translate(${plotAreaX}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(5 * scale)})`}
          opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
        >
          {series.map((s, idx) => (
            <g key={s.label} transform={`translate(${idx * Math.round(150 * scale)}, 0)`}>
              <rect
                x={0}
                y={0}
                width={Math.round(12 * scale)}
                height={Math.round(12 * scale)}
                fill={GA_COLORS[idx % GA_COLORS.length]}
                rx={Math.round(2 * scale)}
                ry={Math.round(2 * scale)}
              />
              <text
                x={Math.round(18 * scale)}
                y={Math.round(9 * scale)}
                fontSize={legendFontSize}
                fill={legendTextColor}
                alignmentBaseline="middle"
              >
                {s.label}
              </text>
            </g>
          ))}
        </g>


        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = effectiveMaxValue > 0
            ? plotAreaY + plotHeight - (tickValue / effectiveMaxValue) * plotHeight
            : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          const isZeroLine = tickValue === 0;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linhas e Pontos [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {series.map((s, seriesIndex) => {
          const lineColor = GA_COLORS[seriesIndex % GA_COLORS.length];

          // Calcula os pontos da linha para o SVG Path
          const linePoints = s.data.map((value, pointIndex) => {
            // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em coordenadas
            const x = plotAreaX + pointIndex * pointSpacing;
            const y = effectiveMaxValue > 0
              ? plotAreaY + plotHeight - (value / effectiveMaxValue) * plotHeight
              : plotAreaY + plotHeight; // Se maxValue for 0, todos os pontos na base

            return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y };
          });

          const pathD = getSvgPath(linePoints);

          // Animação de "desenho" da linha [REGRAS DE ANIMAÇÃO]
          // strokeDashoffset de 100% para 0%
          const lineDrawingOffset = interpolate(
            frame,
            [10 + seriesIndex * 10, 60 + seriesIndex * 10], // staggered start (10 frames de delay entre séries)
            [100, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          return (
            <g key={`series-${s.label}`}>
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={lineStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100%"
                strokeDashoffset={`${lineDrawingOffset}%`}
              />
              {/* Pontos da Linha [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
              {linePoints.map((point, pointIndex) => {
                const dotScale = interpolate(
                  frame,
                  [50 + seriesIndex * 10 + pointIndex * 2, 70 + seriesIndex * 10 + pointIndex * 2], // staggered dot animation
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                return (
                  <circle
                    key={`dot-${s.label}-${pointIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={dotRadius}
                    fill={lineColor}
                    transform={`scale(${dotScale})`}
                    transformOrigin={`${point.x}px ${point.y}px`}
                    opacity={dotScale} // Fade in with scale
                  />
                );
              })}
            </g>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * pointSpacing;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
