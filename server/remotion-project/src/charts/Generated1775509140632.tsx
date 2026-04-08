import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (IMUTÁVEIS)
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

interface SeriesData {
  label: string;
  data: number[];
}

interface MultiLineChartProps {
  title: string;
  labels: string[]; // Rótulos para o eixo X (categorias)
  series: SeriesData[];
}

// [REGRAS DE CORES] - Paleta padrão GiantAnimator (quando sem referência)
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // Série 1: azul suave
  '#F7A35C', // Série 2: laranja
  '#90ED7D', // Série 3: verde
  '#E4D354', // Série 4: amarelo
  '#8085E9', // Série 5: roxo
  '#F15C80', // Série 6: rosa
  '#2B908F', // Série 7: teal
  '#E75480', // Série 8: magenta
];

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
  const ticks = [];
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  if (maxValue <= 0) return [0]; 
  const step = maxValue / numTicks;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  labels: categoryLabels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X rotacionados
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y
  const LEGEND_HEIGHT = Math.round(series.length * 20 * scale); // Altura estimada para a legenda

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - LEGEND_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || series.some(s => !Array.isArray(s.data) || s.data.length === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No series data provided or data is empty. Displaying fallback.`);
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
        Sem dados para exibir o gráfico.
      </div>
    );
  }

  // Encontrar o valor máximo em todas as séries para escala do eixo Y
  const allValues = series.flatMap(s => s.data);
  const maxValue = Math.max(...allValues, 0); // Escala Y sempre começa em 0
  
  const numDataPoints = categoryLabels.length;
  const horizontalStep = plotWidth / (numDataPoints - 1 || 1); // Distância entre pontos no eixo X

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores do grid e linha zero
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';

  // Calcular tick marks do eixo Y
  const numYTicks = 5;
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

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
        {/* Posição: topo, centralizada, abaixo do título */}
        <g transform={`translate(${width / 2}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(10 * scale)})`}>
          {series.map((s, idx) => {
            const legendItemOpacity = interpolate(frame, [60 + idx * 5, 80 + idx * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            // Calcula largura total da legenda para centralizar
            const textWidthEstimate = s.label.length * (legendFontSize * 0.6); // Estima largura do texto
            const itemWidth = Math.round(10 * scale) + Math.round(8 * scale) + textWidthEstimate; // Corbox + padding + text
            
            const totalLegendWidth = series.reduce((sum, currentS) => {
                const currentTextWidth = currentS.label.length * (legendFontSize * 0.6);
                return sum + Math.round(10 * scale) + Math.round(8 * scale) + currentTextWidth + Math.round(20 * scale); // Add inter-item spacing
            }, 0);

            // Ajuste horizontal para centralizar a legenda inteira
            const legendXOffset = -totalLegendWidth / 2 + series.slice(0, idx).reduce((sum, prevS) => {
                const prevTextWidth = prevS.label.length * (legendFontSize * 0.6);
                return sum + Math.round(10 * scale) + Math.round(8 * scale) + prevTextWidth + Math.round(20 * scale);
            }, 0);

            return (
              <g key={`legend-${s.label}`} opacity={legendItemOpacity} transform={`translate(${legendXOffset}, 0)`}>
                <rect
                  x={0}
                  y={0 - Math.round(legendFontSize / 2) + Math.round(2 * scale)} // Ajuste vertical para centralizar
                  width={Math.round(10 * scale)}
                  height={Math.round(10 * scale)}
                  fill={GIANT_ANIMATOR_COLORS[idx % GIANT_ANIMATOR_COLORS.length]}
                  rx={Math.round(2 * scale)} // Pequeno arredondamento
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={Math.round(18 * scale)} // Espaço após o quadrado de cor
                  y={0}
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                  dominantBaseline="middle"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>


        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = maxValue > 0 
            ? plotAreaY + plotHeight - (tickValue / maxValue) * plotHeight
            : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          const isZeroLine = tickValue === 0;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // dashed para grid secundário
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

        {/* Linhas de Série e Pontos [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {series.map((s, seriesIndex) => {
          const lineColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
          const lineThickness = Math.round(2.5 * scale); // 2.5px para série principal
          const pointRadius = Math.round(6 * scale); // 6px raio para ponto

          // Gerar o path 'd' para a linha suave (cubic-bezier)
          let pathD = '';
          const points = s.data.map((value, dataIndex) => {
            const x = plotAreaX + dataIndex * horizontalStep;
            const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
            return { x, y: isNaN(y) ? plotAreaY + plotHeight : y }; // [EDGE CASES] NaN protection
          });

          if (points.length > 0) {
            pathD += `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
              const p0 = (i > 0) ? points[i - 1] : points[0];
              const p1 = points[i];
              const p2 = points[i + 1];
              const p3 = (i < points.length - 2) ? points[i + 2] : points[points.length - 1];
              
              // Calcula pontos de controle para Spline cúbica (Catmull-Rom para suavização)
              const tension = 0.5;
              const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
              const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
              const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
              const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
              
              pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
            }
          }
          
          // Animação de "desenho" da linha [REGRAS DE ANIMAÇÃO]
          const pathLength = pathD ? document.createElementNS("http://www.w3.org/2000/svg", "path").setAttribute("d", pathD) || 0 : 0; // Requires path DOM element to compute length
          // For Remotion, calculating path length precisely without DOM access is tricky.
          // A workaround is to estimate or use a fixed duration. Let's use a fixed duration.
          const estimatedPathLength = plotWidth * 1.2; // Estimativa de comprimento da linha

          const lineAnimationStartFrame = 20 + seriesIndex * 10; // Staggered start (10 frames de delay por série)
          const lineAnimationEndFrame = lineAnimationStartFrame + 50; // Duração da animação da linha

          const animatedStrokeDashoffset = interpolate(
            frame,
            [lineAnimationStartFrame, lineAnimationEndFrame],
            [estimatedPathLength, 0], // Desenha de 0 a comprimento total
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const lineOpacity = interpolate(frame, [lineAnimationStartFrame, lineAnimationStartFrame + 5], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={lineThickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={estimatedPathLength}
                strokeDashoffset={animatedStrokeDashoffset}
                opacity={lineOpacity}
              />
              {/* Dots/pontos: mostrar apenas quando < 20 pontos [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
              {s.data.length < 20 && points.map((p, pIndex) => {
                const pointOpacity = interpolate(
                  frame,
                  [lineAnimationStartFrame + (pIndex * 3), lineAnimationStartFrame + 20 + (pIndex * 3)], // Staggered point fade-in
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                return (
                  <circle
                    key={`point-${seriesIndex}-${pIndex}`}
                    cx={p.x}
                    cy={p.y}
                    r={pointRadius}
                    fill={lineColor}
                    opacity={pointOpacity}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {categoryLabels.map((label, index) => {
          const x = plotAreaX + index * horizontalStep;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${label}`}
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
