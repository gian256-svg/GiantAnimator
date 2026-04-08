import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (mantidas como padrão do GiantAnimator)
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

// Interface para as props do componente, baseada na estrutura de dados inferida da imagem
interface BarChartReferenceProps {
  labels: string[]; // Labels para o eixo X
  series: Array<{
    data: number[]; // Apenas uma série de dados para o Bar Chart simples
  }>;
}

// Helper para formatação de números, fiel à referência (apenas inteiros)
const formatNumberReference = (num: number): string => {
  return Math.round(num).toString();
};

// Helper para gerar os ticks do eixo Y, fiel à referência (passos de 50 até 250)
const generateYAxisTicksReference = (maxReferenceValue: number, tickStep: number): number[] => {
  const ticks = [];
  for (let i = 0; i <= maxReferenceValue; i += tickStep) {
    ticks.push(i);
  }
  return ticks;
};

export const BarChartReference: React.FC<BarChartReferenceProps> = ({
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional, baseada em 1920x1080
  const scale = Math.min(width / 1920, height / 1080);
  console.log(`[${new Date().toISOString()}] GiantAnimator: Gerando BarChartReference com escala: ${scale.toFixed(2)}`);

  // [REGRA ABSOLUTA #1] - Extração de cores da referência visual
  const chartOuterBackgroundColor = '#E0E6EB'; // Fundo do canvas (área total do vídeo)
  const plotAreaBackgroundColor = '#FFFFFF'; // Fundo da área do gráfico (onde barras e grid aparecem)
  const barColor = '#E63946'; // Cor das barras
  const barBorderColor = '#333333'; // Cor da borda ao redor do gráfico e das barras
  const gridLineColor = '#D0D0D0'; // Cor das linhas do grid
  const axisTextColor = '#333333'; // Cor do texto dos eixos

  // [REGRA ABSOLUTA #1] - Determinar layout e proporções da referência
  const CHART_OUTER_PADDING = Math.round(20 * scale); // Padding do SVG para a borda externa escura do gráfico
  const CHART_BORDER_WIDTH = Math.round(1 * scale); // Espessura da borda escura ao redor de todo o gráfico visual

  // Espaço reservado para labels do eixo Y e X
  const Y_AXIS_LABEL_SPACE = Math.round(35 * scale); // Largura para "250"
  const X_AXIS_LABEL_SPACE = Math.round(25 * scale); // Altura para "Mon"

  // Largura e altura da área de plotagem (o retângulo branco com barras e grid)
  const plotWidth = width - (2 * CHART_OUTER_PADDING) - (2 * CHART_BORDER_WIDTH) - Y_AXIS_LABEL_SPACE;
  const plotHeight = height - (2 * CHART_OUTER_PADDING) - (2 * CHART_BORDER_WIDTH) - X_AXIS_LABEL_SPACE;

  // Posição inicial (x, y) da área de plotagem
  const plotAreaX = CHART_OUTER_PADDING + CHART_BORDER_WIDTH + Y_AXIS_LABEL_SPACE;
  const plotAreaY = CHART_OUTER_PADDING + CHART_BORDER_WIDTH;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.warn(`[${new Date().toISOString()}] GiantAnimator: Dados da série vazios ou inválidos. Exibindo estado de fallback.`);
    return (
      <div style={{
        backgroundColor: chartOuterBackgroundColor,
        color: axisTextColor,
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
  
  const data = series[0].data; 
  // [REGRA ABSOLUTA #1] - MaxValue e MinValue fixos conforme a referência visual (eixo Y vai de 0 a 250)
  const effectiveMaxValue = 250; 
  const effectiveMinValue = 0; 
  
  const numBars = data.length;
  // [REGRAS POR TIPO DE GRÁFICO -> Bar Chart] - Largura da barra e gap (estimado da referência)
  const barGapPercentage = 0.35; // Gap de 35% do espaço total por categoria
  const barWidthPercentage = 1 - barGapPercentage; // Barra ocupa 65%
  const totalSpacePerBar = plotWidth / numBars; // Espaço horizontal disponível por barra
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2; // Centraliza a barra no espaço

  // [REGRA ABSOLUTA #1] - Tamanho da fonte dos labels dos eixos (estimado da referência)
  const axisLabelFontSize = Math.round(11 * scale);
  
  // [REGRA ABSOLUTA #1] - Ticks do eixo Y: 0, 50, 100, 150, 200, 250
  const yTickValues = generateYAxisTicksReference(effectiveMaxValue, 50);

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

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: chartOuterBackgroundColor, // Fundo do canvas conforme referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* [REGRA ABSOLUTA #1] - Borda externa escura do gráfico visual */}
        <rect
          x={CHART_OUTER_PADDING}
          y={CHART_OUTER_PADDING}
          width={width - 2 * CHART_OUTER_PADDING}
          height={height - 2 * CHART_OUTER_PADDING}
          fill="none"
          stroke={barBorderColor}
          strokeWidth={CHART_BORDER_WIDTH}
        />

        {/* [REGRA ABSOLUTA #1] - Fundo branco da área de plotagem */}
        <rect
          x={plotAreaX}
          y={plotAreaY}
          width={plotWidth}
          height={plotHeight}
          fill={plotAreaBackgroundColor}
        />

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = (effectiveMaxValue - effectiveMinValue) > 0 
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinValue) / (effectiveMaxValue - effectiveMinValue)) * plotHeight
            : plotAreaY + plotHeight; // Se range é zero, todos na base

          // [REGRA ABSOLUTA #1] - Todas as linhas de grid são uniformes e sólidas, sem destaque para a linha zero
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
                stroke={gridLineColor}
                strokeWidth={1 * scale} // Espessura fina
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRA ABSOLUTA #1] - Posição e formatação */}
              <text
                x={plotAreaX - Math.round(5 * scale)} // Padding entre label e plot area
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumberReference(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Barras [REGRAS POR TIPO DE GRÁFICO -> Bar Chart] */}
        {data.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const valueAdjusted = Math.max(value, effectiveMinValue); // Não permitir valores abaixo de effectiveMinValue (0) para cálculo da altura
          const barRatio = (effectiveMaxValue - effectiveMinValue) > 0 ? (valueAdjusted - effectiveMinValue) / (effectiveMaxValue - effectiveMinValue) : 0;
          let barHeightRaw = barRatio * plotHeight;
          
          const minBarHeight = Math.round(1 * scale); // Altura mínima para que barras com valor 0 não sumam
          const actualBarHeight = valueAdjusted > effectiveMinValue ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = plotAreaX + index * totalSpacePerBar + barOffset;
          const barY = plotAreaY + plotHeight - actualBarHeight;

          // Animação de crescimento da barra [REGRAS DE ANIMAÇÃO]
          // Crescimento de baixo para cima: height de 0 até valor final
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
            [plotAreaY + plotHeight, barY], // Y inicial (base) até Y final (topo da barra)
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [REGRA ABSOLUTA #1] - Sem cantos arredondados, com borda escura fina
          return (
            <rect
              key={`bar-${labels[index]}`}
              x={barX}
              y={animatedY}
              width={barWidth}
              height={animatedHeight}
              fill={barColor}
              stroke={barBorderColor}
              strokeWidth={CHART_BORDER_WIDTH / 2} // Borda mais fina que a externa
              rx={0} // Sem arredondamento
              ry={0} // Sem arredondamento
            />
          );
        })}

        {/* Labels do Eixo X [REGRA ABSOLUTA #1] - Posição e formatação */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * totalSpacePerBar + barOffset + barWidth / 2;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo da plot area

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`label-x-${label}`}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada barra
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
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

// Dados inferidos da imagem de referência para uso direto
const inferredDataFromReference = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  series: [
    {
      data: [85, 155, 180, 210, 125] // Valores aproximados da imagem
    }
  ]
};

// Componente Wrapper para Remotion Composition
// Para usar em sua Composition.tsx:
// <Composition
//   id="BarChartFromImageReference"
//   component={() => <BarChartReference {...inferredDataFromReference} />}
//   durationInFrames={90} // 3 segundos a 30fps
//   fps={30}
//   width={1920}
//   height={1080}
// />
export const RemotionBarChartFromImageReference: React.FC = () => (
  <BarChartReference {...inferredDataFromReference} />
);

