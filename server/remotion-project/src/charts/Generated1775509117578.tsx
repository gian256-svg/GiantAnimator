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

// Props para o componente baseado na imagem de referência
interface BarChartReferenceProps {
  labels?: string[];
  data?: number[];
}

export const BarChartFromReference: React.FC<BarChartReferenceProps> = ({
  labels = ["Mon", "Tue", "Wed", "Thu", "Fri"], // Dados da referência
  data = [85, 155, 178, 210, 123], // Dados da referência
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional para manter as proporções da imagem
  const idealWidth = 500; // Largura estimada da imagem de referência para proporção
  const idealHeight = 550; // Altura estimada da imagem de referência para proporção
  const scale = Math.min(width / idealWidth, height / idealHeight) * 0.9; // Ajuste para caber e manter margens

  const scaledWidth = idealWidth * scale;
  const scaledHeight = idealHeight * scale;

  // Centralizar o gráfico no canvas Remotion
  const offsetX = (width - scaledWidth) / 2;
  const offsetY = (height - scaledHeight) / 2;

  // Cores Extraídas da Referência [REGRA #1: Cores exatas]
  const CANVAS_BACKGROUND_COLOR = '#F2F4F7';
  const CANVAS_BORDER_COLOR = '#4F4F4F';
  const PLOT_AREA_BACKGROUND_COLOR = '#FFFFFF';
  const PLOT_AREA_BORDER_COLOR = '#4F4F4F';
  const BAR_COLOR = '#E43325';
  const GRID_AXIS_TICK_COLOR = '#CECECE';
  const LABEL_COLOR = '#4F4F4F';

  // Dimensões e Margens [REGRA #1: Proporções e espaçamentos]
  const CANVAS_BORDER_WIDTH = Math.round(2 * scale); // Borda externa fina
  const PLOT_AREA_BORDER_WIDTH = Math.round(1.5 * scale); // Borda da área do gráfico

  // Padding dentro do plot area para labels e eixos
  const PLOT_PADDING_TOP = Math.round(30 * scale);
  const PLOT_PADDING_BOTTOM = Math.round(40 * scale); // Para labels X
  const PLOT_PADDING_LEFT = Math.round(45 * scale); // Para labels Y e tick marks
  const PLOT_PADDING_RIGHT = Math.round(20 * scale);

  // Área interna do gráfico sem as bordas do canvas
  const innerCanvasWidth = scaledWidth - 2 * CANVAS_BORDER_WIDTH;
  const innerCanvasHeight = scaledHeight - 2 * CANVAS_BORDER_WIDTH;

  // Posição e dimensões da Plot Area (fundo branco com borda escura)
  const plotAreaX = offsetX + CANVAS_BORDER_WIDTH + Math.round(15 * scale); // Margem visual para a plot area
  const plotAreaY = offsetY + CANVAS_BORDER_WIDTH + Math.round(15 * scale);
  const plotAreaWidth = innerCanvasWidth - Math.round(30 * scale);
  const plotAreaHeight = innerCanvasHeight - Math.round(30 * scale);

  // Área interna para desenhar as barras e grid, dentro da plot area
  const graphInnerX = plotAreaX + PLOT_PADDING_LEFT;
  const graphInnerY = plotAreaY + PLOT_PADDING_TOP;
  const graphInnerWidth = plotAreaWidth - PLOT_PADDING_LEFT - PLOT_PADDING_RIGHT;
  const graphInnerHeight = plotAreaHeight - PLOT_PADDING_TOP - PLOT_PADDING_BOTTOM;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados
  if (!Array.isArray(data) || data.length === 0 || !Array.isArray(labels) || labels.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: CANVAS_BACKGROUND_COLOR,
        color: LABEL_COLOR,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'sans-serif',
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  const maxValue = Math.max(...data, 0); // Eixo Y sempre começa em 0
  const yAxisMax = 250; // De acordo com a referência
  const numYTicks = 5; // 0, 50, 100, 150, 200, 250
  const yTickValues = Array.from({ length: numYTicks + 1 }, (_, i) => (i * yAxisMax) / numYTicks);

  const numBars = data.length;
  const totalSpacePerBar = graphInnerWidth / numBars;
  const barWidthRatio = 0.6; // 60% do espaço disponível
  const barWidth = totalSpacePerBar * barWidthRatio;
  const barPadding = (totalSpacePerBar - barWidth) / 2; // Espaço entre as barras

  // Tipografia
  const axisLabelFontSize = Math.round(12 * scale);
  const tickMarkLength = Math.round(5 * scale); // Comprimento dos tick marks

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntrance = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const chartScaleFactor = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering BarChartFromReference frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: CANVAS_BACKGROUND_COLOR,
        fontFamily: 'sans-serif',
        // Transformações aplicadas ao SVG inteiro para centralização e escala
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Borda externa do Canvas [REGRA #1] */}
        <rect
          x={offsetX}
          y={offsetY}
          width={scaledWidth}
          height={scaledHeight}
          fill="none"
          stroke={CANVAS_BORDER_COLOR}
          strokeWidth={CANVAS_BORDER_WIDTH}
          opacity={chartEntrance}
          transform={`scale(${chartScaleFactor}) translate(${(width/chartScaleFactor - width)/2}, ${(height/chartScaleFactor - height)/2})`}
          transformOrigin="center center"
        />
        {/* Fundo da Área do Gráfico (Plot Area) [REGRA #1] */}
        <rect
          x={plotAreaX}
          y={plotAreaY}
          width={plotAreaWidth}
          height={plotAreaHeight}
          fill={PLOT_AREA_BACKGROUND_COLOR}
          opacity={chartEntrance}
          transform={`scale(${chartScaleFactor}) translate(${(width/chartScaleFactor - width)/2}, ${(height/chartScaleFactor - height)/2})`}
          transformOrigin="center center"
        />
        {/* Borda da Área do Gráfico (Plot Area) [REGRA #1] */}
        <rect
          x={plotAreaX}
          y={plotAreaY}
          width={plotAreaWidth}
          height={plotAreaHeight}
          fill="none"
          stroke={PLOT_AREA_BORDER_COLOR}
          strokeWidth={PLOT_AREA_BORDER_WIDTH}
          opacity={chartEntrance}
          transform={`scale(${chartScaleFactor}) translate(${(width/chartScaleFactor - width)/2}, ${(height/chartScaleFactor - height)/2})`}
          transformOrigin="center center"
        />

        <g transform={`scale(${chartScaleFactor}) translate(${(width/chartScaleFactor - width)/2}, ${(height/chartScaleFactor - height)/2})`}>
          {/* Grid Horizontais e Labels do Eixo Y [REGRA #1: Linhas sólidas, sem destaque na linha zero] */}
          {yTickValues.map((tickValue, index) => {
            const yPosition = graphInnerY + graphInnerHeight - (tickValue / yAxisMax) * graphInnerHeight;
            
            const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            });

            return (
              <React.Fragment key={`grid-y-${index}`}>
                {/* Linhas de Grid Horizontais [REGRA #1: Sólidas] */}
                <line
                  x1={graphInnerX}
                  y1={yPosition}
                  x2={graphInnerX + graphInnerWidth}
                  y2={yPosition}
                  stroke={GRID_AXIS_TICK_COLOR}
                  strokeWidth={1}
                  opacity={gridLineOpacity}
                />
                {/* Labels do Eixo Y [REGRA #1: Alinhados à esquerda do eixo] */}
                <text
                  x={graphInnerX - Math.round(10 * scale)} // Ajuste para posicionar à esquerda do tick
                  y={yPosition + Math.round(axisLabelFontSize / 3)} // Ajuste vertical
                  textAnchor="end" // Alinhado à direita dos ticks
                  fontSize={axisLabelFontSize}
                  fill={LABEL_COLOR}
                  opacity={gridLineOpacity}
                >
                  {tickValue.toString()}
                </text>
                {/* Tick Marks do Eixo Y [REGRA #1: Visíveis, curtos] */}
                <line
                  x1={graphInnerX - tickMarkLength}
                  y1={yPosition}
                  x2={graphInnerX}
                  y2={yPosition}
                  stroke={GRID_AXIS_TICK_COLOR}
                  strokeWidth={1}
                  opacity={gridLineOpacity}
                />
              </React.Fragment>
            );
          })}

          {/* Barras [REGRA #1: Sem cantos arredondados, sem labels de valor] */}
          {data.map((value, index) => {
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
            const barRatio = yAxisMax > 0 ? value / yAxisMax : 0;
            const barHeightRaw = barRatio * graphInnerHeight;
            const actualBarHeight = Math.max(barHeightRaw, 0.1); // Garantir que a barra seja desenhada para valor > 0

            const barX = graphInnerX + index * totalSpacePerBar + barPadding;
            const barY = graphInnerY + graphInnerHeight - actualBarHeight;

            // Animação de crescimento da barra [REGRAS DE ANIMAÇÃO]
            const animatedHeight = interpolate(
              frame,
              [10 + index * 4, 60 + index * 4], // staggered start (4 frames de delay entre barras)
              [0, actualBarHeight],
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_MAIN,
              }
            );
            const animatedY = interpolate(
              frame,
              [10 + index * 4, 60 + index * 4],
              [graphInnerY + graphInnerHeight, barY], // Y inicial (base) até Y final (topo da barra)
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_MAIN,
              }
            );

            return (
              <rect
                key={labels[index]}
                x={barX}
                y={animatedY}
                width={barWidth}
                height={animatedHeight}
                fill={BAR_COLOR}
                // [REGRA #1: Sem borderRadius nas barras]
              />
            );
          })}

          {/* Linha do Eixo X [REGRA #1: Visível] */}
          <line
            x1={graphInnerX}
            y1={graphInnerY + graphInnerHeight}
            x2={graphInnerX + graphInnerWidth}
            y2={graphInnerY + graphInnerHeight}
            stroke={GRID_AXIS_TICK_COLOR}
            strokeWidth={1}
            opacity={interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
          />

          {/* Labels do Eixo X e Tick Marks [REGRA #1: Centralizados sob barras, ticks visíveis] */}
          {labels.map((label, index) => {
            const xPosition = graphInnerX + index * totalSpacePerBar + totalSpacePerBar / 2;
            const yLabelPosition = graphInnerY + graphInnerHeight + Math.round(15 * scale); // Posição abaixo do eixo X
            const yTickPosition = graphInnerY + graphInnerHeight;

            const labelOpacity = interpolate(frame, [40 + index * 2, 60 + index * 2], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            });

            return (
              <React.Fragment key={`label-x-${index}`}>
                <text
                  x={xPosition}
                  y={yLabelPosition}
                  textAnchor="middle" // Centralizado sob cada barra
                  fontSize={axisLabelFontSize}
                  fill={LABEL_COLOR}
                  opacity={labelOpacity}
                >
                  {label}
                </text>
                {/* Tick Marks do Eixo X [REGRA #1: Visíveis, curtos] */}
                <line
                  x1={xPosition}
                  y1={yTickPosition}
                  x2={xPosition}
                  y2={yTickPosition + tickMarkLength}
                  stroke={GRID_AXIS_TICK_COLOR}
                  strokeWidth={1}
                  opacity={labelOpacity}
                />
              </React.Fragment>
            );
          })}

          {/* Linha do Eixo Y (vertical) [REGRA #1: Visível] */}
          <line
            x1={graphInnerX}
            y1={graphInnerY}
            x2={graphInnerX}
            y2={graphInnerY + graphInnerHeight}
            stroke={GRID_AXIS_TICK_COLOR}
            strokeWidth={1}
            opacity={interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
          />
        </g>
      </svg>
    </div>
  );
};
