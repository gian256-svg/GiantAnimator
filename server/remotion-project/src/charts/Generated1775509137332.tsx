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

interface LineChartProps {
  title: string;
  labels: string[]; // X-axis labels to display (e.g., "0", "2", "4")
  data: number[]; // Y-values for the line
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  labels,
  data,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  // Ajustado para replicar visualmente as margens da imagem de referência.
  const PLOT_AREA_PADDING = Math.round(50 * scale);
  const TITLE_HEIGHT = Math.round(40 * scale); // Título parece maior na referência
  const X_AXIS_LABEL_HEIGHT = Math.round(30 * scale);
  const Y_AXIS_LABEL_WIDTH = Math.round(50 * scale);

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for LineChart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#EAEAEA', // Cor de fundo da referência
        color: '#333333',
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

  // Y-axis range baseado na imagem de referência: 400 a 550
  const minYValue = 400;
  const maxYValue = 550;
  const yValueRange = maxYValue - minYValue;

  // Mapeamento do Eixo X
  const numPoints = data.length;
  // A distância entre os pontos é igual, exceto se houver apenas 1 ponto
  const pointSpacing = numPoints > 1 ? plotWidth / (numPoints - 1) : 0; 

  // Encontrar pontos mais alto e mais baixo para as anotações
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

  // Cores extraídas da imagem de referência [REGRA #1]
  const bgColor = '#EAEAEA';
  const titleColor = '#333333';
  const axisLabelColor = '#666666';
  const gridLineColor = '#CCCCCC'; // Linhas sólidas, não tracejadas, como na referência
  const lineColor = '#6A7BA7';
  const highestMarkerColor = '#FF0000';
  const lowestMarkerColor = '#666666'; // Para o marcador 'X'
  const annotationTextColor = '#333333';

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(22 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const annotationFontSize = Math.round(10 * scale);

  // Valores dos ticks do Eixo Y, baseados na imagem
  const yTickValues = [400, 450, 500, 550];

  // Calcular o caminho SVG para a linha do gráfico
  let linePath = '';
  if (numPoints > 0) {
    linePath = `M ${plotAreaX} ${plotAreaY + plotHeight - ((data[0] - minYValue) / yValueRange) * plotHeight}`;
    for (let i = 1; i < numPoints; i++) {
      const x = plotAreaX + i * pointSpacing;
      const y = plotAreaY + plotHeight - ((data[i] - minYValue) / yValueRange) * plotHeight;
      // Usando 'L' para segmentos de linha retos, conforme a referência visual (REGRA #1)
      linePath += ` L ${x} ${y}`;
    }
  }

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
  const pathLength = React.useMemo(() => {
    // Estimativa do comprimento do path para a animação. Para precisão,
    // um componente invisível ou cálculo geométrico seria necessário.
    return plotWidth + plotHeight; // Estimativa conservadora
  }, [plotWidth, plotHeight]);

  const animatedDashoffset = interpolate(
    frame,
    [10, 60], // Duração da animação
    [pathLength, 0], // De comprimento total a 0
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering LineChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: bgColor, // Fundo conforme referência
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
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2 + Math.round(5 * scale)} // Ajustado para corresponder à posição da imagem
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={titleColor}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRA #1: fielmente] */}
        {yTickValues.map((tickValue, index) => {
          const y = plotAreaY + plotHeight - ((tickValue - minYValue) / yValueRange) * plotHeight;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${tickValue}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={1} // Linha fina conforme referência
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={plotAreaX - Math.round(10 * scale)} // Ajuste de padding
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste para centralização vertical
                textAnchor="end"
                fontSize={axisLabelFontSize}
                fill={axisLabelColor}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linha do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.round(2 * scale)} // Espessura conforme imagem
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={animatedDashoffset}
        />

        {/* Pontos da Linha [REGRA #1: fielmente] */}
        {data.map((value, index) => {
          const x = plotAreaX + index * pointSpacing;
          const y = plotAreaY + plotHeight - ((value - minYValue) / yValueRange) * plotHeight;

          const dotScale = interpolate(
            frame,
            [40 + index * 2, 70 + index * 2], // Entrada escalonada
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS, // Usar config de labels para pontos
            }
          );
          const dotOpacity = interpolate(
            frame,
            [40 + index * 2, 70 + index * 2],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );
          
          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG
          const safeX = isNaN(x) ? 0 : x;
          const safeY = isNaN(y) ? 0 : y;

          return (
            <circle
              key={`dot-${index}`}
              cx={safeX}
              cy={safeY}
              r={Math.round(3 * scale)} // Pequenos pontos conforme imagem
              fill={lineColor}
              transform={`scale(${dotScale})`}
              transformOrigin={`${safeX}px ${safeY}px`}
              opacity={dotOpacity}
            />
          );
        })}

        {/* Labels do Eixo X [REGRA #1: fielmente] */}
        {labels.map((label, index) => {
          // Os labels da imagem ("0", "2", "4"...) correspondem a índices específicos nos dados.
          // Assumimos que o valor do label é o índice do ponto de dado que ele representa.
          const dataIndex = parseInt(label, 10);
          if (isNaN(dataIndex) || dataIndex >= numPoints || dataIndex < 0) {
            console.warn(`[${new Date().toISOString()}] GiantAnimator: X-axis label '${label}' does not correspond to a valid data index.`);
            return null; // Ignorar labels inválidos
          }

          const x = plotAreaX + dataIndex * pointSpacing;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG
          const safeX = isNaN(x) ? 0 : x;
          const safeY = isNaN(y) ? 0 : y;

          return (
            <text
              key={`x-label-${label}`}
              x={safeX}
              y={safeY}
              textAnchor="middle"
              fontSize={axisLabelFontSize}
              fill={axisLabelColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Anotação de Ponto Mais Alto [REGRA #1: fielmente] */}
        {highestIndex !== -1 && (
          <React.Fragment>
            <text
              x={plotAreaX + highestIndex * pointSpacing}
              y={plotAreaY + plotHeight - ((highestValue - minYValue) / yValueRange) * plotHeight - Math.round(20 * scale)} // Acima do ponto
              textAnchor="middle"
              fontSize={annotationFontSize}
              fill={annotationTextColor}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            >
              ↑ highest
            </text>
            <polygon
              points={`${plotAreaX + highestIndex * pointSpacing},${plotAreaY + plotHeight - ((highestValue - minYValue) / yValueRange) * plotHeight - Math.round(10 * scale)} 
                       ${plotAreaX + highestIndex * pointSpacing - Math.round(3 * scale)},${plotAreaY + plotHeight - ((highestValue - minYValue) / yValueRange) * plotHeight - Math.round(15 * scale)} 
                       ${plotAreaX + highestIndex * pointSpacing + Math.round(3 * scale)},${plotAreaY + plotHeight - ((highestValue - minYValue) / yValueRange) * plotHeight - Math.round(15 * scale)}`}
              fill={highestMarkerColor}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            />
          </React.Fragment>
        )}

        {/* Anotação de Ponto Mais Baixo [REGRA #1: fielmente] */}
        {lowestIndex !== -1 && (
          <React.Fragment>
            <text
              x={plotAreaX + lowestIndex * pointSpacing}
              y={plotAreaY + plotHeight - ((lowestValue - minYValue) / yValueRange) * plotHeight + Math.round(20 * scale)} // Abaixo do ponto
              textAnchor="middle"
              fontSize={annotationFontSize}
              fill={annotationTextColor}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            >
              ↓ lowest
            </text>
            {/* Marcador 'X' - composto por duas linhas */}
            <line
              x1={plotAreaX + lowestIndex * pointSpacing - Math.round(4 * scale)}
              y1={plotAreaY + plotHeight - ((lowestValue - minYValue) / yValueRange) * plotHeight + Math.round(10 * scale)}
              x2={plotAreaX + lowestIndex * pointSpacing + Math.round(4 * scale)}
              y2={plotAreaY + plotHeight - ((lowestValue - minYValue) / yValueRange) * plotHeight + Math.round(18 * scale)}
              stroke={lowestMarkerColor}
              strokeWidth={1.5}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            />
            <line
              x1={plotAreaX + lowestIndex * pointSpacing - Math.round(4 * scale)}
              y1={plotAreaY + plotHeight - ((lowestValue - minYValue) / yValueRange) * plotHeight + Math.round(18 * scale)}
              x2={plotAreaX + lowestIndex * pointSpacing + Math.round(4 * scale)}
              y2={plotAreaY + plotHeight - ((lowestValue - minYValue) / yValueRange) * plotHeight + Math.round(10 * scale)}
              stroke={lowestMarkerColor}
              strokeWidth={1.5}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            />
          </React.Fragment>
        )}
      </svg>
    </div>
  );
};

