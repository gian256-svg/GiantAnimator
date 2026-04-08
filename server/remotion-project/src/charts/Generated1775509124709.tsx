import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig, AbsoluteFill, staticFile } from 'remotion';

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

interface LineChartProps {
  title: string;
  labels: string[]; // E.g., ["0", "1", "2", ...]
  series: Array<{
    label: string;
    data: number[];
  }>;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080); // Baseado em 1920x1080 como referência para a imagem original

  // Cores e Tipografia extraídas fielmente da imagem de referência [REGRA #1]
  const CANVAS_BG_COLOR = '#EEEEEE'; // Fundo do canvas (levemente mais claro que a área do gráfico)
  const PLOT_AREA_BG_COLOR = '#E8E8E8'; // Fundo da área do gráfico
  const TITLE_COLOR = '#333333';
  const AXIS_LABEL_COLOR = '#666666';
  const GRID_LINE_COLOR = '#D7D7D7';
  const LINE_SERIES_COLOR = '#667699'; // Azul acinzentado da linha
  const DOT_COLOR = '#667699';
  const HIGHEST_ARROW_COLOR = '#E42F2F'; // Vermelho para 'highest'
  const LOWEST_CROSS_COLOR = '#669966'; // Verde para 'lowest'
  const HIGHLIGHT_TEXT_COLOR = '#333333';
  const FONT_FAMILY = 'Arial, "Helvetica Neue", sans-serif'; // Fonte padrão que se assemelha à imagem

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  // As margens são inferidas da proporção da imagem original.
  const PLOT_AREA_PADDING_LEFT = Math.round(50 * scale);
  const PLOT_AREA_PADDING_RIGHT = Math.round(30 * scale);
  const PLOT_AREA_PADDING_TOP = Math.round(60 * scale); // Inclui espaço para título
  const PLOT_AREA_PADDING_BOTTOM = Math.round(40 * scale); // Inclui espaço para labels do eixo X

  const plotWidth = width - PLOT_AREA_PADDING_LEFT - PLOT_AREA_PADDING_RIGHT;
  const plotHeight = height - PLOT_AREA_PADDING_TOP - PLOT_AREA_PADDING_BOTTOM;

  const plotAreaX = PLOT_AREA_PADDING_LEFT;
  const plotAreaY = PLOT_AREA_PADDING_TOP;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: CANVAS_BG_COLOR,
          color: TITLE_COLOR,
          fontSize: Math.round(24 * scale),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: FONT_FAMILY,
          borderRadius: Math.round(8 * scale), // Borda arredondada do container
        }}
      >
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  const data = series[0].data; // Utiliza apenas a primeira série para este Line Chart
  const numPoints = data.length;

  // Determinar range do eixo Y fiel ao gráfico original: 400 a 550
  const minY = 400; // Extraído da imagem de referência
  const maxY = 550; // Extraído da imagem de referência
  const yRange = maxY - minY;

  // Encontrar pontos de maior e menor valor
  let highestValue = -Infinity;
  let highestIndex = -1;
  let lowestValue = Infinity;
  let lowestIndex = -1;

  data.forEach((value, index) => {
    if (value > highestValue) {
      highestValue = value;
      highestIndex = index;
    }
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = index;
    }
  });

  // Mapear valores de dados para coordenadas SVG
  const getX = (index: number) => plotAreaX + (index / (numPoints - 1)) * plotWidth;
  const getY = (value: number) => plotAreaY + plotHeight - ((value - minY) / yRange) * plotHeight;

  const points: [number, number][] = data.map((value, index) => [getX(index), getY(value)]);

  // Gerar caminho SVG para a linha [REGRAS POR TIPO DE GRÁFICO -> Line Chart]
  const linePath = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point[0]},${point[1]}`).join(' ');

  // Calcular comprimento do path para animação stroke-dashoffset
  const pathLength = React.useMemo(() => {
    // Para cálculo preciso, idealmente criar um SVG temporário ou usar uma lib
    // Para simplificar, vamos estimar como a soma das distâncias euclidianas entre os pontos.
    if (points.length < 2) return 0;
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      length += Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    }
    return length;
  }, [points]);

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

  // Animação de desenho da linha (strokeDashoffset)
  const lineDrawAnimation = interpolate(frame, [10, 60], [pathLength, 0], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  // Animação de opacidade dos elementos de texto e pontos
  const elementsOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering LineChart frame ${frame}.`);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(20 * scale); // Ajustado para ser fiel ao original
  const axisLabelFontSize = Math.round(12 * scale);
  const highlightLabelFontSize = Math.round(11 * scale);
  const dotRadius = Math.round(3 * scale); // Raio do ponto ajustado

  // Ticks do eixo Y (fiel à imagem: 400, 450, 500, 550)
  const yTickValues = [400, 450, 500, 550];
  // Labels do eixo X (fiel à imagem: 0, 2, 4, 6, 8, 10)
  const xLabelIndices = [0, 2, 4, 6, 8, 10]; // Índices dos pontos que terão label no eixo X

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CANVAS_BG_COLOR,
        fontFamily: FONT_FAMILY,
        borderRadius: Math.round(8 * scale), // Borda arredondada do container como no original
        overflow: 'hidden', // Para garantir que o borderRadius funcione
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Fundo da área do gráfico [REGRA #1] */}
        <rect
          x={plotAreaX}
          y={plotAreaY}
          width={plotWidth}
          height={plotHeight}
          fill={PLOT_AREA_BG_COLOR}
        />

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING_TOP - Math.round(20 * scale)} // Posição ajustada
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={TITLE_COLOR}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const yCoord = getY(tickValue);
          const labelYOffset = Math.round(axisLabelFontSize / 3); // Ajuste para centralizar texto

          return (
            <React.Fragment key={`grid-line-${tickValue}`}>
              <line
                x1={plotAreaX}
                y1={yCoord}
                x2={plotAreaX + plotWidth}
                y2={yCoord}
                stroke={GRID_LINE_COLOR}
                strokeWidth={1}
                opacity={elementsOpacity}
              />
              <text
                x={plotAreaX - Math.round(10 * scale)} // Padding à esquerda do eixo
                y={yCoord + labelYOffset}
                textAnchor="end"
                fontSize={axisLabelFontSize}
                fill={AXIS_LABEL_COLOR}
                opacity={elementsOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xLabelIndices.map((index) => {
          const xCoord = getX(index);
          const labelY = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo
          return (
            <text
              key={`x-label-${index}`}
              x={xCoord}
              y={labelY}
              textAnchor="middle"
              fontSize={axisLabelFontSize}
              fill={AXIS_LABEL_COLOR}
              opacity={elementsOpacity}
            >
              {labels[index]}
            </text>
          );
        })}

        {/* Linha do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={LINE_SERIES_COLOR}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={lineDrawAnimation}
        />

        {/* Pontos de Dados (Dots) [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {points.map((point, index) => {
          const dotScale = interpolate(
            frame,
            [40 + index * 2, 60 + index * 2], // staggered start (2 frames de delay entre pontos)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          return (
            <circle
              key={`dot-${index}`}
              cx={point[0]}
              cy={point[1]}
              r={dotRadius}
              fill={DOT_COLOR}
              transform={`scale(${dotScale})`}
              transformOrigin={`${point[0]}px ${point[1]}px`}
              opacity={elementsOpacity} // Opacidade geral
            />
          );
        })}

        {/* Marcador de Highest [REGRA #1] */}
        {highestIndex !== -1 && (
          <g opacity={elementsOpacity}>
            {/* Seta para cima */}
            <path
              d={`M ${points[highestIndex][0]} ${points[highestIndex][1] - Math.round(5 * scale)} 
                  L ${points[highestIndex][0] - Math.round(4 * scale)} ${points[highestIndex][1] - Math.round(12 * scale)}
                  H ${points[highestIndex][0] + Math.round(4 * scale)} Z`}
              fill={HIGHEST_ARROW_COLOR}
              transform={`translate(0, ${interpolate(frame, [60, 75], [Math.round(10 * scale), 0], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })})`}
            />
            {/* Texto "↑ highest" */}
            <text
              x={points[highestIndex][0] + Math.round(10 * scale)} // Deslocado para a direita da seta
              y={points[highestIndex][1] - Math.round(15 * scale)}
              textAnchor="start"
              fontSize={highlightLabelFontSize}
              fill={HIGHLIGHT_TEXT_COLOR}
              transform={`translate(0, ${interpolate(frame, [60, 75], [Math.round(10 * scale), 0], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })})`}
            >
              ↑ highest
            </text>
          </g>
        )}

        {/* Marcador de Lowest [REGRA #1] */}
        {lowestIndex !== -1 && (
          <g opacity={elementsOpacity}>
            {/* Cruz ('x') */}
            <line
              x1={points[lowestIndex][0] - Math.round(4 * scale)}
              y1={points[lowestIndex][1] + Math.round(6 * scale)}
              x2={points[lowestIndex][0] + Math.round(4 * scale)}
              y2={points[lowestIndex][1] + Math.round(14 * scale)}
              stroke={LOWEST_CROSS_COLOR}
              strokeWidth={Math.round(1.5 * scale)}
              strokeLinecap="round"
              transform={`translate(0, ${interpolate(frame, [65, 80], [Math.round(-10 * scale), 0], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })})`}
            />
            <line
              x1={points[lowestIndex][0] + Math.round(4 * scale)}
              y1={points[lowestIndex][1] + Math.round(6 * scale)}
              x2={points[lowestIndex][0] - Math.round(4 * scale)}
              y2={points[lowestIndex][1] + Math.round(14 * scale)}
              stroke={LOWEST_CROSS_COLOR}
              strokeWidth={Math.round(1.5 * scale)}
              strokeLinecap="round"
              transform={`translate(0, ${interpolate(frame, [65, 80], [Math.round(-10 * scale), 0], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })})`}
            />
            {/* Texto "↓ lowest" */}
            <text
              x={points[lowestIndex][0]}
              y={points[lowestIndex][1] + Math.round(25 * scale)} // Posição abaixo do X
              textAnchor="middle"
              fontSize={highlightLabelFontSize}
              fill={HIGHLIGHT_TEXT_COLOR}
              transform={`translate(0, ${interpolate(frame, [65, 80], [Math.round(-10 * scale), 0], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })})`}
            >
              ↓ lowest
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
