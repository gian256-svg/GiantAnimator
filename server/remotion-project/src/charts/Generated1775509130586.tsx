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

interface BarChartProps {
  // A imagem de referência não possui um título visível, portanto, não será renderizado explicitamente.
  // Manter a prop como boa prática de interface, mas o componente não a exibirá para fidelidade.
  title?: string; 
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, decimals: number = 0): string => {
  // A referência visual usa números inteiros nos labels do eixo Y.
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}k`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 0 })}M`;
};

export const BarChartReference: React.FC<BarChartProps> = ({
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A imagem de referência tem um aspecto quase quadrado. Usaremos 1280x960 (4:3) como base.
  const baseWidth = 1280;
  const baseHeight = 960;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  // --- CORES EXTRAÍDAS FIELMENTE DA REFERÊNCIA ---
  const outerBackgroundColor = '#E6E8EA'; // Fundo do canvas (área cinza clara)
  const plotAreaBackgroundColor = '#FFFFFF'; // Fundo da área do gráfico (branco)
  const barColor = '#E62020'; // Vermelho das barras
  const gridLineColor = '#CCCCCC'; // Cinza das linhas do grid
  const textColor = '#000000'; // Cor dos labels dos eixos
  const outerBorderColor = '#5B5B5B'; // Borda externa escura
  const outerBorderRadius = Math.round(10 * scale); // Borda arredondada externa

  // --- DIMENSÕES E MARGENS (replicando visualmente a referência) ---
  const PADDING_OUTER = Math.round(20 * scale); // Padding entre a borda do canvas e a área cinza
  const PADDING_PLOT_AREA_TOP = Math.round(30 * scale); // Padding dentro da área cinza, acima do plot
  const PADDING_PLOT_AREA_BOTTOM = Math.round(40 * scale); // Padding dentro da área cinza, abaixo do plot
  const PADDING_PLOT_AREA_LEFT = Math.round(20 * scale); // Padding dentro da área cinza, à esquerda do plot
  const PADDING_PLOT_AREA_RIGHT = Math.round(15 * scale); // Padding dentro da área cinza, à direita do plot

  const chartOuterWidth = width - 2 * PADDING_OUTER;
  const chartOuterHeight = height - 2 * PADDING_OUTER;

  // Calculando largura e altura da área de plot principal
  // Labels Y estão à esquerda do plot. Labels X estão abaixo do plot.
  const Y_AXIS_LABEL_WIDTH = Math.round(40 * scale); // Espaço para labels do eixo Y
  const X_AXIS_LABEL_HEIGHT = Math.round(20 * scale); // Espaço para labels do eixo X

  const plotWidth = chartOuterWidth - PADDING_PLOT_AREA_LEFT - PADDING_PLOT_AREA_RIGHT - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartOuterHeight - PADDING_PLOT_AREA_TOP - PADDING_PLOT_AREA_BOTTOM - X_AXIS_LABEL_HEIGHT;

  const actualPlotAreaX = PADDING_PLOT_AREA_LEFT + Y_AXIS_LABEL_WIDTH; // X inicial da área de desenho do gráfico
  const actualPlotAreaY = PADDING_PLOT_AREA_TOP; // Y inicial da área de desenho do gráfico

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: outerBackgroundColor,
        color: textColor,
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
  
  const data = series[0].data; // Utiliza apenas a primeira série para este tipo de gráfico

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  // A imagem mostra o eixo Y fixo de 0 a 250
  const maxValue = 250; 
  
  const numBars = data.length;
  // [BAR CHART] - Largura da barra e gap - Estimado visualmente da referência
  const barGapPercentage = 0.35; // A imagem sugere um gap visível entre as barras
  const barWidthPercentage = 1 - barGapPercentage; 
  const totalSpacePerBar = plotWidth / numBars;
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2;

  // [TIPOGRAFIA E LABELS] - Estimado visualmente da referência
  const axisLabelFontSize = Math.round(14 * scale); // Labels X e Y
  const gridLineStrokeWidth = Math.round(1 * scale); // Linhas finas do grid

  // Calcular tick marks do eixo Y [REGRAS DE ESTRUTURA E LAYOUT]
  const yTickValues = [0, 50, 100, 150, 200, 250]; // Valores fixos da referência

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
        backgroundColor: outerBackgroundColor, // Fundo do canvas (área cinza clara)
        fontFamily: 'Arial, sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: PADDING_OUTER, // Padding externo para a borda arredondada
      }}
    >
      <div
        style={{
          width: chartOuterWidth,
          height: chartOuterHeight,
          backgroundColor: plotAreaBackgroundColor, // Fundo da área do gráfico (branco)
          borderRadius: outerBorderRadius, // Borda arredondada externa
          border: `${Math.round(2 * scale)}px solid ${outerBorderColor}`, // Borda externa escura
          boxSizing: 'border-box',
          overflow: 'hidden', // Garante que nenhum elemento (como labels) saia da área arredondada
        }}
      >
        <svg width={chartOuterWidth} height={chartOuterHeight} viewBox={`0 0 ${chartOuterWidth} ${chartOuterHeight}`}>
          {/* A imagem de referência não possui título visível. REGRA #1: Não adicionar. */}

          {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
          {yTickValues.map((tickValue, index) => {
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
            const y = maxValue > 0 
              ? actualPlotAreaY + plotHeight - (tickValue / maxValue) * plotHeight
              : actualPlotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

            const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            });

            return (
              <React.Fragment key={`grid-line-${index}`}>
                {/* Linhas do Grid [REGRAS DE ESTRUTURA E LAYOUT] */}
                <line
                  x1={actualPlotAreaX}
                  y1={y}
                  x2={actualPlotAreaX + plotWidth}
                  y2={y}
                  stroke={gridLineColor}
                  strokeWidth={gridLineStrokeWidth}
                  // REGRA #1: Linhas do grid são sólidas na referência, não tracejadas.
                  opacity={gridLineOpacity}
                />
                {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
                <text
                  x={actualPlotAreaX - Math.round(5 * scale)} // Padding à esquerda do plot
                  y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                  textAnchor="end" // Alinhado à direita
                  fontSize={axisLabelFontSize}
                  fill={textColor}
                  opacity={gridLineOpacity}
                >
                  {formatNumber(tickValue)}
                </text>
              </React.Fragment>
            );
          })}

          {/* Barras [REGRAS POR TIPO DE GRÁFICO -> Bar Chart] */}
          {data.map((value, index) => {
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
            const barRatio = maxValue > 0 ? value / maxValue : 0;
            let barHeightRaw = barRatio * plotHeight;
            
            // Se o valor for muito pequeno mas positivo, garantir altura mínima visível
            const minBarHeight = Math.round(1 * scale); // [Regras de Edge Cases]
            const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

            const barX = actualPlotAreaX + index * totalSpacePerBar + barOffset;
            const barY = actualPlotAreaY + plotHeight - actualBarHeight;

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
              [actualPlotAreaY + plotHeight, barY], // Y inicial (base) até Y final (topo da barra)
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_MAIN,
              }
            );
            
            // REGRA #1: A imagem NÃO tem labels de valor acima das barras. Não adicionar.
            // REGRA #1: A imagem TEM cantos retos nas barras. Não adicionar borderRadius.

            return (
              <rect
                key={labels[index]}
                x={barX}
                y={animatedY}
                width={barWidth}
                height={animatedHeight}
                fill={barColor}
              />
            );
          })}

          {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
          {labels.map((label, index) => {
            const x = actualPlotAreaX + index * totalSpacePerBar + barOffset + barWidth / 2;
            const y = actualPlotAreaY + plotHeight + Math.round(10 * scale); // Posição abaixo do eixo

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
                fill={textColor}
                opacity={labelOpacity}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
