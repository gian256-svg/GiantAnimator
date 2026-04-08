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
  labels: string[]; // X-axis labels (e.g., ["W1", "W2", "W3"])
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// GiantAnimator Paleta de cores padrão [REGRAS DE CORES]
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // Azul suave
  '#F7A35C', // Laranja
  '#90ED7D', // Verde
  '#E4D354', // Amarelo
  '#8085E9', // Roxo
  '#F15C80', // Rosa
  '#2B908F', // Teal
  '#E75480', // Magenta
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
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper para gerar o caminho SVG de uma linha curva (cubic-bezier) [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Smooth/curva]
const getSmoothLinePath = (
  points: { x: number; y: number }[],
  tension: number = 0.3 // Ajuste a tensão para controlar a curvatura. 0.3 é um bom ponto de partida.
): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]; // Ponto anterior ao atual
    const p1 = points[i]; // Ponto atual
    const p2 = points[i + 1]; // Próximo ponto
    const p3 = points[Math.min(points.length - 1, i + 2)]; // Ponto após o próximo

    // Cálculo dos pontos de controle para uma curva Hermite Spline (que pode ser convertida para Bezier Cúbica)
    // Este é um algoritmo comum para suavização de curvas em gráficos.
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN nos pontos de controle
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;

    path += ` C ${safeCp1x} ${safeCp1y}, ${safeCp2x} ${safeCp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};


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
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y (ajustado para USD $XXXX.Xk ou números maiores)

  // Legenda: posicionada no topo à direita.
  // Será calculada dinamicamente, mas precisamos de um espaço no Y.
  const LEGEND_HEIGHT = Math.round(20 * scale * series.length + 10 * scale); // Aproximação

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !series.some(s => Array.isArray(s.data) && s.data.length > 0)) {
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

  // Encontrar valor máximo para dimensionar o eixo Y
  const allDataPoints = series.flatMap(s => s.data);
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...allDataPoints, 0);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const pointRadius = Math.round(6 * scale); // [Line Chart] Tamanho do ponto: 6px raio
  const lineThickness = Math.round(2.5 * scale); // [Line Chart] Espessura da linha: 2.5px
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

  // Calcular posições X para os pontos no gráfico
  const xPositions = labels.map((_, i) => {
    const safePlotWidth = isNaN(plotWidth) ? 0 : plotWidth; // [EDGE CASES E ROBUSTEZ]
    return plotAreaX + (i / (labels.length - 1)) * safePlotWidth;
  });

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
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? Math.round(1.5 * scale) : Math.round(1 * scale)}
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

        {/* Linhas e Pontos das Séries [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        {series.map((s, seriesIndex) => {
          const lineColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
          const pathPoints = s.data.map((value, dataIndex) => {
            const safeValue = isNaN(value) ? 0 : value; // [EDGE CASES E ROBUSTEZ]
            const y = maxValue > 0
              ? plotAreaY + plotHeight - (safeValue / maxValue) * plotHeight
              : plotAreaY + plotHeight;
            // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em xPositions
            const x = isNaN(xPositions[dataIndex]) ? plotAreaX : xPositions[dataIndex];
            return { x, y };
          });

          // [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Smooth/curva]
          const pathD = getSmoothLinePath(pathPoints);

          // Animação de "desenho" da linha (strokeDashoffset) [REGRAS DE ANIMAÇÃO]
          const pathLength = pathD ? document.createElementNS('http://www.w3.org/2000/svg', 'path').getTotalLength() : 0;
          const animatedDashoffset = interpolate(
            frame,
            [10 + seriesIndex * 5, 60 + seriesIndex * 5], // Staggered start for each line
            [pathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Proteger pathLength de ser NaN ou 0
          const safePathLength = isNaN(pathLength) || pathLength === 0 ? 1 : pathLength;
          const strokeDasharray = `${safePathLength} ${safePathLength}`;


          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              {/* Caminho da Linha */}
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={lineThickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={animatedDashoffset}
              />
              {/* Pontos (Dots) [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Dots/pontos] */}
              {pathPoints.map((point, dataIndex) => {
                const pointScale = interpolate(
                  frame,
                  [30 + dataIndex * 2 + seriesIndex * 3, 70 + dataIndex * 2 + seriesIndex * 3], // Staggered appearance (2 frames per point, 3 frames per series)
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS, // Usar config de labels para animações de aparição sem bounce
                  }
                );
                return (
                  <circle
                    key={`point-${seriesIndex}-${dataIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={pointRadius}
                    fill={lineColor}
                    stroke={lineColor} // Borda do ponto
                    strokeWidth={Math.round(1 * scale)}
                    transform={`scale(${pointScale})`}
                    transformOrigin={`${point.x}px ${point.y}px`}
                    opacity={pointScale} // Opacidade baseada na escala para fade-in
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = xPositions[index];
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
              textAnchor="middle"
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart -> Legenda] */}
        <g>
          {series.map((s, seriesIndex) => {
            const legendItemX = width - PLOT_AREA_PADDING - Math.round(120 * scale); // Ajuste X para a direita
            const legendItemY = PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(20 * scale) + seriesIndex * Math.round(20 * scale);
            const legendColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];

            const legendOpacity = interpolate(frame, [60 + seriesIndex * 5, 80 + seriesIndex * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            return (
              <g key={`legend-${seriesIndex}`} opacity={legendOpacity}>
                <rect
                  x={legendItemX}
                  y={legendItemY - Math.round(8 * scale)} // Ajuste para alinhar com o texto
                  width={Math.round(16 * scale)}
                  height={Math.round(2 * scale)} // Linha da legenda
                  fill={legendColor}
                  rx={Math.round(1 * scale)}
                  ry={Math.round(1 * scale)}
                />
                 <text
                  x={legendItemX + Math.round(24 * scale)}
                  y={legendItemY}
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                  alignmentBaseline="central"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
