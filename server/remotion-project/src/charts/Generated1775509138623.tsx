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

// Converte graus para radianos
const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

// Função para obter coordenadas na circunferência (0 graus no lado direito, cresce sentido horário)
const getCoordinatesForAngle = (angle: number, radius: number, centerX: number, centerY: number) => {
  const x = centerX + radius * Math.cos(degreesToRadians(angle));
  const y = centerY + radius * Math.sin(degreesToRadians(angle));
  // [EDGE CASES E ROBUSTEZ] - Garantir que não haja NaN
  return { x: isNaN(x) ? centerX : x, y: isNaN(y) ? centerY : y };
};

// Função para gerar o caminho SVG de um arco de pizza [PIE CHART]
const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number, // em graus (0 = direita)
  endAngle: number // em graus (0 = direita)
): string => {
  // [EDGE CASES E ROBUSTEZ] - Garantir que o ângulo não seja negativo ou NaN e o raio seja válido
  const safeRadius = Math.max(0, radius);
  const safeStartAngle = isNaN(startAngle) ? 0 : startAngle;
  const safeEndAngle = isNaN(endAngle) ? 0 : endAngle;

  if (safeRadius <= 0 || safeEndAngle - safeStartAngle < 0.001) {
    return `M ${centerX},${centerY}`; // Retorna um ponto se raio zero ou ângulo muito pequeno
  }

  const start = getCoordinatesForAngle(safeStartAngle, safeRadius, centerX, centerY);
  const end = getCoordinatesForAngle(safeEndAngle, safeRadius, centerX, centerY);

  const largeArcFlag = safeEndAngle - safeStartAngle > 180 ? 1 : 0;

  return [
    `M ${centerX},${centerY}`,         // Mover para o centro do círculo
    `L ${start.x},${start.y}`,         // Linha do centro para o ponto inicial do arco
    `A ${safeRadius},${safeRadius} 0 ${largeArcFlag},1 ${end.x},${end.y}`, // O próprio arco
    `Z`,                               // Fecha o caminho de volta ao centro
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
  const TITLE_HEIGHT = Math.round(24 * scale); // Altura do título

  // Espaço para a legenda à direita [PIE CHART] - Legenda: posição direita, alinhada verticalmente
  const LEGEND_WIDTH = Math.round(220 * scale); // Um pouco mais de espaço para labels com percentual

  // Área efetiva para o gráfico de pizza e seus labels
  const availableChartWidth = width - (2 * PLOT_AREA_PADDING) - LEGEND_WIDTH;
  const availableChartHeight = height - (2 * PLOT_AREA_PADDING) - TITLE_HEIGHT;

  const centerX = PLOT_AREA_PADDING + availableChartWidth / 2;
  const centerY = PLOT_AREA_PADDING + TITLE_HEIGHT + availableChartHeight / 2;
  const pieRadius = Math.min(availableChartWidth, availableChartHeight) / 2 - Math.round(30 * scale); // Reduzir para dar espaço aos labels

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0 || data.every(d => d.value === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Sem dados fornecidos ou todos os valores são zero para PieChart. Exibindo fallback.`);
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

  // Calcular o valor total e as fatias
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = -90; // Começa no topo (12 horas) para o primeiro segmento.

  const pieSlices = data.map((item, index) => {
    const percentage = (item.value / totalValue) * 100;
    const sliceAngle = (item.value / totalValue) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Ponto médio do arco para o posicionamento do label
    const midAngle = startAngle + (sliceAngle / 2);
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      midAngle,
      color: GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length],
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale); // Para labels da fatia
  const legendLabelFontSize = Math.round(12 * scale); // Para labels da legenda
  const textColor = '#FFFFFF';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const chartScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando PieChart no frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a2e', // Fundo do canvas padrão dark
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntranceOpacity,
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
          // Animação da fatia: rotação em sentido horário — cada fatia entra em sequência (+5 frames de delay)
          const sliceAnimationStartFrame = 10 + index * 5;
          const sliceAnimationDuration = 60; // Duração da animação de cada fatia

          const animatedEndAngle = interpolate(
            frame,
            [sliceAnimationStartFrame, sliceAnimationStartFrame + sliceAnimationDuration],
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Path para a fatia (com o ângulo animado)
          const d = describeArc(centerX, centerY, pieRadius, slice.startAngle, animatedEndAngle);

          // Posição para o label externo [REGRAS POR TIPO DE GRÁFICO -> Pie Chart]
          // Label externo: mostrar apenas quando fatia > 5%
          const showLabel = slice.percentage >= 5;

          // Animação de opacidade para o label
          const labelOpacity = interpolate(
            frame,
            [sliceAnimationStartFrame + 40, sliceAnimationStartFrame + 70], // Atraso em relação à fatia
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );
          
          // Calculando a posição do label (um pouco para fora do centro)
          const labelOffsetRadius = pieRadius + Math.round(20 * scale); // Distância para o texto
          const labelCoords = getCoordinatesForAngle(slice.midAngle, labelOffsetRadius, centerX, centerY);
          
          // Alinhamento do texto para o label (esquerda/direita)
          const labelTextAnchor = slice.midAngle > -90 && slice.midAngle < 90 ? 'start' : 'end';
          
          // Para a linha de conexão do label
          const connectorLineStartCoords = getCoordinatesForAngle(slice.midAngle, pieRadius + Math.round(5 * scale), centerX, centerY);
          const connectorLineEndCoords = getCoordinatesForAngle(slice.midAngle, pieRadius + Math.round(15 * scale), centerX, centerY);

          // Linha horizontal para o label (para alinhar o texto mais nitidamente)
          const textLineX2 = labelCoords.x + (labelTextAnchor === 'start' ? Math.round(10 * scale) : -Math.round(10 * scale));
          
          return (
            <React.Fragment key={slice.label}>
              <path
                d={d}
                fill={slice.color}
              />
              {showLabel && (
                <>
                  {/* Linha de conexão do label */}
                  <line
                    x1={connectorLineStartCoords.x}
                    y1={connectorLineStartCoords.y}
                    x2={connectorLineEndCoords.x}
                    y2={connectorLineEndCoords.y}
                    stroke={slice.color}
                    strokeWidth={Math.round(1 * scale)}
                    opacity={labelOpacity}
                  />
                  {/* Extensão horizontal da linha de conexão */}
                  <line
                    x1={connectorLineEndCoords.x}
                    y1={connectorLineEndCoords.y}
                    x2={textLineX2}
                    y2={connectorLineEndCoords.y}
                    stroke={slice.color}
                    strokeWidth={Math.round(1 * scale)}
                    opacity={labelOpacity}
                  />
                  {/* Texto do Label (Nome e Percentual) */}
                  <text
                    x={textLineX2 + (labelTextAnchor === 'start' ? Math.round(5 * scale) : -Math.round(5 * scale))} // Ajuste final para o texto
                    y={connectorLineEndCoords.y + Math.round(labelFontSize / 3)} // Alinhamento vertical
                    textAnchor={labelTextAnchor}
                    fontSize={labelFontSize}
                    fontWeight={600}
                    fill={textColor}
                    opacity={labelOpacity}
                    style={{ textShadow: labelTextShadow }}
                  >
                    {`${slice.label} (${formatPercentage(slice.percentage)})`}
                  </text>
                </>
              )}
            </React.Fragment>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {/* Posição direita, alinhada verticalmente */}
        <g
          transform={`translate(${width - PLOT_AREA_PADDING - LEGEND_WIDTH + Math.round(20 * scale)}, ${centerY - pieSlices.length * Math.round(15 * scale) / 2})`}
        >
          {pieSlices.map((slice, index) => {
            const legendItemOpacity = interpolate(
              frame,
              [60 + index * 5, 80 + index * 5], // Staggered appearance para a legenda
              [0, 1],
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
              }
            );

            return (
              <g key={`legend-${slice.label}`} opacity={legendItemOpacity}>
                <rect
                  x={0}
                  y={index * Math.round(30 * scale)}
                  width={Math.round(10 * scale)}
                  height={Math.round(10 * scale)}
                  fill={slice.color}
                  rx={Math.round(2 * scale)} // Pequeno arredondamento para o marcador
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={Math.round(18 * scale)}
                  y={index * Math.round(30 * scale) + Math.round(9 * scale)} // Ajuste vertical
                  fontSize={legendLabelFontSize}
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
