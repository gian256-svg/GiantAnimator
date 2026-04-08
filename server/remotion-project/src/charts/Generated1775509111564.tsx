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
const formatNumber = (num: number, isPercentage: boolean = false, decimals: number = 0): string => {
  if (isPercentage) {
    return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
  }
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Converte graus para radianos
const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

// Função para obter coordenadas na circunferência [PIE CHART]
const getCoordinatesForAngle = (angle: number, radius: number, centerX: number, centerY: number) => {
  const x = centerX + radius * Math.cos(degreesToRadians(angle));
  const y = centerY + radius * Math.sin(degreesToRadians(angle));
  return { x, y };
};

// Função para gerar o caminho SVG de um arco de pizza [PIE CHART]
const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = getCoordinatesForAngle(startAngle, radius, centerX, centerY);
  const end = getCoordinatesForAngle(endAngle, radius, centerX, centerY);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  // Se o ângulo for muito pequeno (quase 0), para evitar problemas no SVG
  if (endAngle - startAngle < 0.001) {
    return `M ${centerX} ${centerY}`;
  }

  // O path do arco:
  // M startX startY (move para o ponto inicial do arco)
  // A radius radius 0 largeArcFlag sweepFlag endX endY (desenha o arco)
  // L centerX centerY (linha de volta para o centro)
  // Z (fecha o path)
  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    `L ${centerX} ${centerY}`,
    `Z`,
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
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const LEGEND_WIDTH = Math.round(200 * scale); // Largura para a legenda à direita

  const chartAreaWidth = width - 2 * PLOT_AREA_PADDING;
  const chartAreaHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  const centerX = PLOT_AREA_PADDING + (chartAreaWidth - LEGEND_WIDTH) / 2;
  const centerY = PLOT_AREA_PADDING + TITLE_HEIGHT + chartAreaHeight / 2;

  // Raio do gráfico de pizza [REGRAS DE ESTRUTURA E LAYOUT]
  const pieRadius = Math.min((chartAreaWidth - LEGEND_WIDTH) / 2, chartAreaHeight / 2) - Math.round(30 * scale); // -30px para dar espaço aos labels

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

  // Processamento dos dados para o Pie Chart
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
  if (totalValue === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Total value is zero. Displaying fallback.`);
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
        Total dos valores é zero.
      </div>
    );
  }

  let currentAngle = -90; // Começa no topo (-90 graus)
  const pieSlices = data.map((item, index) => {
    const percentage = item.value / totalValue;
    const sliceAngle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage: percentage * 100,
      startAngle,
      endAngle, // final end angle
      color: GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length],
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale);
  const legendFontSize = Math.round(12 * scale);
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

        {/* Fatias da Pizza [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {pieSlices.map((slice, index) => {
          // Animação da fatia: rotação em sentido horário — cada fatia entra em sequência
          // O endAngle da fatia anima do seu startAngle até o endAngle final.
          const sliceAnimationStartFrame = 10 + index * 5; // Staggered delay de 5 frames
          const animatedEndAngle = interpolate(
            frame,
            [sliceAnimationStartFrame, sliceAnimationStartFrame + 60], // 60 frames de duração para cada fatia
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Path para a fatia atual (com o ângulo animado)
          const d = describeArc(centerX, centerY, pieRadius, slice.startAngle, animatedEndAngle);

          // Posição para o label externo
          const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
          const labelRadius = pieRadius + Math.round(20 * scale); // Distância do centro para o label
          const lineStartRadius = pieRadius + Math.round(5 * scale); // Onde a linha de conexão começa
          const lineEndRadius = pieRadius + Math.round(15 * scale); // Onde a linha de conexão termina
          
          const labelCoords = getCoordinatesForAngle(midAngle, labelRadius, centerX, centerY);
          const lineStartCoords = getCoordinatesForAngle(midAngle, lineStartRadius, centerX, centerY);
          const lineEndCoords = getCoordinatesForAngle(midAngle, lineEndRadius, centerX, centerY);

          const labelOffsetDirection = midAngle > -90 && midAngle < 90 ? 1 : -1; // Ajusta a direção do texto para não ficar sobreposto
          const textAnchor = midAngle > -90 && midAngle < 90 ? 'start' : 'end';
          const labelX = labelCoords.x + (labelOffsetDirection * Math.round(5 * scale)); // Pequeno ajuste
          const labelY = labelCoords.y + Math.round(labelFontSize / 3);

          // Animação de opacidade para o label
          const labelOpacity = interpolate(frame, [sliceAnimationStartFrame + 40, sliceAnimationStartFrame + 70], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          // [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] - Label externo: mostrar apenas quando fatia > 5%
          const showLabel = slice.percentage >= 5;

          return (
            <React.Fragment key={slice.label}>
              <path
                d={d}
                fill={slice.color}
                opacity={1}
              />
              {showLabel && (
                <>
                  {/* Linha de conexão para o label */}
                  <line
                    x1={lineStartCoords.x}
                    y1={lineStartCoords.y}
                    x2={lineEndCoords.x}
                    y2={lineEndCoords.y}
                    stroke={slice.color}
                    strokeWidth={Math.round(1 * scale)}
                    opacity={labelOpacity}
                  />
                   {/* Linha horizontal para o label (se necessário para alinhamento) */}
                   <line
                    x1={lineEndCoords.x}
                    y1={lineEndCoords.y}
                    x2={lineEndCoords.x + (labelOffsetDirection * Math.round(15 * scale))} // Extende um pouco
                    y2={lineEndCoords.y}
                    stroke={slice.color}
                    strokeWidth={Math.round(1 * scale)}
                    opacity={labelOpacity}
                  />

                  {/* Label da fatia */}
                  <text
                    x={labelX + (labelOffsetDirection * Math.round(15 * scale))} // Ajuste final para a posição do texto
                    y={labelY}
                    textAnchor={textAnchor}
                    fontSize={labelFontSize}
                    fontWeight={600}
                    fill={textColor}
                    opacity={labelOpacity}
                    style={{ textShadow: labelTextShadow }}
                  >
                    {slice.label} ({formatNumber(slice.percentage, true, 1)})
                  </text>
                </>
              )}
            </React.Fragment>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        <g
          transform={`translate(${width - PLOT_AREA_PADDING - LEGEND_WIDTH + Math.round(20 * scale)}, ${centerY - pieSlices.length * Math.round(15 * scale) / 2})`}
        >
          {pieSlices.map((slice, index) => {
            const legendItemOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            return (
              <g key={`legend-${slice.label}`} opacity={legendItemOpacity}>
                <rect
                  x={0}
                  y={index * Math.round(30 * scale)}
                  width={Math.round(10 * scale)}
                  height={Math.round(10 * scale)}
                  fill={slice.color}
                  rx={Math.round(2 * scale)} // Pequeno arredondamento
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={Math.round(18 * scale)}
                  y={index * Math.round(30 * scale) + Math.round(9 * scale)}
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                >
                  {slice.label} ({formatNumber(slice.percentage, true, 1)})
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
