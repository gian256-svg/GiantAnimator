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

interface PieChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
  }>;
}

// Helper para converter coordenadas polares para cartesianas
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  // Subtrai 90 para que 0 graus comece no topo (12 horas) e aumente no sentido horário
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
};

// Helper para gerar o caminho SVG de uma fatia de pizza
const getPieSlicePath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  // [EDGE CASES E ROBUSTEZ] - Previne NaN ou caminhos inválidos para ângulos muito pequenos/zero ou raio zero
  if (radius <= 0 || endAngle <= startAngle) {
    return `M ${centerX} ${centerY} L ${centerX} ${centerY} Z`; // Retorna um ponto no centro
  }

  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);

  // A flag large-arc determina se o arco deve ser maior ou menor que 180 graus
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', centerX, centerY, // Move para o centro
    'L', start.x, start.y, // Linha para o início do arco
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y, // Arco
    'Z', // Fecha o caminho de volta ao centro
  ].join(' ');
};

// Helper para formatação de números como percentual [REGRAS DE TIPOGRAFIA E LABELS]
const formatPercentage = (num: number): string => {
  // Sempre 1 casa decimal para percentual
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
};

// [REGRAS DE CORES] - Paleta padrão GiantAnimator (quando sem referência)
const defaultColors = [
  '#7CB5EC', // Série 1: azul suave
  '#F7A35C', // Série 2: laranja
  '#90ED7D', // Série 3: verde
  '#E4D354', // Série 4: amarelo
  '#8085E9', // Série 5: roxo
  '#F15C80', // Série 6: rosa
  '#2B908F', // Série 7: teal
  '#E75480', // Série 8: magenta
];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // Mínimo 40px em todos os lados
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const LEGEND_WIDTH = Math.round(200 * scale); // Espaço reservado para a legenda à direita

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  // Centro do gráfico de pizza, considerando o espaço para a legenda
  const pieCenterX = PLOT_AREA_PADDING + (chartWidth - LEGEND_WIDTH) / 2;
  const pieCenterY = PLOT_AREA_PADDING + TITLE_HEIGHT + chartHeight / 2;
  // Raio da pizza, garantindo que caiba no espaço disponível e tenha um respiro visual
  const pieRadius = Math.min((chartWidth - LEGEND_WIDTH) / 2, chartHeight / 2) - Math.round(20 * scale);

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

  // Calcula o valor total e as porcentagens para cada fatia
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Prepara os dados das fatias com ângulos iniciais/finais e cores
  let currentAngle = 0; // Ângulo de partida para a primeira fatia (topo do círculo)
  const slicesData = data.map((item, index) => {
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const angle = totalValue > 0 ? (item.value / totalValue) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: defaultColors[index % defaultColors.length], // Atribui cores da paleta padrão
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const sliceLabelFontSize = Math.round(12 * scale);
  const legendLabelFontSize = Math.round(12 * scale);

  // Cores de texto
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

        {/* Fatias da Pizza e seus Labels */}
        {slicesData.map((slice, index) => {
          // Animação da fatia: rotação em sentido horário, cada fatia entra em sequência
          // (+5 frames de delay entre fatias)
          const animationStartFrame = 10 + index * 5;
          const animationEndFrame = animationStartFrame + 50; // Duração de 50 frames para o crescimento da fatia

          // O ângulo final animado vai de `startAngle` até `endAngle` da fatia
          const animatedEndAngle = interpolate(
            frame,
            [animationStartFrame, animationEndFrame],
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp', // [EDGE CASES E ROBUSTEZ] - Clampar interpolação
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const currentSlicePath = getPieSlicePath(
            pieCenterX,
            pieCenterY,
            pieRadius,
            slice.startAngle,
            animatedEndAngle // Usa o ângulo final animado
          );

          // Posição do label da fatia: no centro da fatia (0.7 * raio)
          const midAngle = (slice.startAngle + animatedEndAngle) / 2; // Use animated end angle for label position
          const labelRadius = pieRadius * 0.7; // Posiciona labels a 70% do raio (internamente)
          const labelCoords = polarToCartesian(pieCenterX, pieCenterY, labelRadius, midAngle);

          // Animação do label da fatia [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(frame, [animationEndFrame - 10, animationEndFrame + 10], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          return (
            <React.Fragment key={slice.label}>
              <path
                d={currentSlicePath}
                fill={slice.color}
                opacity={1} // Opacidade fixa, a animação é no `d` do path
              />
              {/* Label de valor (percentagem) [REGRAS POR TIPO DE GRÁFICO -> Pie/Donut Chart]
                  Mostrar apenas quando a fatia for maior que 5% e o ângulo já tiver progredido o suficiente.
                  Nota: A regra "Label externo" sugere fora, mas para clareza em pie charts sem referência visual,
                  labels internos em 70% do raio são uma prática comum para evitar sobreposição com a legenda.
              */}
              {slice.percentage > 5 && (
                <text
                  x={labelCoords.x}
                  y={labelCoords.y + Math.round(sliceLabelFontSize / 3)} // Ajuste vertical para centralizar
                  textAnchor="middle"
                  fontSize={sliceLabelFontSize}
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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie/Donut Chart] */}
        <g>
          {slicesData.map((slice, index) => {
            const legendX = width - PLOT_AREA_PADDING - LEGEND_WIDTH + Math.round(20 * scale);
            // Posição da legenda: alinhavada verticalmente, 25px de altura por item
            const legendY = PLOT_AREA_PADDING + TITLE_HEIGHT + index * Math.round(25 * scale);

            // Animação da legenda: aparece com fade e um pequeno deslocamento lateral
            const legendAnimationStart = 60 + index * 5; // Staggered start
            const legendAnimationEnd = legendAnimationStart + 20; // 20 frames duration

            const legendOpacity = interpolate(frame, [legendAnimationStart, legendAnimationEnd], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            });
            const legendXOffsetAnimation = interpolate(frame, [legendAnimationStart, legendAnimationEnd], [Math.round(20 * scale), 0], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            });

            return (
              <g
                key={`legend-${slice.label}`}
                opacity={legendOpacity}
                transform={`translate(${legendXOffsetAnimation}, 0)`}
              >
                {/* Quadrado de cor da legenda */}
                <rect
                  x={legendX}
                  y={legendY}
                  width={Math.round(10 * scale)}
                  height={Math.round(10 * scale)}
                  fill={slice.color}
                  rx={Math.round(2 * scale)} // Pequeno arredondamento para o swatch de cor
                  ry={Math.round(2 * scale)}
                />
                {/* Texto do label da legenda */}
                <text
                  x={legendX + Math.round(18 * scale)} // 18px de padding entre o quadrado e o texto
                  y={legendY + Math.round(9 * scale)} // Alinha o texto verticalmente com o centro do quadrado
                  fontSize={legendLabelFontSize}
                  fill={legendTextColor}
                  fontWeight={400}
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
