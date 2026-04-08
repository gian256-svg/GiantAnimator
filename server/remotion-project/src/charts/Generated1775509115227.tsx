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
  // Título é opcional, pois não está presente na referência
  title?: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number): string => {
  // A referência mostra números inteiros para o eixo Y
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

// Helper para gerar um range de números para os ticks do eixo Y, com base na referência
const generateYAxisTicks = (maxValue: number, step: number): number[] => {
  const ticks = [];
  for (let i = 0; i <= maxValue; i += step) {
    ticks.push(i);
  }
  return ticks;
};

export const BarChart: React.FC<BarChartProps> = ({
  title, // Opcional
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  console.log(`[${new Date().toISOString()}] GiantAnimator: Gerando BarChart para a imagem de referência.`);

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional (base 1920x1080)
  const baseWidth = 1920;
  const baseHeight = 1080;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  // Cores extraídas diretamente da imagem de referência
  const CANVAS_BACKGROUND_COLOR = '#E7EBF0';
  const PLOT_AREA_BACKGROUND_COLOR = '#FFFFFF';
  const PLOT_AREA_BORDER_COLOR = '#666666';
  const BAR_COLOR = '#E63030';
  const GRID_LINE_COLOR = '#CCCCCC';
  const AXIS_TEXT_COLOR = '#000000';

  // Plot Area dimensions e margens (estimadas da imagem)
  const PLOT_AREA_MARGIN_TOP = Math.round(40 * scale);
  const PLOT_AREA_MARGIN_BOTTOM = Math.round(60 * scale); // Para labels do eixo X
  const PLOT_AREA_MARGIN_LEFT = Math.round(80 * scale);  // Para labels do eixo Y
  const PLOT_AREA_MARGIN_RIGHT = Math.round(40 * scale);

  const plotAreaWidth = width - PLOT_AREA_MARGIN_LEFT - PLOT_AREA_MARGIN_RIGHT;
  const plotAreaHeight = height - PLOT_AREA_MARGIN_TOP - PLOT_AREA_MARGIN_BOTTOM;

  const plotAreaX = PLOT_AREA_MARGIN_LEFT;
  const plotAreaY = PLOT_AREA_MARGIN_TOP;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Dados ausentes ou vazios. Exibindo fallback.`);
    return (
      <div style={{
        backgroundColor: CANVAS_BACKGROUND_COLOR,
        color: AXIS_TEXT_COLOR,
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
  
  const data = series[0].data; // Utiliza apenas a primeira série para um Bar Chart simples
  
  // O maxValue é 250, conforme o eixo Y da imagem de referência.
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const effectiveMaxValue = 250; 
  
  const numBars = data.length;
  // [BAR CHART] - Largura da barra e gap (estimados da imagem)
  const barGapPercentage = 0.35; // ~35% do espaço total por categoria
  const barWidthPercentage = 1 - barGapPercentage; // ~65% para a barra
  const totalSpacePerBar = plotAreaWidth / numBars;
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2;

  // [TIPOGRAFIA E LABELS]
  // Não há título na referência, mas se houver, será renderizado.
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(13 * scale); // Ajustado para parecer com a referência

  // Calcular tick marks do eixo Y com base na referência (0, 50, 100, 150, 200, 250)
  const yTickValues = generateYAxisTicks(effectiveMaxValue, 50);

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
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
        backgroundColor: CANVAS_BACKGROUND_COLOR,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif', // 'Inter' com fallbacks
        transform: `scale(${chartScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Renderiza o título se presente [REGRAS DE TIPOGRAFIA E LABELS] */}
        {title && (
          <text
            x={width / 2}
            y={PLOT_AREA_MARGIN_TOP / 2 + (title ? titleFontSize / 2 : 0)}
            textAnchor="middle"
            fontSize={titleFontSize}
            fontWeight={700}
            fill={AXIS_TEXT_COLOR}
          >
            {title}
          </text>
        )}

        {/* Plot Area Background e Borda [REGRA #1: REPLICAR FIELMENTE] */}
        <rect
          x={plotAreaX}
          y={plotAreaY}
          width={plotAreaWidth}
          height={plotAreaHeight}
          fill={PLOT_AREA_BACKGROUND_COLOR}
          stroke={PLOT_AREA_BORDER_COLOR}
          strokeWidth={1 * scale}
        />

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = effectiveMaxValue > 0 
            ? plotAreaY + plotAreaHeight - (tickValue / effectiveMaxValue) * plotAreaHeight
            : plotAreaY + plotAreaHeight; // Se maxValue é 0, todos os pontos ficam na base

          // [REGRA #1] Linha zero (eixo X) não é destacada, usa a mesma cor e estilo do grid.
          // [REGRA #1] Grid lines são sólidas, não tracejadas.
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              {/* Não desenha linha de grid no topo (y=0 na escala Y, y=plotAreaY na tela) para evitar sobreposição com borda */}
              {tickValue !== effectiveMaxValue && ( 
                <line
                  x1={plotAreaX}
                  y1={y}
                  x2={plotAreaX + plotAreaWidth}
                  y2={y}
                  stroke={GRID_LINE_COLOR}
                  strokeWidth={1 * scale}
                  opacity={gridLineOpacity}
                />
              )}
              
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(10 * scale)} // Espaçamento à esquerda da plot area
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={AXIS_TEXT_COLOR}
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
          const barRatio = effectiveMaxValue > 0 ? value / effectiveMaxValue : 0;
          let barHeightRaw = barRatio * plotAreaHeight;
          
          // Altura mínima de 1px se o valor for positivo, para visibilidade [REGRA DE EDGE CASES]
          const minBarHeight = Math.round(1 * scale); 
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = plotAreaX + index * totalSpacePerBar + barOffset;
          const barY = plotAreaY + plotAreaHeight - actualBarHeight;

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
            [plotAreaY + plotAreaHeight, barY], // Y inicial (base) até Y final (topo da barra)
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [BAR CHART] - Cantos arredondados: 0px (retangular conforme referência)
          const borderRadius = 0; 

          return (
            <rect
              key={labels[index]}
              x={barX}
              y={animatedY}
              width={barWidth}
              height={animatedHeight}
              fill={BAR_COLOR}
              rx={borderRadius} 
              ry={borderRadius} 
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * totalSpacePerBar + barOffset + barWidth / 2;
          const y = plotAreaY + plotAreaHeight + Math.round(20 * scale); // Posição abaixo do eixo X

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
              fill={AXIS_TEXT_COLOR}
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
