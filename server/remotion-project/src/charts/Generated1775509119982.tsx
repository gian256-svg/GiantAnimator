import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig, Sequence } from 'remotion';

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
  data: number[]; // Array de valores Y para os pontos
  xAxisLabels: number[]; // Labels a serem exibidos no eixo X (ex: [0, 2, 4, 6, 8, 10])
  yAxisMin: number;
  yAxisMax: number;
  yAxisInterval: number;
  highestPointIndex?: number; // Índice do ponto mais alto para anotação
  lowestPointIndex?: number;  // Índice do ponto mais baixo para anotação
}

export const SimpleLineChart: React.FC<LineChartProps> = ({
  title,
  data,
  xAxisLabels,
  yAxisMin,
  yAxisMax,
  yAxisInterval,
  highestPointIndex,
  lowestPointIndex,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080); // Usando 1920x1080 como base de referência da imagem

  // Cores extraídas fielmente da imagem de referência
  const CANVAS_BG_COLOR = '#EBEBEB';
  const GRID_LINE_COLOR = '#D0D0D0'; // [REGRA #1 - Estilo do Grid: Solid]
  const LINE_COLOR = '#6B76A6';
  const TITLE_TEXT_COLOR = '#333333';
  const AXIS_LABEL_COLOR = '#555555';
  const ANNOTATION_TEXT_COLOR = '#333333';
  const HIGHEST_ARROW_COLOR = '#F44336'; // Vermelho
  const LOWEST_X_COLOR = '#4CAF50';     // Verde

  // Plot Area dimensions e margens
  const PLOT_AREA_PADDING_HORIZONTAL = Math.round(100 * scale); // Ajuste para replicar espaçamento
  const PLOT_AREA_PADDING_VERTICAL = Math.round(80 * scale);    // Ajuste para replicar espaçamento
  const TITLE_HEIGHT = Math.round(40 * scale);                  // Espaço para o título

  const plotAreaX = PLOT_AREA_PADDING_HORIZONTAL;
  const plotAreaY = PLOT_AREA_PADDING_VERTICAL;
  const plotWidth = width - 2 * PLOT_AREA_PADDING_HORIZONTAL;
  const plotHeight = height - 2 * PLOT_AREA_PADDING_VERTICAL - TITLE_HEIGHT;

  // Tipografia [REGRAS DE TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(22 * scale);
  const axisLabelFontSize = Math.round(12 * scale);
  const annotationFontSize = Math.round(12 * scale);

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: CANVAS_BG_COLOR,
        color: TITLE_TEXT_COLOR,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(8 * scale), // Borda arredondada do container
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  // Mapear valores para coordenadas SVG
  const dataPoints = data.map((value, index) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const yRatio = (value - yAxisMin) / (yAxisMax - yAxisMin);
    const x = plotAreaX + (index / (data.length - 1)) * plotWidth;
    const y = plotAreaY + plotHeight - yRatio * plotHeight;
    return { x, y: isNaN(y) ? plotAreaY + plotHeight : y, value }; // [EDGE CASES E ROBUSTEZ] - NaN no SVG
  });

  // Gerar Y-axis ticks
  const yTickValues = [];
  for (let i = yAxisMin; i <= yAxisMax; i += yAxisInterval) {
    yTickValues.push(i);
  }

  // Gerar o path da linha
  const linePath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Animação da linha [REGRAS DE ANIMAÇÃO]
  const pathLength = dataPoints.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = dataPoints[i - 1];
    return acc + Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
  }, 0);

  const animatedDashoffset = interpolate(
    frame,
    [10, 60], // Desenho da linha de 10 a 60 frames
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação de entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering SimpleLineChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: CANVAS_BG_COLOR,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(8 * scale), // Borda arredondada do container
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={plotAreaY / 2 + Math.round(titleFontSize / 3)}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={TITLE_TEXT_COLOR}
        >
          {title}
        </text>

        {/* Linhas de Grid Horizontais e Labels do Eixo Y [REGRA #1 - Estilo do Grid: Solid] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const yRatio = (tickValue - yAxisMin) / (yAxisMax - yAxisMin);
          const y = plotAreaY + plotHeight - yRatio * plotHeight;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={GRID_LINE_COLOR}
                strokeWidth={1}
                opacity={gridLineOpacity}
              />
              <text
                x={plotAreaX - Math.round(15 * scale)} // Offset para alinhar com a referência
                y={y + Math.round(axisLabelFontSize / 3)}
                textAnchor="end"
                fontSize={axisLabelFontSize}
                fill={AXIS_LABEL_COLOR}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linha da Série [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={Math.round(2.5 * scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={animatedDashoffset}
        />

        {/* Pontos de Dados e Labels do Eixo X */}
        {dataPoints.map((point, index) => {
          const pointScale = interpolate(
            frame,
            [40 + index * 4, 70 + index * 4], // stagger appearance
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const pointOpacity = interpolate(frame, [40 + index * 4, 70 + index * 4], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          // Apenas para os labels explícitos no eixo X (0, 2, 4...)
          const isXLabelVisible = xAxisLabels.includes(index);
          const xLabelOpacity = interpolate(frame, [50, 70], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`point-${index}`}>
              {/* Ponto (Dot) */}
              <circle
                cx={point.x}
                cy={point.y}
                r={Math.round(3 * scale)} // 6px de diâmetro
                fill={LINE_COLOR}
                transform={`scale(${pointScale})`}
                transformOrigin={`${point.x}px ${point.y}px`}
                opacity={pointOpacity}
              />

              {/* Label do Eixo X (se for um dos labels explicitos) */}
              {isXLabelVisible && (
                <text
                  x={point.x}
                  y={plotAreaY + plotHeight + Math.round(25 * scale)}
                  textAnchor="middle"
                  fontSize={axisLabelFontSize}
                  fill={AXIS_LABEL_COLOR}
                  opacity={xLabelOpacity}
                >
                  {index}
                </text>
              )}
            </React.Fragment>
          );
        })}

        {/* Anotação "highest" */}
        {highestPointIndex !== undefined && dataPoints[highestPointIndex] && (
          <Sequence from={60}> {/* Anotar depois da linha estar quase completa */}
            <ArrowAnnotation
              point={dataPoints[highestPointIndex]}
              label="highest"
              color={HIGHEST_ARROW_COLOR}
              textColor={ANNOTATION_TEXT_COLOR}
              fontSize={annotationFontSize}
              scale={scale}
              frame={frame - 60} // Offset the frame for the sequence
              direction="up"
            />
          </Sequence>
        )}

        {/* Anotação "lowest" */}
        {lowestPointIndex !== undefined && dataPoints[lowestPointIndex] && (
          <Sequence from={65}> {/* Anotar depois da linha estar quase completa */}
            <XAnnotation
              point={dataPoints[lowestPointIndex]}
              label="lowest"
              color={LOWEST_X_COLOR}
              textColor={ANNOTATION_TEXT_COLOR}
              fontSize={annotationFontSize}
              scale={scale}
              frame={frame - 65} // Offset the frame for the sequence
              direction="down"
            />
          </Sequence>
        )}
      </svg>
    </div>
  );
};

interface AnnotationProps {
  point: { x: number; y: number; value: number };
  label: string;
  color: string;
  textColor: string;
  fontSize: number;
  scale: number;
  frame: number;
  direction: 'up' | 'down';
}

// Componente para anotação de seta (highest)
const ArrowAnnotation: React.FC<AnnotationProps> = ({ point, label, color, textColor, fontSize, scale, frame, direction }) => {
  const annotationOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });
  const annotationYOffset = interpolate(frame, [0, 15], [Math.round(10 * scale), 0], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });

  const arrowYOffset = Math.round(15 * scale); // Distância da seta ao ponto
  const textYOffset = Math.round(30 * scale);  // Distância do texto à seta

  return (
    <g opacity={annotationOpacity} transform={`translate(0, ${-annotationYOffset})`}>
      {/* Seta */}
      <path
        d={`M ${point.x} ${point.y - arrowYOffset} L ${point.x - Math.round(5 * scale)} ${point.y - arrowYOffset - Math.round(10 * scale)} L ${point.x + Math.round(5 * scale)} ${point.y - arrowYOffset - Math.round(10 * scale)} Z`}
        fill={color}
        transform={`rotate(180 ${point.x} ${point.y - arrowYOffset - Math.round(5 * scale)})`} // Seta para cima
      />
      {/* Corpo da seta */}
      <line 
        x1={point.x} y1={point.y} 
        x2={point.x} y2={point.y - arrowYOffset} 
        stroke={color} 
        strokeWidth={Math.round(1.5 * scale)} 
        markerEnd="url(#arrowhead)" // Poderia ser um marker, mas desenhei como path para simplicidade
      />
      {/* Texto */}
      <text
        x={point.x}
        y={point.y - textYOffset}
        textAnchor="middle"
        fontSize={fontSize}
        fill={textColor}
      >
        {label}
      </text>
    </g>
  );
};

// Componente para anotação de X (lowest)
const XAnnotation: React.FC<AnnotationProps> = ({ point, label, color, textColor, fontSize, scale, frame, direction }) => {
  const annotationOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });
  const annotationYOffset = interpolate(frame, [0, 15], [Math.round(10 * scale), 0], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });

  const xMarkSize = Math.round(5 * scale);
  const textYOffset = Math.round(20 * scale); // Distância do texto ao 'X'

  return (
    <g opacity={annotationOpacity} transform={`translate(0, ${annotationYOffset})`}> {/* Move para baixo */}
      {/* Símbolo 'X' */}
      <line
        x1={point.x - xMarkSize} y1={point.y + xMarkSize}
        x2={point.x + xMarkSize} y2={point.y - xMarkSize}
        stroke={color}
        strokeWidth={Math.round(1.5 * scale)}
        strokeLinecap="round"
      />
      <line
        x1={point.x - xMarkSize} y1={point.y - xMarkSize}
        x2={point.x + xMarkSize} y2={point.y + xMarkSize}
        stroke={color}
        strokeWidth={Math.round(1.5 * scale)}
        strokeLinecap="round"
      />
      {/* Seta para baixo */}
      <path
        d={`M ${point.x} ${point.y + Math.round(10 * scale)} L ${point.x - Math.round(5 * scale)} ${point.y + Math.round(15 * scale)} L ${point.x + Math.round(5 * scale)} ${point.y + Math.round(15 * scale)} Z`}
        fill={color}
      />
      {/* Texto */}
      <text
        x={point.x}
        y={point.y + textYOffset}
        textAnchor="middle"
        fontSize={fontSize}
        fill={textColor}
      >
        {label}
      </text>
    </g>
  );
};

// Dados de exemplo para uso (conforme imagem)
// Certifique-se de que o total de frames da sua composição seja suficiente para a animação
export const defaultSimpleLineChartProps: LineChartProps = {
  title: "Simple Line Chart",
  data: [450, 410, 515, 460, 450, 500, 475, 475, 410, 500, 475, 510],
  xAxisLabels: [0, 2, 4, 6, 8, 10], // Apenas os labels visíveis no eixo X
  yAxisMin: 400,
  yAxisMax: 550,
  yAxisInterval: 50,
  highestPointIndex: 2, // 515
  lowestPointIndex: 8,  // 410
};
