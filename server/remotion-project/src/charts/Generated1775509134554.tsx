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

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, isPercentage: boolean = false, decimals: number = 0): string => {
  // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN ou Infinity
  if (isNaN(num) || !isFinite(num)) {
    return isPercentage ? 'N/A%' : 'N/A';
  }

  if (isPercentage) {
    return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
  }
  // < 1.000: mostrar inteiro
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  // 1.000–999.999: usar "k"
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  // ≥ 1.000.000: usar "M"
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para converter coordenadas polares para cartesianas
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN nos cálculos de Math.cos/sin
  const safeX = isNaN(centerX + (radius * Math.cos(angleInRadians))) ? centerX : centerX + (radius * Math.cos(angleInRadians));
  const safeY = isNaN(centerY + (radius * Math.sin(angleInRadians))) ? centerY : centerY + (radius * Math.sin(angleInRadians));
  return { x: safeX, y: safeY };
};

// Helper para gerar o caminho SVG de um arco para uma fatia de pizza
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle); // Fim do arco
  const end = polarToCartesian(x, y, radius, startAngle); // Início do arco
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  // Se o ângulo for zero ou muito pequeno, desenha um círculo completo (ou nada se start/end são iguais)
  // [EDGE CASES E ROBUSTEZ] - Se a fatia é muito pequena, pode causar problemas de rendering com path.
  // Desenhar uma pequena linha ou ponto se o raio for 0 ou ângulo for 0.
  if (radius <= 0.1 || Math.abs(endAngle - startAngle) < 0.1) {
    return `M ${x} ${y} Z`; // Retorna um ponto no centro ou um path inválido
  }

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", x, y, // Conecta ao centro
    "Z" // Fecha o caminho
  ].join(" ");
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
  const TITLE_HEIGHT = Math.round(24 * scale);
  const LEGEND_WIDTH = Math.round(200 * scale); // Espaço para a legenda na direita

  // Ajusta o espaço disponível para o gráfico de pizza, considerando o título e a legenda
  const availableChartWidth = width - 2 * PLOT_AREA_PADDING - LEGEND_WIDTH;
  const availableChartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  const pieRadius = Math.min(availableChartWidth, availableChartHeight) / 2;
  const centerX = PLOT_AREA_PADDING + availableChartWidth / 2;
  const centerY = PLOT_AREA_PADDING + TITLE_HEIGHT + availableChartHeight / 2;

  // Cores [REGRAS DE CORES] - Paleta padrão GiantAnimator
  const colors = [
    '#7CB5EC', '#F7A35C', '#90ED7D', '#E4D354', '#8085E9', '#F15C80', '#2B908F', '#E75480'
  ];
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999'; // Para percentuais e texto secundário
  const legendTextColor = '#CCCCCC'; // Cor da legenda
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

  // Calcular o valor total para percentagens
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // Calcular ângulos para cada fatia
  let currentAngle = 0;
  const pieSlices = data.map((item, index) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const sliceAngle = totalValue > 0 ? (item.value / totalValue) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage: percentage,
      startAngle: startAngle,
      endAngle: endAngle,
      color: colors[index % colors.length], // Ciclo de cores
      index: index,
    };
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
          fontSize={Math.round(18 * scale)}
          fontWeight={700}
          fill={textColor}
          style={{ textShadow: labelTextShadow }}
        >
          {title}
        </text>

        {/* Fatias do Pie Chart [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {pieSlices.map((slice, index) => {
          // Animação de rotação em sentido horário, cada fatia entra em sequência
          const animatedEndAngle = interpolate(
            frame,
            [10 + index * 5, 70 + index * 5], // staggered start (5 frames de delay)
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          return (
            <path
              key={slice.label}
              d={describeArc(centerX, centerY, pieRadius, slice.startAngle, animatedEndAngle)}
              fill={slice.color}
              stroke="#1a1a2e" // Cor de fundo para criar a separação visual entre as fatias
              strokeWidth={Math.round(2 * scale)}
            />
          );
        })}

        {/* Labels externos e linhas conectando [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {pieSlices.map((slice, index) => {
          // Apenas mostrar label se a fatia for > 5% [Regra de Ouro Visual]
          if (slice.percentage < 5) return null;

          const midAngle = (slice.startAngle + slice.endAngle) / 2;
          const initialLineRadius = pieRadius + Math.round(5 * scale); // Ponto inicial da linha
          const midLineRadius = pieRadius + Math.round(25 * scale); // Ponto médio da linha
          const labelTextPadding = Math.round(5 * scale); // Padding do texto à linha
          const horizontalLineLength = Math.round(20 * scale); // Comprimento da linha horizontal extra

          const lineStartPoint = polarToCartesian(centerX, centerY, initialLineRadius, midAngle);
          const lineMidPoint = polarToCartesian(centerX, centerY, midLineRadius, midAngle);

          // Determinar se o label deve estar à esquerda ou à direita do centro
          const isRightSide = midAngle <= 90 || midAngle >= 270;
          const labelX = isRightSide ? lineMidPoint.x + horizontalLineLength + labelTextPadding : lineMidPoint.x - horizontalLineLength - labelTextPadding;
          const textAnchor = isRightSide ? "start" : "end";

          // Animação de aparição dos labels
          const labelOpacity = interpolate(frame, [70 + index * 5, 90 + index * 5], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const labelYOffsetAnimation = interpolate(frame, [70 + index * 5, 90 + index * 5], [Math.round(10 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          return (
            <g key={`label-${slice.label}`} opacity={labelOpacity}>
              {/* Primeira parte da linha (do gráfico para fora) */}
              <line
                x1={lineStartPoint.x}
                y1={lineStartPoint.y}
                x2={lineMidPoint.x}
                y2={lineMidPoint.y}
                stroke={slice.color}
                strokeWidth={Math.round(1 * scale)}
              />
              {/* Segunda parte da linha (horizontal) */}
              <line
                x1={lineMidPoint.x}
                y1={lineMidPoint.y}
                x2={isRightSide ? lineMidPoint.x + horizontalLineLength : lineMidPoint.x - horizontalLineLength}
                y2={lineMidPoint.y}
                stroke={slice.color}
                strokeWidth={Math.round(1 * scale)}
              />
              {/* Texto do Label (Nome) */}
              <text
                x={labelX}
                y={lineMidPoint.y - Math.round(2 * scale) - labelYOffsetAnimation} // Ajuste vertical para nome
                textAnchor={textAnchor}
                fontSize={Math.round(12 * scale)}
                fill={textColor}
                fontWeight={400}
                style={{ textShadow: labelTextShadow }}
              >
                {slice.label}
              </text>
              {/* Texto do Label (Percentagem) */}
              <text
                x={labelX}
                y={lineMidPoint.y + Math.round(10 * scale) - labelYOffsetAnimation} // Posição abaixo do nome
                textAnchor={textAnchor}
                fontSize={Math.round(11 * scale)}
                fill={axisTextColor} // Usar cor de texto mais sutil para o percentual
                fontWeight={600}
                style={{ textShadow: labelTextShadow }}
              >
                {formatNumber(slice.percentage, true, 1)}
              </text>
            </g>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        <g
          transform={`translate(${width - PLOT_AREA_PADDING - LEGEND_WIDTH + Math.round(20 * scale)}, ${centerY - pieSlices.length / 2 * Math.round(25 * scale)})`}
        >
          {pieSlices.map((slice, index) => {
            const legendItemY = index * Math.round(25 * scale); // Espaçamento entre itens da legenda

            const legendOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            return (
              <g key={`legend-${slice.label}`} transform={`translate(0, ${legendItemY})`} opacity={legendOpacity}>
                <rect x="0" y={-Math.round(8 * scale)} width={Math.round(16 * scale)} height={Math.round(16 * scale)} fill={slice.color} rx={Math.round(2 * scale)} ry={Math.round(2 * scale)} />
                <text
                  x={Math.round(24 * scale)}
                  y={Math.round(8 * scale)}
                  fontSize={Math.round(12 * scale)}
                  fill={legendTextColor} // Cor da legenda
                  fontWeight={400}
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
