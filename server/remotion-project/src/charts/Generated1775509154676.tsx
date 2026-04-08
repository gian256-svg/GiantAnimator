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

// Paleta padrão GiantAnimator [REGRAS DE CORES]
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // azul suave
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

interface MultiLineChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper para gerar o path de uma linha suave (cubic-bezier) [LINE CHART]
const getSmoothLinePath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]; // Ponto anterior ou início
    const p1 = points[i]; // Ponto atual
    const p2 = points[i + 1]; // Próximo ponto
    const p3 = points[Math.min(points.length - 1, i + 2)]; // Ponto depois do próximo ou fim

    // Calcula a tensão para a curva - valor comum entre 0.1 e 0.5
    const tension = 0.4;

    // Ponto de controle 1 (para p1)
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    // Ponto de controle 2 (para p2)
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px

  const TITLE_AREA_HEIGHT = title ? Math.round(24 * scale) : 0; // +24px quando título presente
  const X_AXIS_LABELS_AREA_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABELS_AREA_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y

  // Legenda [MULTI-LINE CHART] - Posição topo-direita.
  const LEGEND_ITEM_HEIGHT = Math.round(20 * scale); // Altura de cada item da legenda
  const LEGEND_TOP_MARGIN = Math.round(15 * scale); // Margem entre título/legenda e área do gráfico

  // Calcular a largura da legenda baseada no texto mais longo para melhor responsividade
  const maxLegendLabelWidth = series.reduce((max, s) => {
    // Estimativa de largura de texto, heuristicamente 7px por caractere + buffer
    const charWidth = Math.round(7 * scale); 
    return Math.max(max, s.label.length * charWidth);
  }, 0);
  const LEGEND_ICON_WIDTH = Math.round(16 * scale);
  const LEGEND_ICON_TEXT_GAP = Math.round(4 * scale);
  const LEGEND_WIDTH = LEGEND_ICON_WIDTH + LEGEND_ICON_TEXT_GAP + maxLegendLabelWidth + Math.round(10 * scale); // Adiciona um padding extra

  // Altura total ocupada pelos elementos acima da área de plotagem
  const elementsAbovePlotHeight = TITLE_AREA_HEIGHT + (series.length > 0 ? LEGEND_TOP_MARGIN + LEGEND_ITEM_HEIGHT * series.length : 0);

  // Largura e altura total do conteúdo dentro do padding principal
  const totalContentWidth = width - 2 * PLOT_AREA_PADDING;
  const totalContentHeight = height - 2 * PLOT_AREA_PADDING;

  // Dimensões reais da área de plotagem (onde as linhas serão desenhadas)
  const plotWidth = totalContentWidth - Y_AXIS_LABELS_AREA_WIDTH;
  const plotHeight = totalContentHeight - elementsAbovePlotHeight - X_AXIS_LABELS_AREA_HEIGHT;

  // Origem da área de plotagem (canto superior esquerdo da área de desenho real)
  const plotOriginX = PLOT_AREA_PADDING + Y_AXIS_LABELS_AREA_WIDTH;
  const plotOriginY = PLOT_AREA_PADDING + elementsAbovePlotHeight;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendLabelFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC'; // Das Regras de Tipografia e Labels
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  const allDataPoints = series.flatMap(s => s.data);
  if (!Array.isArray(allDataPoints) || allDataPoints.length === 0 || !Array.isArray(labels) || labels.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Sem dados ou labels fornecidos para MultiLineChart. Exibindo fallback.`);
    return (
      <div style={{
        backgroundColor: '#1a1a2e',
        color: '#FFFFFF',
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
  
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...allDataPoints, 0); 
  
  const numDataPoints = labels.length;
  // Para gráficos de linha, os pontos estão em intervalos. Se houver apenas 1 ponto, o intervalo é 0.
  const xInterval = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : 0; 

  // Calcular tick marks do eixo Y
  const numYTicks = 5;
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando MultiLineChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a2e', // Fundo do canvas padrão dark
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        {title && (
          <text
            x={width / 2}
            y={PLOT_AREA_PADDING + TITLE_AREA_HEIGHT / 2}
            textAnchor="middle"
            fontSize={titleFontSize}
            fontWeight={700}
            fill={textColor}
            style={{ textShadow: labelTextShadow }}
          >
            {title}
          </text>
        )}

        {/* Legenda [MULTI-LINE CHART] - Posição topo-direita */}
        {series.length > 0 && (
          <g 
            transform={`translate(${width - PLOT_AREA_PADDING - LEGEND_WIDTH}, ${PLOT_AREA_PADDING + TITLE_AREA_HEIGHT + LEGEND_TOP_MARGIN / 2})`}
          >
            {series.map((s, i) => {
              const legendOpacity = interpolate(frame, [60 + i * 5, 80 + i * 5], [0, 1], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_LABELS,
              });
              const legendItemX = 0; // Relativo ao grupo da legenda
              const legendItemY = i * LEGEND_ITEM_HEIGHT;

              const seriesColor = GIANT_ANIMATOR_COLORS[i % GIANT_ANIMATOR_COLORS.length]; // Cicla as cores

              return (
                <g key={`legend-${s.label}`} opacity={legendOpacity}>
                  {/* Linha colorida da legenda */}
                  <rect x={legendItemX} y={legendItemY - Math.round(5 * scale)} width={LEGEND_ICON_WIDTH} height={Math.round(2 * scale)} fill={seriesColor} />
                  <text
                    x={legendItemX + LEGEND_ICON_WIDTH + LEGEND_ICON_TEXT_GAP}
                    y={legendItemY + Math.round(1 * scale)} // Ajuste para linha de base
                    alignmentBaseline="middle"
                    fontSize={legendLabelFontSize}
                    fill={legendTextColor} // Cor do texto da legenda
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = maxValue > 0 
            ? plotOriginY + plotHeight - (tickValue / maxValue) * plotHeight
            : plotOriginY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          const isZeroLine = tickValue === 0;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotOriginX}
                y1={y}
                x2={plotOriginX + plotWidth}
                y2={y}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // Sólido para zero, tracejado para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotOriginX - Math.round(8 * scale)} // 8px de padding à direita
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linhas de Dados [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {series.map((s, seriesIndex) => {
          const seriesColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
          
          // Calcular pontos para a linha
          const points = s.data.map((value, dataIndex) => {
            const x = plotOriginX + dataIndex * xInterval;
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero
            const y = maxValue > 0 
              ? plotOriginY + plotHeight - (value / maxValue) * plotHeight
              : plotOriginY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base
            return { x, y };
          });

          // [EDGE CASES E ROBUSTEZ] - Garantir que há pontos suficientes para desenhar um path
          if (points.length < 2) {
             console.warn(`[${new Date().toISOString()}] GiantAnimator: Não há pontos de dados suficientes para desenhar a linha para a série "${s.label}". Pulando.`);
             return null;
          }
          
          const pathD = getSmoothLinePath(points);
          
          // Estimar o comprimento do path para a animação strokeDashoffset
          let pathLength = 0;
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            pathLength += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          }
          pathLength *= 1.1; // Adicionar um buffer para o comprimento da curva
          pathLength = Math.max(pathLength, 10); // Garantir comprimento mínimo para evitar problemas

          const lineAnimationStart = 10 + seriesIndex * 10; // Iniciar a animação de forma escalonada para cada linha
          const lineAnimationEnd = lineAnimationStart + 50; // Leva 50 frames para desenhar

          const strokeDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationEnd],
            [pathLength, 0], // Do comprimento total para 0
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          return (
            <path
              key={`line-${s.label}`}
              d={pathD}
              fill="none"
              stroke={seriesColor}
              strokeWidth={Math.round(2.5 * scale)} // Espessura da linha: 2.5px
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength} // Define o array de traços para o comprimento total
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - `isNaN` para SVG
          // Centraliza o label se houver apenas 1 ponto de dado, caso contrário, usa o intervalo
          const x = plotOriginX + (numDataPoints > 1 ? index * xInterval : plotWidth / 2);
          const y = plotOriginY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto/intervalo
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
