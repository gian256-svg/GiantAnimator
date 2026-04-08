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
  '#7CB5EC', // azul suave — Highcharts default
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

interface PieChartData {
  label: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

// Helper para formatar percentual [REGRAS DE TIPOGRAFIA E LABELS]
const formatPercentage = (num: number): string => {
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
};

// Helper para converter coordenadas polares em cartesianas
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
};

// Helper para descrever o path de um arco SVG
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  // Caso especial para um círculo completo para evitar bugs de renderização do SVG path 'A'
  if (Math.abs(endAngle - startAngle) >= 360) {
    return [
      `M ${x - radius} ${y}`,
      `A ${radius} ${radius} 0 1 1 ${x + radius} ${y}`,
      `A ${radius} ${radius} 0 1 1 ${x - radius} ${y}`,
      `Z`
    ].join(' ');
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  // Se o arco é muito pequeno (quase um ponto), desenha uma linha para o centro para evitar caminhos inválidos
  if (Math.abs(start.x - end.x) < 0.001 && Math.abs(start.y - end.y) < 0.001 && (endAngle - startAngle) < 1) {
    return `M ${x} ${y} L ${end.x} ${end.y} Z`;
  }

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', x, y,
    'Z',
  ].join(' ');
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
  const PLOT_AREA_PADDING = Math.round(40 * scale);
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const LEGEND_WIDTH = Math.round(180 * scale); // Espaço para a legenda à direita

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  const pieCenterX = PLOT_AREA_PADDING + (chartWidth - LEGEND_WIDTH) / 2;
  const pieCenterY = PLOT_AREA_PADDING + TITLE_HEIGHT + chartHeight / 2;

  // Pie/Donut Chart Rules - Raio [REGRAS POR TIPO DE GRÁFICO -> Pie/Donut Chart]
  const outerRadius = Math.min((chartWidth - LEGEND_WIDTH) / 2, chartHeight / 2) - Math.round(20 * scale); // Deixar algum padding
  // const innerRadius = 0; // Para um Pie Chart, innerRadius é 0

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0 || data.every(d => d.value <= 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty for Pie Chart. Displaying fallback.`);
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

  const totalValue = data.reduce((sum, item) => sum + Math.max(0, item.value), 0); // Ignorar valores negativos para o total
  
  // [REGRAS DE TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale);
  const legendFontSize = Math.round(12 * scale);
  const textColor = '#FFFFFF';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';
  const legendTextColor = '#CCCCCC';

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

  // Pré-calcula os ângulos iniciais e finais de cada fatia para garantir a sequência e precisão
  const slicesWithAngles = data.map((item, index, arr) => {
    // Calcula o ângulo inicial somando os percentuais das fatias anteriores
    const prevSlicesValue = arr.slice(0, index).reduce((sum, prevItem) => sum + Math.max(0, prevItem.value), 0);
    const startAngle = (prevSlicesValue / totalValue) * 360;

    const value = Math.max(0, item.value); // Garante valor não-negativo
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    const endAngle = startAngle + (percentage * 3.6); // 3.6 graus por percentual (360/100)

    return {
      ...item,
      startAngle,
      endAngle,
      percentage,
    };
  });

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

        {/* Fatias do Pie Chart */}
        {slicesWithAngles.map((item, index) => {
          const color = GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length];

          // Animação de cada fatia (expansão angular) [REGRAS DE ANIMAÇÃO]
          // Pie/Donut: rotação em sentido horário — cada fatia entra em sequência (+5 frames de delay)
          const sliceAnimationStartFrame = 10 + index * 5; // Início escalonado
          const sliceAnimationEndFrame = sliceAnimationStartFrame + 30; // Duração da animação da fatia

          // Interpola o ângulo final da fatia, expandindo-a a partir do seu ângulo inicial
          const animatedEndAngle = interpolate(
            frame,
            [sliceAnimationStartFrame, sliceAnimationEndFrame],
            [item.startAngle, item.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const sliceOpacity = interpolate(
            frame,
            [sliceAnimationStartFrame, sliceAnimationEndFrame],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          // Posição para o label de percentual (no centro da fatia finalizada)
          const midAngleForLabel = item.startAngle + (item.percentage * 3.6) / 2;
          const labelRadius = outerRadius * 0.7; // Posição interna, mais próxima do centro
          const labelCoords = polarToCartesian(pieCenterX, pieCenterY, labelRadius, midAngleForLabel);

          // Label externo: mostrar apenas quando fatia > 5% [REGRAS POR TIPO DE GRÁFICO -> Pie/Donut]
          const showLabel = item.percentage >= 5;

          // Animação do label [REGRAS DE ANIMAÇÃO]
          const labelAnimationStartFrame = sliceAnimationEndFrame - 10;
          const labelAnimationEndFrame = sliceAnimationEndFrame + 10;
          const labelOpacity = interpolate(
            frame,
            [labelAnimationStartFrame, labelAnimationEndFrame],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );
          const labelScale = interpolate(
            frame,
            [labelAnimationStartFrame, labelAnimationEndFrame],
            [0.8, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Evitar paths inválidos para fatias muito pequenas ou durante o início da animação
          const minRenderAngle = 0.1; // Ângulo mínimo em graus para renderizar um path de fatia
          const actualArcAngle = animatedEndAngle - item.startAngle;

          const pathD = (item.percentage > 0.01 && actualArcAngle >= minRenderAngle)
            ? describeArc(pieCenterX, pieCenterY, outerRadius, item.startAngle, animatedEndAngle)
            : '';

          return (
            <React.Fragment key={item.label}>
              {pathD && ( // Renderiza o path apenas se for válido
                <path
                  d={pathD}
                  fill={color}
                  opacity={sliceOpacity}
                />
              )}
              {showLabel && (
                <text
                  x={labelCoords.x}
                  y={labelCoords.y + Math.round(labelFontSize / 3)} // Ajuste vertical para centralizar
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fontWeight={600}
                  fill={textColor}
                  opacity={labelOpacity}
                  transform={`scale(${labelScale})`}
                  transformOrigin={`${labelCoords.x}px ${labelCoords.y}px`}
                  style={{ textShadow: labelTextShadow }}
                >
                  {formatPercentage(item.percentage)}
                </text>
              )}
            </React.Fragment>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie/Donut] */}
        <g
          // Posiciona a legenda à direita do gráfico, centralizada verticalmente
          transform={`translate(${width - PLOT_AREA_PADDING - LEGEND_WIDTH + Math.round(20 * scale)}, ${pieCenterY - (data.length * Math.round(25 * scale)) / 2})`}
        >
          {data.map((item, index) => {
            const color = GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length];
            const legendItemY = index * Math.round(25 * scale); // Espaçamento entre itens da legenda

            // Animação de aparição da legenda [REGRAS DE ANIMAÇÃO]
            const legendOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            return (
              <g key={`legend-${item.label}`} opacity={legendOpacity}>
                <rect
                  x={0}
                  y={legendItemY}
                  width={Math.round(14 * scale)}
                  height={Math.round(14 * scale)}
                  fill={color}
                  rx={Math.round(3 * scale)} // Cantos arredondados
                  ry={Math.round(3 * scale)}
                />
                <text
                  x={Math.round(20 * scale)} // Espaçamento entre o quadrado de cor e o texto
                  y={legendItemY + Math.round(12 * scale)} // Alinhamento vertical com o quadrado
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                  fontWeight={400}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
