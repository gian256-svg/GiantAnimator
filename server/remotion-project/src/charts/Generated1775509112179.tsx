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

// --- DADOS INFERIDOS DA IMAGEM DE REFERÊNCIA ---
// [REGRA ABSOLUTA #1] - Replicar fielmente o layout e os dados visíveis
const REFERENCE_DATA = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  data: [85, 155, 180, 210, 125],
  yMax: 250,
  yTickInterval: 50,
};

interface BarChartReferenceProps {
  // Não há props explícitas de dados, pois a referência é a fonte primária.
  // No entanto, para flexibilidade futura, poderiam ser passadas via props.
}

export const BarChartReference: React.FC<BarChartReferenceProps> = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080); // Baseado em um canvas Full HD

  // --- CORES EXTRAÍDAS FIELMENTE DA IMAGEM DE REFERÊNCIA ---
  // [REGRA ABSOLUTA #1] - Paleta de cores (extrair os hex exatos)
  const canvasBgColor = '#E6E6E6'; // Fundo geral do "frame" da imagem
  const plotAreaBgColor = '#FFFFFF'; // Fundo branco da área do gráfico
  const plotAreaBorderColor = '#666666'; // Borda da área do gráfico (funciona como eixos)
  const barFillColor = '#E23939'; // Vermelho das barras
  const barStrokeColor = '#BB2B2B'; // Borda sutil das barras (vermelho mais escuro)
  const gridLineColor = '#CCCCCC'; // Cor das linhas de grid
  const textColor = '#333333'; // Cor do texto dos labels

  // --- LAYOUT E PROPORÇÕES ---
  // [REGRA ABSOLUTA #1] - Proporções e espaçamentos
  const chartPadding = Math.round(50 * scale); // Padding entre o canvas e a área do gráfico
  const plotAreaWidth = width - 2 * chartPadding;
  const plotAreaHeight = height - 2 * chartPadding;

  const plotAreaX = chartPadding;
  const plotAreaY = chartPadding;

  // Ajustes para as margens internas do plot area para acomodar labels
  const yAxisLabelWidth = Math.round(40 * scale); // Espaço para labels do eixo Y
  const xAxisLabelHeight = Math.round(30 * scale); // Espaço para labels do eixo X

  const actualPlotAreaX = plotAreaX + yAxisLabelWidth;
  const actualPlotAreaY = plotAreaY;
  const actualPlotWidth = plotAreaWidth - yAxisLabelWidth;
  const actualPlotHeight = plotAreaHeight - xAxisLabelHeight;

  // Dados do gráfico
  const { labels, data, yMax, yTickInterval } = REFERENCE_DATA;
  const numBars = data.length;

  // Barras
  const totalSpacePerBar = actualPlotWidth / numBars;
  const barWidthPercentage = 0.65; // Est. 65% do espaço disponível
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barGap = (totalSpacePerBar - barWidth) / 2; // Gap de cada lado da barra

  // Ticks do Eixo Y [REGRA ABSOLUTA #1] - Escala Y da imagem
  const yTickValues = Array.from({ length: (yMax / yTickInterval) + 1 }, (_, i) => i * yTickInterval);

  // --- TIPOGRAFIA ---
  // [REGRA ABSOLUTA #1] - Tipo de fonte e tamanhos
  const axisLabelFontSize = Math.round(14 * scale); // Tamanho dos labels dos eixos
  const fontFamily = 'Arial, sans-serif'; // Fonte genérica sans-serif que se assemelha

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

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de renderizar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for BarChartReference. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: canvasBgColor,
        color: textColor,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: fontFamily,
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: canvasBgColor, // Fundo do canvas conforme referência
        fontFamily: fontFamily,
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Fundo branco da área do gráfico + borda que funciona como eixos */}
        {/* [REGRA ABSOLUTA #1] - Replicar borda da área do gráfico como eixos */}
        <rect
          x={plotAreaX}
          y={plotAreaY}
          width={plotAreaWidth}
          height={plotAreaHeight}
          fill={plotAreaBgColor}
          stroke={plotAreaBorderColor}
          strokeWidth={1 * scale}
        />

        {/* Grid Horizontais e Labels do Eixo Y [REGRA ABSOLUTA #1] */}
        {yTickValues.map((tickValue, index) => {
          // Ajuste para o "250" que está ligeiramente acima da linha
          const yPosAdjustment = (tickValue === yMax) ? Math.round(5 * scale) : 0;
          
          const y = actualPlotAreaY + actualPlotHeight - (tickValue / yMax) * actualPlotHeight;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              {/* [REGRA ABSOLUTA #1] - Estilo do grid: sólido (não dashed) */}
              <line
                x1={actualPlotAreaX}
                y1={y}
                x2={actualPlotAreaX + actualPlotWidth}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={1 * scale}
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRA ABSOLUTA #1] - Posição e alinhamento */}
              <text
                x={actualPlotAreaX - Math.round(10 * scale)} // Espaço do eixo
                y={y + Math.round(axisLabelFontSize / 3) - yPosAdjustment} // Ajuste vertical para centralizar e para o 250
                textAnchor="end" // Alinhado à direita dos ticks
                fontSize={axisLabelFontSize}
                fill={textColor}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Barras [REGRA ABSOLUTA #1] - Cores, espessura e arredondamento (cantos retos) */}
        {data.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const barRatio = yMax > 0 ? value / yMax : 0;
          let barHeightRaw = barRatio * actualPlotHeight;
          
          // Se o valor for muito pequeno mas positivo, garantir altura mínima visível
          const minBarHeight = Math.round(1 * scale); // Altura mínima de 1px para ser visível
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = actualPlotAreaX + index * totalSpacePerBar + barGap;
          const barY = actualPlotAreaY + actualPlotHeight - actualBarHeight;

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
            [actualPlotAreaY + actualPlotHeight, barY], // Y inicial (base) até Y final (topo da barra)
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
              fill={barFillColor}
              stroke={barStrokeColor} // Borda das barras
              strokeWidth={1 * scale}
              rx={0} ry={0} // [REGRA ABSOLUTA #1] - Cantos retos, não arredondados
            />
          );
        })}

        {/* Labels do Eixo X [REGRA ABSOLUTA #1] - Posição e alinhamento */}
        {labels.map((label, index) => {
          const x = actualPlotAreaX + index * totalSpacePerBar + barGap + barWidth / 2;
          const y = actualPlotAreaY + actualPlotHeight + Math.round(15 * scale); // Posição abaixo do eixo

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
  );
};
