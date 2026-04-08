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

interface PieChartData {
  label: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

// [REGRAS DE CORES] - Paleta padrão GiantAnimator
const GIANT_ANIMATOR_PALETTE = [
  '#7CB5EC', // azul suave
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

// Helper para formatação de porcentagem [REGRAS DE TIPOGRAFIA E LABELS]
const formatPercentage = (num: number, decimals: number = 1): string => {
  return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
};

interface Point {
  x: number;
  y: number;
}

// Converte coordenadas polares para cartesianas (0 graus = 3 horas, positivo = sentido horário)
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number): Point => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
};

// Gera o path SVG para uma fatia de pizza
const getPieSlicePath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);

  // largeArcFlag: 0 se o arco for <= 180 graus, 1 caso contrário
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  const sweepFlag = 1; // 1 para sentido horário

  return [
    `M ${centerX} ${centerY}`, // Move para o centro da pizza
    `L ${start.x} ${start.y}`, // Desenha uma linha do centro para o início do arco
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`, // Desenha o arco
    `Z`, // Fecha o caminho de volta para o centro
  ].join(' ');
};

export const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale);
  const TITLE_HEIGHT = Math.round(24 * scale);
  const LEGEND_WIDTH = Math.round(180 * scale); // Largura estimada para a legenda
  const LEGEND_PADDING = Math.round(20 * scale); // Espaçamento entre pizza e legenda

  // Calcular espaço disponível para o gráfico
  const chartContentWidth = width - 2 * PLOT_AREA_PADDING;
  const chartContentHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  // Calcular o raio máximo possível para a pizza, considerando o espaço da legenda
  const maxRadiusHorizontally = (chartContentWidth - LEGEND_WIDTH - LEGEND_PADDING) / 2;
  const maxRadiusVertically = chartContentHeight / 2;
  const pieRadius = Math.max(Math.round(50 * scale), Math.min(maxRadiusHorizontally, maxRadiusVertically)); // Raio mínimo 50px

  // Calcular a posição central da pizza
  const pieCenterX = PLOT_AREA_PADDING + pieRadius; // A pizza é deslocada para a esquerda para abrir espaço para a legenda
  const pieCenterY = PLOT_AREA_PADDING + TITLE_HEIGHT + chartContentHeight / 2;
  const pieCenter = { x: pieCenterX, y: pieCenterY };

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale);
  const legendFontSize = Math.round(12 * scale);
  const textColor = '#FFFFFF';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
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

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Preparar dados para as fatias da pizza, incluindo ângulos e cores
  let currentAngle = 0; // Começa em 0 graus (posição 3 horas)
  const slicesData = data.map((item, index) => {
    const percentage = (item.value / totalValue) * 100;
    const sliceAngle = (item.value / totalValue) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Animação de entrada das fatias [REGRAS DE ANIMAÇÃO]
    const animationStartFrame = 10 + index * 5; // Staggered entry (+5 frames de delay)
    const animationEndFrame = 60 + index * 5;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: GIANT_ANIMATOR_PALETTE[index % GIANT_ANIMATOR_PALETTE.length],
      animationStartFrame,
      animationEndFrame,
    };
  });

  // Animação de entrada geral do gráfico (fade + scale) [REGRAS DE ANIMAÇÃO]
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

        {/* Fatias da Pizza */}
        {slicesData.map((slice, index) => {
          // Animação de "desenho" da fatia [REGRAS DE ANIMAÇÃO]
          const animatedEndAngle = interpolate(
            frame,
            [slice.animationStartFrame, slice.animationEndFrame],
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Posição do label externo
          // [PIE CHART RULE] - Label externo: mostrar apenas quando fatia > 5%
          const showLabel = slice.percentage > 5;
          const midAngle = (slice.startAngle + animatedEndAngle) / 2;
          const labelOffset = Math.round(pieRadius * 0.4); // Distância para o label
          const labelMidPoint = polarToCartesian(pieCenter.x, pieCenter.y, pieRadius + Math.round(30 * scale), midAngle); // Ponto para o label

          // Animação do label de valor [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(
            frame,
            [slice.animationEndFrame - 10, slice.animationEndFrame + 10], // Aparece após a fatia terminar de animar
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );
          const labelYOffsetAnimation = interpolate(
            frame,
            [slice.animationEndFrame - 10, slice.animationEndFrame + 10],
            [Math.round(15 * scale), 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );


          return (
            <React.Fragment key={slice.label}>
              <path
                d={getPieSlicePath(pieCenter.x, pieCenter.y, pieRadius, slice.startAngle, animatedEndAngle)}
                fill={slice.color}
              />
              {showLabel && (
                <text
                  x={labelMidPoint.x}
                  y={labelMidPoint.y - labelYOffsetAnimation}
                  textAnchor={labelMidPoint.x > pieCenter.x ? 'start' : 'end'}
                  fontSize={labelFontSize}
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

        {/* Legenda [REGRAS DE ESTRUTURA E LAYOUT], [REGRAS DE TIPOGRAFIA E LABELS] */}
        {/* [PIE CHART RULE] - Legenda: posição direita, alinhada verticalmente */}
        <g transform={`translate(${pieCenter.x + pieRadius + LEGEND_PADDING}, ${pieCenter.y - (slicesData.length * Math.round(20 * scale)) / 2})`}>
          {slicesData.map((slice, index) => {
            const legendItemOpacity = interpolate(
              frame,
              [slice.animationStartFrame + 20, slice.animationEndFrame + 20], // Aparece após a fatia
              [0, 1],
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_SUBTLE,
              }
            );
            return (
              <g key={`legend-${slice.label}`} transform={`translate(0, ${index * Math.round(20 * scale)})`} opacity={legendItemOpacity}>
                <rect x={0} y={0} width={Math.round(10 * scale)} height={Math.round(10 * scale)} fill={slice.color} rx={Math.round(2 * scale)} ry={Math.round(2 * scale)} />
                <text x={Math.round(15 * scale)} y={Math.round(9 * scale)} fontSize={legendFontSize} fill={legendTextColor} fontWeight={400}>
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
