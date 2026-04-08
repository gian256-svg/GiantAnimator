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

// [HIGHCHARTS-VISUAL-RULES] - Paleta padrão GiantAnimator
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

// Helper para gerar o atributo 'd' de um path SVG com curvas suaves (Bezier cúbica)
// Implementa uma heurística simplificada inspirada em Catmull-Rom para pontos de controle
// [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Smooth/curva: usar cubic-bezier]
function getSmoothPathD(points: { x: number; y: number }[]): string {
  if (points.length < 2) {
    return '';
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]; // Ponto atual
    const p2 = points[i + 1]; // Próximo ponto

    // Pontos adjacentes para calcular tangentes, com tratamento de borda
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

    // Simplificação D3-like para calcular pontos de controle para Bezier cúbica
    // Estes pontos são usados para guiar a curva entre p1 e p2
    const tension = 0.5; // Ajuste para mais ou menos "curvatura"

    // Primeiro ponto de controle (para p1)
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;

    // Segundo ponto de controle (para p2)
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
    
    // Adiciona o comando de curva cúbica ao path
    // C x1,y1 x2,y2 x,y - Onde (x1,y1) e (x2,y2) são os pontos de controle, e (x,y) é o ponto final
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

// Helper para estimar o comprimento de um path para animação stroke-dashoffset
// Não podemos usar `getTotalLength()` sem `document`, então estimamos somando as distâncias
function estimatePathLength(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    totalLength += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  return totalLength;
}

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
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || series.every(s => !Array.isArray(s.data) || s.data.length === 0)) {
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
  
  const allDataPoints = series.flatMap(s => s.data);
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...allDataPoints, 0); 
  
  const numDataPoints = labels.length;
  const xStep = plotWidth / (numDataPoints - 1); // Para linhas, conectamos pontos, então N-1 segmentos

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const dotRadius = Math.round(6 * scale); // [Line Chart] - Tamanho do ponto: 6px raio (12px diâmetro)

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
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

        {/* Linhas e Pontos das Séries [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        {series.map((s, seriesIndex) => {
          const lineColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];

          const points = s.data.map((value, dataIndex) => {
            const x = plotAreaX + dataIndex * xStep;
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero
            const y = maxValue > 0 
              ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
              : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos na base
            return { x, y };
          });

          // Gera o path SVG com curvas suaves
          const pathD = getSmoothPathD(points);
          // Estima o comprimento do path para animação stroke-dashoffset
          const pathLength = estimatePathLength(points);
          
          // Animação de desenho da linha [REGRAS DE ANIMAÇÃO]
          // Cada linha com um stagger de 10 frames
          const lineStartFrame = 10 + seriesIndex * 10;
          const lineEndFrame = 70 + seriesIndex * 10;

          const animatedDashoffset = interpolate(
            frame,
            [lineStartFrame, lineEndFrame],
            [pathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const lineOpacity = interpolate(frame, [lineStartFrame, lineStartFrame + 20], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`series-${s.label}`}>
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={Math.round(2.5 * scale)} // [Line Chart] - Espessura da linha: 2.5px
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength}
                strokeDashoffset={animatedDashoffset}
                opacity={lineOpacity}
              />
              {/* Pontos nos dados [Line Chart] - mostrar porque < 20 pontos */}
              {points.map((point, dataIndex) => {
                // Animação de aparição dos pontos
                const dotScale = interpolate(
                  frame,
                  [lineEndFrame - 10 + dataIndex * 2, lineEndFrame + dataIndex * 2], // Staggered appearance
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                return (
                  <circle
                    key={`${s.label}-dot-${dataIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={dotRadius}
                    fill={lineColor}
                    stroke="none"
                    opacity={lineOpacity} // Base opacity from line
                    transform={`scale(${dotScale})`}
                    transformOrigin={`${point.x}px ${point.y}px`}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xStep;
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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        {/* Legenda: sempre visível, posicionada no topo ou à direita. Optamos por topo-direita. */}
        <g>
          {series.map((s, index) => {
            const legendX = plotAreaX + plotWidth - Math.round(10 * scale); // Alinhado à direita
            const legendY = plotAreaY + Math.round(10 * scale) + index * Math.round(20 * scale); // Empilhado verticalmente

            const legendOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            const legendColor = GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length];

            return (
              <g key={`legend-${s.label}`} opacity={legendOpacity}>
                <rect
                  x={legendX - Math.round(18 * scale)} // Pequeno quadrado de cor
                  y={legendY - Math.round(8 * scale)}
                  width={Math.round(12 * scale)}
                  height={Math.round(12 * scale)}
                  fill={legendColor}
                  rx={Math.round(2 * scale)}
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={legendX}
                  y={legendY}
                  textAnchor="end" // Alinhado à direita
                  fontSize={legendFontSize}
                  fill={legendTextColor}
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
