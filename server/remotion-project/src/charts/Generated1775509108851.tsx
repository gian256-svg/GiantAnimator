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

// [REGRAS DE CORES] - Paleta padrão GiantAnimator
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // azul suave — Série 1
  '#F7A35C', // laranja — Série 2
  '#90ED7D', // verde — Série 3
  '#E4D354', // amarelo — Série 4
  '#8085E9', // roxo — Série 5
  '#F15C80', // rosa — Série 6
  '#2B908F', // teal — Série 7
  '#E75480', // magenta — Série 8
];

interface PieChartData {
  label: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatPercentage = (num: number): string => {
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
};

// Função para converter graus para radianos
const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

// Função para gerar o path SVG de um arco de pizza
const getPathData = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number, // em graus
  endAngle: number // em graus
) => {
  const startRad = degreesToRadians(startAngle - 90); // -90 para começar do topo
  const endRad = degreesToRadians(endAngle - 90);

  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);

  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;
};

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const LEGEND_WIDTH = Math.round(200 * scale); // Espaço para a legenda à direita

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  const pieRadius = Math.min(chartWidth - LEGEND_WIDTH, chartHeight) / 2 - Math.round(20 * scale); // Raio do gráfico
  const centerX = PLOT_AREA_PADDING + (chartWidth - LEGEND_WIDTH) / 2;
  const centerY = PLOT_AREA_PADDING + TITLE_HEIGHT + chartHeight / 2;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0 || data.every(d => d.value === 0)) {
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

  // Calcular o valor total e as fatias
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0; // Começa no 0, que no SVG é a direita, mas será ajustado para o topo no `getPathData`

  const pieSlices = data.map((item, index) => {
    const percentage = (item.value / totalValue) * 100;
    const sliceAngle = (item.value / totalValue) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Ponto médio do arco para o label externo
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = pieRadius * 0.7; // Posição do label dentro ou fora. Para PIE chart, costuma ser fora.
    const labelOuterRadius = pieRadius + Math.round(30 * scale); // Distância para o label percentual
    const labelX = centerX + labelOuterRadius * Math.cos(degreesToRadians(midAngle - 90));
    const labelY = centerY + labelOuterRadius * Math.sin(degreesToRadians(midAngle - 90));

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      midAngle,
      labelX,
      labelY,
      color: GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length],
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const legendFontSize = Math.round(12 * scale);
  const valueLabelFontSize = Math.round(13 * scale);
  const textColor = '#FFFFFF';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChart frame ${frame}.`);

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

        {/* Fatias da Pizza e Labels de Valor [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {pieSlices.map((slice, index) => {
          // Animação de rotação em sentido horário — cada fatia entra em sequência
          // Interpolamos o 'endAngle' da fatia para criar o efeito de "desenho"
          const animatedEndAngle = interpolate(
            frame,
            [10 + index * 5, 60 + index * 5], // Staggered start (5 frames de delay entre fatias)
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação do label de valor
          const labelOpacity = interpolate(
            frame,
            [50 + index * 5, 70 + index * 5],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );

          // Animação de "explosão" sutil para os labels (se a fatia for grande o suficiente)
          const labelExplodeOffset = interpolate(
            frame,
            [50 + index * 5, 70 + index * 5],
            [Math.round(10 * scale), 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );

          const midAngleRad = degreesToRadians(slice.midAngle - 90);
          const explodedLabelX = slice.labelX + labelExplodeOffset * Math.cos(midAngleRad);
          const explodedLabelY = slice.labelY + labelExplodeOffset * Math.sin(midAngleRad);


          // [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] - Label externo: mostrar apenas quando fatia > 5%
          const showPercentageLabel = slice.percentage > 5;

          return (
            <React.Fragment key={slice.label}>
              <path
                d={getPathData(centerX, centerY, pieRadius, slice.startAngle, animatedEndAngle)}
                fill={slice.color}
              />
              {showPercentageLabel && (
                <text
                  x={explodedLabelX}
                  y={explodedLabelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={valueLabelFontSize}
                  fontWeight={600}
                  fill={textColor}
                  opacity={labelOpacity}
                  style={{ textShadow: labelTextShadow }}
                >
                  {formatPercentage(slice.percentage)}
                </text>
              )}
            </React.Fragment>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {/* Posição direita, alinhada verticalmente */}
        <g>
          {pieSlices.map((slice, index) => {
            const legendItemX = centerX + pieRadius + Math.round(50 * scale); // À direita do gráfico
            const legendItemY = centerY - pieRadius + index * Math.round(25 * scale); // Alinhamento vertical

            const legendOpacity = interpolate(
              frame,
              [60 + index * 5, 80 + index * 5], // Staggered appearance
              [0, 1],
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_SUBTLE,
              }
            );

            return (
              <g key={`legend-${slice.label}`} opacity={legendOpacity}>
                {/* Quadrado de cor */}
                <rect
                  x={legendItemX}
                  y={legendItemY - Math.round(7 * scale)} // Ajuste para centralizar o texto
                  width={Math.round(14 * scale)}
                  height={Math.round(14 * scale)}
                  fill={slice.color}
                />
                {/* Label da legenda */}
                <text
                  x={legendItemX + Math.round(20 * scale)}
                  y={legendItemY}
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                  dominantBaseline="middle"
                >
                  {slice.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
