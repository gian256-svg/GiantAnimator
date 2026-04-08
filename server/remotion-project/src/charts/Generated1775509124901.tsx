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

// Dados extraídos da imagem de referência
interface ChartData {
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Valores aproximados extraídos visualmente da imagem
const referenceData: ChartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  series: [
    {
      label: "Values",
      data: [85, 155, 180, 210, 120] // Valores aproximados da altura das barras
    }
  ]
};

// Helper para formatação de números, simplificado para o estilo da referência
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US'); // A referência usa números inteiros sem formatação especial
};

export const BarChartReference: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional baseada em Full HD
  const baseWidth = 1920;
  const baseHeight = 1080;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  // [REGRA #1: REPLICAR FIELMENTE] - Cores extraídas da imagem
  const canvasBackgroundColor = '#EAEAEA'; // Fundo do canvas (externo)
  const canvasBorderColor = '#333333';
  const plotAreaBackgroundColor = '#FFFFFF'; // Fundo da área do gráfico (interno)
  const plotAreaBorderColor = '#333333';
  const barColor = '#E33534'; // Vermelho vibrante das barras
  const barBorderColor = '#000000'; // Borda preta fina das barras
  const gridLineColor = '#C0C0C0'; // Linhas de grid cinza
  const axisLabelColor = '#333333'; // Cor dos labels dos eixos
  
  // [REGRA #1: REPLICAR FIELMENTE] - Proporções e espaçamentos
  const canvasBorderRadius = Math.round(8 * scale);
  const canvasBorderWidth = Math.round(1 * scale);

  // Margens e paddings para replicar o layout da imagem
  const outerPadding = Math.round(20 * scale); // Padding do canvas para a área visível do gráfico
  const yAxisLabelWidth = Math.round(45 * scale); // Espaço para labels '250'
  const xAxisLabelHeight = Math.round(25 * scale); // Espaço para labels 'Mon'

  // O plot area tem uma borda separada e um padding interno
  const plotAreaBorderWidth = Math.round(1 * scale);
  const plotAreaPadding = Math.round(10 * scale); // Padding interno do plot area para os elementos gráficos

  // Definindo a área total de conteúdo (onde o gráfico e eixos residem)
  const contentWidth = width - 2 * outerPadding - 2 * canvasBorderWidth;
  const contentHeight = height - 2 * outerPadding - 2 * canvasBorderWidth;

  // Calculando a área do plot, que é a parte branca com grid e barras
  const plotX = outerPadding + canvasBorderWidth + yAxisLabelWidth + plotAreaPadding;
  const plotY = outerPadding + canvasBorderWidth + plotAreaPadding;
  const plotWidth = contentWidth - yAxisLabelWidth - 2 * plotAreaPadding;
  const plotHeight = contentHeight - xAxisLabelHeight - 2 * plotAreaPadding;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  const labels = referenceData.labels;
  const data = referenceData.series[0].data;

  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: canvasBackgroundColor,
        color: axisLabelColor,
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

  // [REGRA #1: REPLICAR FIELMENTE] - Eixo Y sempre começa em 0, max na imagem é 250
  const effectiveMaxValue = 250;
  
  const numBars = data.length;
  // [REGRA #1: REPLICAR FIELMENTE] - Largura da barra e gap da referência
  // Visualmente, o gap parece ser cerca de 30% do espaço total por categoria, barra 70%
  const barWidthPercentage = 0.7; 
  const totalSpacePerBar = plotWidth / numBars;
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2;

  // [REGRA #1: REPLICAR FIELMENTE] - Tipografia
  const axisLabelFontSize = Math.round(11 * scale); // Tamanho dos números do eixo Y e labels do eixo X

  // Calcular tick marks do eixo Y baseado na imagem (0, 50, 100, 150, 200, 250)
  const yTickValues = [0, 50, 100, 150, 200, 250];

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering BarChartReference frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: canvasBackgroundColor,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
        borderRadius: canvasBorderRadius,
        border: `${canvasBorderWidth}px solid ${canvasBorderColor}`,
        boxSizing: 'border-box', // Garante que border e padding são incluídos no width/height
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Plot Area Background e Borda [REGRA #1: REPLICAR FIELMENTE] */}
        <rect
          x={plotX - plotAreaBorderWidth}
          y={plotY - plotAreaBorderWidth}
          width={plotWidth + 2 * plotAreaBorderWidth}
          height={plotHeight + 2 * plotAreaBorderWidth}
          fill={plotAreaBackgroundColor}
          stroke={plotAreaBorderColor}
          strokeWidth={plotAreaBorderWidth}
        />

        {/* Grid Horizontais e Labels do Eixo Y [REGRA #1: REPLICAR FIELMENTE] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = effectiveMaxValue > 0 
            ? plotY + plotHeight - (tickValue / effectiveMaxValue) * plotHeight
            : plotY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          // [REGRA #1: REPLICAR FIELMENTE] - Linhas de grid são SÓLIDAS na referência
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotX}
                y1={y}
                x2={plotX + plotWidth}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={Math.round(1 * scale)} // Linhas finas
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRA #1: REPLICAR FIELMENTE] */}
              <text
                x={plotX - plotAreaPadding} // Posição à esquerda do plot area
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisLabelColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Eixo Y (linha vertical) [REGRA #1: REPLICAR FIELMENTE] */}
        <line
            x1={plotX}
            y1={plotY}
            x2={plotX}
            y2={plotY + plotHeight}
            stroke={plotAreaBorderColor}
            strokeWidth={plotAreaBorderWidth}
            opacity={interpolate(frame, [10, 30], [0, 1], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_SUBTLE,
            })}
        />

        {/* Eixo X (linha horizontal - baseline) [REGRA #1: REPLICAR FIELMENTE] */}
        <line
            x1={plotX}
            y1={plotY + plotHeight}
            x2={plotX + plotWidth}
            y2={plotY + plotHeight}
            stroke={plotAreaBorderColor}
            strokeWidth={plotAreaBorderWidth}
            opacity={interpolate(frame, [10, 30], [0, 1], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_SUBTLE,
            })}
        />

        {/* Barras [REGRA #1: REPLICAR FIELMENTE] */}
        {data.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const barRatio = effectiveMaxValue > 0 ? value / effectiveMaxValue : 0;
          let barHeightRaw = barRatio * plotHeight;
          
          // Se o valor for muito pequeno mas positivo, garantir altura mínima visível
          const minBarHeight = Math.round(1 * scale); // Menor que o padrão 4px, para replicar a imagem
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = plotX + index * totalSpacePerBar + barOffset;
          const barY = plotY + plotHeight - actualBarHeight;

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
            [plotY + plotHeight, barY], // Y inicial (base) até Y final (topo da barra)
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [REGRA #1: REPLICAR FIELMENTE] - Cantos levemente arredondados nas barras
          const borderRadius = Math.round(2 * scale); // Pequeno raio para replicar a imagem
          const barBorderWidth = Math.round(1 * scale); // Borda preta fina

          return (
            <rect
              key={labels[index]}
              x={barX}
              y={animatedY}
              width={barWidth}
              height={animatedHeight}
              fill={barColor}
              stroke={barBorderColor}
              strokeWidth={barBorderWidth}
              rx={borderRadius} 
              ry={borderRadius} 
            />
          );
        })}

        {/* Labels do Eixo X [REGRA #1: REPLICAR FIELMENTE] */}
        {labels.map((label, index) => {
          const x = plotX + index * totalSpacePerBar + barOffset + barWidth / 2;
          const y = plotY + plotHeight + plotAreaPadding + Math.round(5 * scale); // Posição abaixo do eixo

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
              fill={axisLabelColor}
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
