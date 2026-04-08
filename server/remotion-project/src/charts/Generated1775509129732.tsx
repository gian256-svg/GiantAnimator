import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (Conforme as Regras de Ouro do GiantAnimator)
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

interface BarChartReferenceProps {
  // A imagem de referência não possui título, legendas ou labels de valor nas barras.
  // Mantemos 'title' opcional, mas ele não será renderizado se não fornecido.
  title?: string;
  labels: string[];
  series: Array<{
    label?: string; // Não usado na referência, mas mantido para consistência
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
// Adaptado para replicar o formato da referência (números inteiros sem sufixos 'k'/'M')
const formatNumberReference = (num: number): string => {
  return Math.round(num).toLocaleString('en-US');
};

// Helper para gerar um range de números para os ticks do eixo Y
// A escala Y da referência é fixa de 0 a 250 com intervalos de 50.
const generateYAxisTicksReference = (maxValue: number, numTicks: number): number[] => {
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

export const BarChartReference: React.FC<BarChartReferenceProps> = ({
  title, // O título não é exibido na referência e será ignorado
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A imagem de referência tem uma proporção aproximadamente quadrada (cerca de 400x400px).
  // Ajustamos a escala para que o gráfico ocupe uma porção razoável do canvas do Remotion, mantendo a proporção.
  const baseReferenceSize = 400; // Assumimos 400px como a largura/altura base da imagem para cálculo de escala.
  const scale = Math.min(width / baseReferenceSize, height / baseReferenceSize) * 0.8; // Escala para caber no canvas

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty for BarChartReference. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#EFEFEF', // Fundo externo da referência
        color: '#000000',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Arial, sans-serif',
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  const data = series[0].data; // A referência possui apenas uma série de dados
  
  // Cores extraídas diretamente da imagem [REGRA #1 - Paleta de cores (extrair os hex exatos)]
  const canvasBackgroundColor = '#EFEFEF';   // Fundo externo da área de imagem
  const fullChartAreaFillColor = '#FFFFFF';   // Fundo branco que contém plot area + eixos
  const fullChartAreaBorderColor = '#A0A0A0'; // Borda ao redor de todo o gráfico (plot area + eixos)
  const barColor = '#E53935';                 // Vermelho vibrante das barras
  const gridLineColor = '#D8D8D8';            // Linhas cinza claro do grid
  const textColor = '#000000';               // Labels dos eixos e outros textos
  
  // Margens e dimensões baseadas na proporção da referência.
  // Calculadas para replicar o layout visual da imagem.
  const chartOuterPadding = Math.round(25 * scale); // Margem do canvas até a borda cinza externa do gráfico

  const fullChartAreaX = (width - (baseReferenceSize * scale)) / 2; // Centraliza o gráfico no canvas
  const fullChartAreaY = (height - (baseReferenceSize * scale)) / 2; // Centraliza o gráfico no canvas
  const fullChartAreaWidth = baseReferenceSize * scale;
  const fullChartAreaHeight = baseReferenceSize * scale;

  const fullChartAreaBorderThickness = Math.round(1 * scale);

  const yAxisLabelWidth = Math.round(40 * scale); // Espaço dedicado aos labels do eixo Y
  const xAxisLabelHeight = Math.round(25 * scale); // Espaço dedicado aos labels do eixo X

  // A área de plotagem é a área interna onde as barras e o grid são desenhados.
  const plotAreaX = fullChartAreaX + yAxisLabelWidth + fullChartAreaBorderThickness;
  const plotAreaY = fullChartAreaY + fullChartAreaBorderThickness;
  const plotWidth = fullChartAreaWidth - yAxisLabelWidth - (2 * fullChartAreaBorderThickness);
  const plotHeight = fullChartAreaHeight - xAxisLabelHeight - (2 * fullChartAreaBorderThickness);


  // Eixo Y: a referência mostra um máximo de 250, com ticks de 50 em 50.
  const chartMaxY = 250;
  const numYTicks = 5; // (0, 50, 100, 150, 200, 250) -> 6 labels, 5 intervalos
  const yTickValues = generateYAxisTicksReference(chartMaxY, numYTicks);

  const numBars = data.length;
  // Largura da barra e gap: visualmente, as barras ocupam cerca de 70% do espaço da categoria.
  const barGapPercentage = 0.3; // 30% para o gap
  const barWidthPercentage = 1 - barGapPercentage; // 70% para a barra
  const totalSpacePerBar = plotWidth / numBars;
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2;

  // Tipografia [REGRA #1 - Tipo de fonte e tamanhos]
  const axisLabelFontSize = Math.round(12 * scale);
  const fontFamily = 'Arial, sans-serif'; // A fonte padrão da referência é Arial ou similar.

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering BarChartReference frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: canvasBackgroundColor, // Fundo externo da referência
        fontFamily: fontFamily,
        transform: `scale(${chartScaleFactor})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
        width,
        height,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Fundo branco e borda externa do gráfico (engloba plot area e eixos)
            [REGRA #1: Replique-a fielmente. A referência tem esta borda.] */}
        <rect
          x={fullChartAreaX}
          y={fullChartAreaY}
          width={fullChartAreaWidth}
          height={fullChartAreaHeight}
          fill={fullChartAreaFillColor}
          stroke={fullChartAreaBorderColor}
          strokeWidth={fullChartAreaBorderThickness}
        />

        {/* Linhas Horizontais do Grid [REGRA #1: Estilo do grid (sólido)]
            A referência mostra linhas de grid sólidas, não dashed.
            A linha zero não possui destaque especial. */}
        {yTickValues.map((tickValue, index) => {
          const y = plotAreaY + plotHeight - (tickValue / chartMaxY) * plotHeight;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <line
              key={`grid-line-${index}`}
              x1={plotAreaX}
              y1={y}
              x2={plotAreaX + plotWidth}
              y2={y}
              stroke={gridLineColor}
              strokeWidth={Math.round(1 * scale)}
              // Na referência, o grid é sólido, não tracejado.
              opacity={gridLineOpacity}
            />
          );
        })}

        {/* Labels do Eixo Y [REGRA #1: Posição de labels] */}
        {yTickValues.map((tickValue, index) => {
          const y = plotAreaY + plotHeight - (tickValue / chartMaxY) * plotHeight;
          
          const labelOpacity = interpolate(frame, [15, 35], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`y-label-${index}`}
              x={fullChartAreaX + Math.round(10 * scale)} // Posição para alinhar com a referência
              y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
              textAnchor="start" // Alinhado à esquerda
              fontSize={axisLabelFontSize}
              fill={textColor}
              opacity={labelOpacity}
            >
              {formatNumberReference(tickValue)}
            </text>
          );
        })}

        {/* Barras [REGRA #1: Cores, espessura e arredondamento (nenhum)] */}
        {data.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const barRatio = chartMaxY > 0 ? value / chartMaxY : 0;
          let barHeightRaw = barRatio * plotHeight;
          
          // Garantir altura mínima visível para valores positivos, conforme regras de robustez.
          const minBarHeight = Math.round(4 * scale);
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = plotAreaX + index * totalSpacePerBar + barOffset;
          const barY = plotAreaY + plotHeight - actualBarHeight;

          // Animação de crescimento da barra [REGRAS DE ANIMAÇÃO]
          const animatedHeight = interpolate(
            frame,
            [10 + index * 4, 60 + index * 4], // staggered start
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
          
          // Na referência, as barras não possuem cantos arredondados.
          const borderRadius = 0; 

          return (
            <rect
              key={`bar-${index}`}
              x={barX}
              y={animatedY}
              width={barWidth}
              height={animatedHeight}
              fill={barColor}
              rx={borderRadius} 
              ry={borderRadius} 
            />
          );
        })}

        {/* Labels do Eixo X [REGRA #1: Posição de labels] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * totalSpacePerBar + barOffset + barWidth / 2;
          const y = plotAreaY + plotHeight + xAxisLabelHeight - Math.round(5 * scale); // Posição ajustada para replicar a imagem

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${index}`}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada barra
              fontSize={axisLabelFontSize}
              fill={textColor}
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

// Dados para teste, extraídos visualmente da imagem de referência
export const defaultBarChartReferenceData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  series: [
    {
      label: "Valores Diários", // Label não visível na referência, mas útil para dados
      data: [85, 155, 180, 210, 120] // Valores aproximados da imagem
    }
  ]
};

// Componente de composição para facilitar a visualização e teste no Remotion Studio
export const RemotionRoot: React.FC = () => {
  return (
    <BarChartReference
      labels={defaultBarChartReferenceData.labels}
      series={defaultBarChartReferenceData.series}
    />
  );
};
