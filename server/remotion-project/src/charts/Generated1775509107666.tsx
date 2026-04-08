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
  value: number; // Percentual, espera-se que a soma seja 100
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

// Helper para formatação de percentuais [REGRAS DE TIPOGRAFIA E LABELS]
const formatPercentage = (num: number): string => {
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
};

// Paleta padrão GiantAnimator [REGRAS DE CORES]
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

  const chartAreaWidth = width - 2 * PLOT_AREA_PADDING - LEGEND_WIDTH; // Dedicar espaço para legenda
  const chartAreaHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  const centerX = PLOT_AREA_PADDING + chartAreaWidth / 2;
  const centerY = PLOT_AREA_PADDING + TITLE_HEIGHT + chartAreaHeight / 2;
  const radius = Math.min(chartAreaWidth, chartAreaHeight) / 2 - Math.round(20 * scale); // Deixa um pequeno respiro
  const innerRadius = 0; // Para Pie Chart, o buraco interno é 0

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0 || data.every(d => d.value === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty for PieChart. Displaying fallback.`);
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
  let currentAngle = 0; // Ângulo inicial para desenhar as fatias
  const pieSlices = data.map((item, index) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + (item.value / totalValue) * 360;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length],
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale);
  const legendLabelFontSize = Math.round(12 * scale);
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999'; // Não usado diretamente, mas mantido para consistência
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

        {/* Fatias do Gráfico de Pizza [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {pieSlices.map((slice, index) => {
          // Animação de cada fatia [REGRAS DE ANIMAÇÃO]
          // Cada fatia entra em sequência (+5 frames de delay)
          const sliceAnimationStartFrame = 10 + index * 5;
          const sliceAnimationEndFrame = 60 + index * 5;

          const animatedAngle = interpolate(
            frame,
            [sliceAnimationStartFrame, sliceAnimationEndFrame],
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const endAngleForPath = slice.value === 0 ? slice.startAngle : animatedAngle;

          // Converter ângulos para coordenadas cartesianas
          const getCoordinatesForAngle = (angle: number, r: number) => {
            const x = centerX + r * Math.cos((angle - 90) * Math.PI / 180);
            const y = centerY + r * Math.sin((angle - 90) * Math.PI / 180);
            // [EDGE CASES E ROBUSTEZ] - Garantir que não haja NaN
            return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y };
          };

          const start = getCoordinatesForAngle(slice.startAngle, radius);
          const end = getCoordinatesForAngle(endAngleForPath, radius);

          const largeArcFlag = endAngleForPath - slice.startAngle <= 180 ? 0 : 1;

          // Path SVG para a fatia
          const pathData = [
            `M ${centerX} ${centerY}`, // Move para o centro
            `L ${start.x} ${start.y}`, // Linha para o ponto inicial do arco
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`, // Arco
            `Z` // Fecha o caminho de volta ao centro
          ].join(' ');

          // Animação do label de valor [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(frame, [50 + index * 5, 70 + index * 5], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const labelYOffsetAnimation = interpolate(frame, [50 + index * 5, 70 + index * 5], [Math.round(10 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          // Posição do label externo
          const midAngle = (slice.startAngle + animatedAngle) / 2; // Usa animatedAngle para a posição do label
          const labelRadius = radius + Math.round(20 * scale); // Distância do centro para o label
          const labelCoords = getCoordinatesForAngle(midAngle, labelRadius);

          // [PIE CHART RULE] - Label externo: mostrar apenas quando fatia > 5%
          const showLabel = slice.percentage > 5;

          return (
            <React.Fragment key={slice.label}>
              <path
                d={pathData}
                fill={slice.color}
                opacity={interpolate(frame, [sliceAnimationStartFrame, sliceAnimationStartFrame + 10], [0, 1], {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_SUBTLE,
                })}
              />
              {showLabel && (
                <text
                  x={labelCoords.x}
                  y={labelCoords.y - labelYOffsetAnimation}
                  textAnchor="middle"
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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {/* Posição: direita, alinhada verticalmente */}
        <g transform={`translate(${centerX + radius + PLOT_AREA_PADDING + Math.round(10 * scale)}, ${centerY - radius})`}>
          {pieSlices.map((slice, index) => {
            const legendOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
            });

            const legendY = index * Math.round(20 * scale); // Espaçamento entre itens da legenda
            const rectSize = Math.round(10 * scale);

            return (
              <g key={`legend-${slice.label}`} opacity={legendOpacity} transform={`translate(0, ${legendY})`}>
                <rect
                  x={0}
                  y={0}
                  width={rectSize}
                  height={rectSize}
                  fill={slice.color}
                  rx={Math.round(2 * scale)} // Pequeno arredondamento para a cor da legenda
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={rectSize + Math.round(8 * scale)}
                  y={rectSize - Math.round(2 * scale)} // Ajuste para alinhamento vertical com o quadrado
                  fontSize={legendLabelFontSize}
                  fill={legendTextColor}
                >
                  {`${slice.label}`}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
