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

interface BarChartRefProps {
  // Dados e título são hardcoded para replicar fielmente a imagem de referência
  // Se fosse um componente mais genérico, receberia props.
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
// Adaptado para a referência: apenas números inteiros, sem prefixo/sufixo
const formatNumberRef = (num: number): string => {
  // A referência mostra números inteiros pequenos, então toFixed(0) é apropriado.
  return num.toFixed(0);
};

export const BarChartReference: React.FC<BarChartRefProps> = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Dados inferidos da imagem de referência
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const data = [85, 155, 180, 210, 120]; // Valores estimados da imagem
  const maxValue = 250; // Valor máximo do eixo Y na referência (250)
  const minValue = 0;   // Valor mínimo do eixo Y na referência (0)

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A referência tem uma proporção quase 1:1. Vamos definir uma dimensão base para o gráfico
  // e escalá-la para caber no canvas, mantendo as proporções do layout da imagem.
  const BASE_GRAPHIC_CONTAINER_SIZE = 700; // Tamanho de referência para o contêiner do gráfico
  const scale = Math.min(
    width / (BASE_GRAPHIC_CONTAINER_SIZE + 200), // +200 para garantir espaço de margem
    height / (BASE_GRAPHIC_CONTAINER_SIZE + 200)
  );

  // Cores extraídas diretamente da imagem de referência [REGRAS DE CORES]
  const CANVAS_BG_COLOR = '#E7EDF3'; // Fundo do "card" cinza azulado
  const PLOT_AREA_BG_COLOR = '#FFFFFF'; // Fundo branco da área de plotagem
  const PLOT_AREA_BORDER_COLOR = '#181818'; // Borda preta da área de plotagem
  const BAR_COLOR = '#E63D31'; // Vermelho das barras
  const BAR_BORDER_COLOR = '#181818'; // Borda sutil das barras
  const GRID_LINE_COLOR = '#D4D4D4'; // Cinza das linhas de grid
  const AXIS_LABEL_COLOR = '#181818'; // Cor dos labels dos eixos

  // Espessuras e paddings dimensionados pela escala
  const plotAreaBorderThickness = Math.round(1.5 * scale); // Borda preta da plot area
  const barBorderThickness = Math.round(1 * scale); // Borda das barras
  const gridLineThickness = Math.round(1 * scale); // Espessura das linhas de grid

  // Definindo as dimensões do "card" do gráfico (a área cinza que contém tudo)
  const graphicCardWidth = Math.round(BASE_GRAPHIC_CONTAINER_SIZE * scale);
  const graphicCardHeight = Math.round(BASE_GRAPHIC_CONTAINER_SIZE * scale);

  // Centralizar o card do gráfico no canvas
  const graphicCardX = (width - graphicCardWidth) / 2;
  const graphicCardY = (height - graphicCardHeight) / 2;

  // Espaçamento interno dentro do 'card' cinza para a plot area com borda
  const plotAreaPaddingInsideCard = Math.round(40 * scale);

  // Dimensões da área de plotagem (retângulo branco com borda preta)
  const plotAreaOuterX = graphicCardX + plotAreaPaddingInsideCard;
  const plotAreaOuterY = graphicCardY + plotAreaPaddingInsideCard;
  const plotAreaOuterWidth = graphicCardWidth - 2 * plotAreaPaddingInsideCard;
  const plotAreaOuterHeight = graphicCardHeight - 2 * plotAreaPaddingInsideCard;

  // Largura para labels do eixo Y e altura para labels do eixo X, relativos à plot area
  const yAxisLabelAreaWidth = Math.round(35 * scale); // Espaço para '0', '50', etc.
  const xAxisLabelAreaHeight = Math.round(20 * scale); // Espaço para 'Mon', 'Tue', etc.

  // A área interna onde o grid e as barras são desenhados (dentro da borda preta)
  const innerPlotX = plotAreaOuterX + yAxisLabelAreaWidth + plotAreaBorderThickness;
  const innerPlotY = plotAreaOuterY + plotAreaBorderThickness;
  const innerPlotWidth = plotAreaOuterWidth - yAxisLabelAreaWidth - 2 * plotAreaBorderThickness;
  const innerPlotHeight = plotAreaOuterHeight - xAxisLabelAreaHeight - 2 * plotAreaBorderThickness;

  // Tipografia [REGRAS DE TIPOGRAFIA E LABELS]
  const axisLabelFontSize = Math.round(12 * scale);
  const axisLabelFontFamily = 'Arial, sans-serif'; // Mais fiel à aparência da referência

  // Eixo Y ticks (exatamente os valores da referência)
  const yTickValues = [0, 50, 100, 150, 200, 250];

  // Configuração das barras [REGRAS POR TIPO DE GRÁFICO -> Bar Chart]
  const numBars = data.length;
  const totalSpacePerBar = innerPlotWidth / numBars;
  const barWidthPercentage = 0.65; // ~65% da largura da categoria, visualmente na referência
  const barWidth = Math.round(totalSpacePerBar * barWidthPercentage);
  const barOffset = (totalSpacePerBar - barWidth) / 2; // Centraliza a barra

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade)
  const chartEntrance = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering BarChartReference frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: CANVAS_BG_COLOR, // Fundo do canvas (a cor do "card" externo)
        fontFamily: axisLabelFontFamily,
        opacity: chartEntrance,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Área de Plotagem com Borda Preta [REGRAS DE ESTRUTURA E LAYOUT] */}
        {/* Esta é a caixa branca com a borda preta que contém as barras e o grid */}
        <rect
          x={plotAreaOuterX}
          y={plotAreaOuterY}
          width={plotAreaOuterWidth}
          height={plotAreaOuterHeight}
          fill={PLOT_AREA_BG_COLOR}
          stroke={PLOT_AREA_BORDER_COLOR}
          strokeWidth={plotAreaBorderThickness}
        />

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const yPos = maxValue > 0
            ? innerPlotY + innerPlotHeight - (tickValue / maxValue) * innerPlotHeight
            : innerPlotY + innerPlotHeight; // Se maxValue é 0, todos os pontos ficam na base

          // Animação de aparição sutil do grid e labels
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              {/* Linhas de Grid - Sólidas, conforme a referência [REGRAS DE ESTRUTURA E LAYOUT] */}
              <line
                x1={innerPlotX}
                y1={yPos}
                x2={innerPlotX + innerPlotWidth}
                y2={yPos}
                stroke={GRID_LINE_COLOR}
                strokeWidth={gridLineThickness}
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={innerPlotX - Math.round(5 * scale)} // 5px de padding entre o label e a borda preta
                y={yPos + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={AXIS_LABEL_COLOR}
                opacity={gridLineOpacity}
              >
                {formatNumberRef(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Barras e Borda das Barras [REGRAS POR TIPO DE GRÁFICO -> Bar Chart] */}
        {data.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const barRatio = maxValue > 0 ? value / maxValue : 0;
          let barHeightRaw = barRatio * innerPlotHeight;
          
          // Garantir altura mínima visível para valores positivos
          const minBarHeight = Math.round(1 * scale); // [Regras de Edge Cases]
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = innerPlotX + index * totalSpacePerBar + barOffset;
          const barY = innerPlotY + innerPlotHeight - actualBarHeight;

          // Animação de crescimento da barra [REGRAS DE ANIMAÇÃO]
          const animatedHeight = interpolate(
            frame,
            [10 + index * 4, 60 + index * 4], // Staggered start para cada barra
            [0, actualBarHeight],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const animatedY = interpolate(
            frame,
            [10 + index * 4, 60 + index * 4],
            [innerPlotY + innerPlotHeight, barY], // Y inicial (base) até Y final (topo da barra)
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
              stroke={BAR_BORDER_COLOR} // Borda das barras
              strokeWidth={barBorderThickness} // Espessura da borda
              // [BAR CHART] - Cantos arredondados: A referência não tem, então não aplicamos rx/ry.
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = innerPlotX + index * totalSpacePerBar + barOffset + barWidth / 2;
          const y = innerPlotY + innerPlotHeight + Math.round(10 * scale); // 10px de padding abaixo da borda preta

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada barra
              fontSize={axisLabelFontSize}
              fill={AXIS_LABEL_COLOR}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
