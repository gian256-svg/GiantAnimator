import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig, AbsoluteFill } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (Reutilizadas conforme as regras de ouro)
const SPRING_CONFIG_MAIN: SpringConfig = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

const SPRING_CONFIG_LABELS: SpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface LineChartProps {
  title: string;
  labels: string[]; // X-axis labels (e.g., categories or indices)
  series: Array<{
    label: string;
    data: number[];
  }>;
  // Propriedades para identificar e anotar os pontos mais alto/baixo (inferido da imagem)
  highestPoint?: { index: number; value: number; label: string };
  lowestPoint?: { index: number; value: number; label: string };
}

// [INFERÊNCIA DE DADOS DA IMAGEM DE REFERÊNCIA]
const DEFAULT_LINE_CHART_DATA = {
  title: "Simple Line Chart",
  labels: ["0", "", "2", "", "4", "", "6", "", "8", "", "10", ""], // Labels visíveis a cada 2 pontos
  series: [
    {
      label: "Dados",
      data: [450, 410, 515, 460, 450, 500, 480, 480, 410, 500, 475, 510] // Valores aproximados
    }
  ],
  highestPoint: { index: 2, value: 515, label: "↑ highest" },
  lowestPoint: { index: 8, value: 410, label: "↓ lowest" },
};

// [CORES EXTRAÍDAS DA IMAGEM DE REFERÊNCIA]
const CHART_COLORS = {
  background: '#F0F0F0',
  line: '#7788AA',
  grid: '#D9D9D9',
  text: '#333333',
  highestArrow: '#FF0000',
  lowestX: '#5CB85C',
  point: '#7788AA',
};

// [REGRAS DE ESTRUTURA E LAYOUT] - Y-axis range como na imagem (exceção à regra de começar em 0)
const Y_AXIS_MIN_VALUE = 400;
const Y_AXIS_MAX_VALUE = 550;
const Y_AXIS_TICK_STEP = 50;

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (min: number, max: number, step: number): number[] => {
  const ticks = [];
  for (let i = min; i <= max; i += step) {
    ticks.push(i);
  }
  return ticks;
};

export const LineChart: React.FC<LineChartProps> = (props) => {
  // Use default data if no props are provided (for demonstration/easy testing)
  const {
    title = DEFAULT_LINE_CHART_DATA.title,
    labels = DEFAULT_LINE_CHART_DATA.labels,
    series = DEFAULT_LINE_CHART_DATA.series,
    highestPoint = DEFAULT_LINE_CHART_DATA.highestPoint,
    lowestPoint = DEFAULT_LINE_CHART_DATA.lowestPoint,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080); // Baseado em um canvas Full HD

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(50 * scale); // Aumentado um pouco para corresponder ao respiro da imagem
  const TITLE_HEIGHT = Math.round(50 * scale); // Espaço para o título
  const X_AXIS_LABEL_HEIGHT = Math.round(30 * scale); // Espaço para labels do eixo X
  const Y_AXIS_LABEL_WIDTH = Math.round(50 * scale); // Espaço para labels do eixo Y

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = width - 2 * PLOT_AREA_PADDING - Y_AXIS_LABEL_WIDTH;
  const plotHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for LineChart. Displaying fallback.`);
    return (
      <AbsoluteFill style={{
        backgroundColor: CHART_COLORS.background,
        color: CHART_COLORS.text,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  const data = series[0].data; // Usamos apenas a primeira série para este gráfico simples

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y definida pela imagem de referência
  const actualMinY = Y_AXIS_MIN_VALUE;
  const actualMaxY = Y_AXIS_MAX_VALUE;
  const yAxisRange = actualMaxY - actualMinY;

  const numDataPoints = data.length;
  // [REGRAS POR TIPO DE GRÁFICO -> Line Chart] - Distância entre pontos no eixo X
  const xStep = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : 0;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(22 * scale); // Ajustado para a imagem
  const axisLabelFontSize = Math.round(14 * scale); // Ajustado para a imagem
  const annotationLabelFontSize = Math.round(12 * scale);

  // Calcular tick marks do eixo Y
  const yTickValues = generateYAxisTicks(actualMinY, actualMaxY, Y_AXIS_TICK_STEP);

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering LineChart frame ${frame}.`);

  // Função para converter um valor de dados para a coordenada Y na plot area
  const getYCoordinate = (value: number) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    if (yAxisRange === 0) return plotAreaY + plotHeight / 2;
    return plotAreaY + plotHeight - ((value - actualMinY) / yAxisRange) * plotHeight;
  };

  // Calcular pontos para a linha SVG
  const linePoints = data.map((value, index) => {
    const x = plotAreaX + index * xStep;
    const y = getYCoordinate(value);
    // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
    return `${isNaN(x) ? 0 : x},${isNaN(y) ? 0 : y}`;
  }).join(' ');

  // Animação de desenho da linha (strokeDashoffset) [REGRAS POR TIPO DE GRÁFICO -> Line Chart]
  const lineLength = Math.sqrt(
    data.reduce((acc, _, i) => {
      if (i === 0) return 0;
      const x1 = plotAreaX + (i - 1) * xStep;
      const y1 = getYCoordinate(data[i - 1]);
      const x2 = plotAreaX + i * xStep;
      const y2 = getYCoordinate(data[i]);
      return acc + Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }, 0)
  );

  const animatedDashoffset = interpolate(
    frame,
    [10, 60],
    [lineLength, 0], // Desenha a linha da esquerda para a direita
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHART_COLORS.background,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2 - Math.round(10 * scale)} // Ajuste visual
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={CHART_COLORS.text}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const y = getYCoordinate(tickValue);

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
                stroke={CHART_COLORS.grid}
                strokeWidth={1}
                strokeDasharray={''} // [FIDELIDADE À IMAGEM] - Linha sólida
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={plotAreaX - Math.round(10 * scale)} // Padding à direita
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={CHART_COLORS.text}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linha do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={CHART_COLORS.line}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={lineLength}
          strokeDashoffset={animatedDashoffset}
        />

        {/* Pontos nos Data Points [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {data.map((value, index) => {
          const x = plotAreaX + index * xStep;
          const y = getYCoordinate(value);
          const pointRadius = Math.round(3 * scale); // Raio do ponto (pequeno como na imagem)

          // Animação de aparição do ponto
          const pointScale = interpolate(
            frame,
            [30 + index * 2, 70 + index * 2], // Staggered entry
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS, // Usar config de labels para evitar muito bounce
            }
          );
          const pointOpacity = interpolate(frame, [30 + index * 2, 35 + index * 2], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r={pointRadius}
              fill={CHART_COLORS.point}
              transform={`scale(${pointScale})`}
              transformOrigin={`${x}px ${y}px`}
              opacity={pointOpacity}
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          if (!label) return null; // Não renderiza labels vazios (como a cada 2 pontos na imagem)

          const x = plotAreaX + index * xStep;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${index}`}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={CHART_COLORS.text}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Anotação para Ponto Mais Alto [FIDELIDADE À IMAGEM] */}
        {highestPoint && (
          <g>
            {(() => {
              const x = plotAreaX + highestPoint.index * xStep;
              const y = getYCoordinate(highestPoint.value);

              const annotationOpacity = interpolate(frame, [60, 80], [0, 1], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
              });
              const annotationYOffset = interpolate(frame, [60, 80], [Math.round(20 * scale), 0], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
              });

              // Seta ↑
              const arrowBaseY = y - Math.round(10 * scale) - annotationYOffset;
              const arrowHeadY = arrowBaseY - Math.round(10 * scale);
              const arrowWidth = Math.round(6 * scale);

              return (
                <g opacity={annotationOpacity}>
                  <line
                    x1={x}
                    y1={arrowBaseY}
                    x2={x}
                    y2={arrowHeadY}
                    stroke={CHART_COLORS.highestArrow}
                    strokeWidth={Math.round(1.5 * scale)}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`${x},${arrowHeadY} ${x - arrowWidth / 2},${arrowHeadY + arrowWidth} ${x + arrowWidth / 2},${arrowHeadY + arrowWidth}`}
                    fill={CHART_COLORS.highestArrow}
                  />
                  <text
                    x={x}
                    y={arrowHeadY - Math.round(5 * scale)} // Acima da seta
                    textAnchor="middle"
                    fontSize={annotationLabelFontSize}
                    fill={CHART_COLORS.text}
                  >
                    {highestPoint.label}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* Anotação para Ponto Mais Baixo [FIDELIDADE À IMAGEM] */}
        {lowestPoint && (
          <g>
            {(() => {
              const x = plotAreaX + lowestPoint.index * xStep;
              const y = getYCoordinate(lowestPoint.value);

              const annotationOpacity = interpolate(frame, [65, 85], [0, 1], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
              });
              const annotationYOffset = interpolate(frame, [65, 85], [Math.round(-20 * scale), 0], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
              });

              // 'X' para o ponto mais baixo
              const xOffset = Math.round(5 * scale);
              const xStrokeWidth = Math.round(1.5 * scale);

              return (
                <g opacity={annotationOpacity}>
                  <line
                    x1={x - xOffset}
                    y1={y + xOffset + annotationYOffset}
                    x2={x + xOffset}
                    y2={y - xOffset + annotationYOffset}
                    stroke={CHART_COLORS.lowestX}
                    strokeWidth={xStrokeWidth}
                    strokeLinecap="round"
                  />
                  <line
                    x1={x - xOffset}
                    y1={y - xOffset + annotationYOffset}
                    x2={x + xOffset}
                    y2={y + xOffset + annotationYOffset}
                    stroke={CHART_COLORS.lowestX}
                    strokeWidth={xStrokeWidth}
                    strokeLinecap="round"
                  />
                  <text
                    x={x}
                    y={y + Math.round(20 * scale) + annotationYOffset} // Abaixo do 'X'
                    textAnchor="middle"
                    fontSize={annotationLabelFontSize}
                    fill={CHART_COLORS.text}
                  >
                    {lowestPoint.label}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
