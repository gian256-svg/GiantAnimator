import React, { useMemo } from 'react';
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

interface AreaChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', suffix: string = '', decimals: number = 1): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${suffix}`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M${suffix}`;
};

// Paleta padrão GiantAnimator [REGRAS DE CORES]
const GIANT_ANIMATOR_PALETTE = [
  '#7CB5EC', // azul suave — Highcharts default
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

const getPaletteColor = (index: number): string => {
  return GIANT_ANIMATOR_PALETTE[index % GIANT_ANIMATOR_PALETTE.length];
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  if (maxValue === 0) return [0]; // Lida com o caso onde todos os dados são zero
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Função para gerar o atributo 'd' de um caminho SVG com curvas suaves (bezier cúbica)
// Esta é uma aproximação simplificada para uma spline tipo Catmull-Rom.
const getCurvePathD = (points: { x: number; y: number }[], tension: number = 0.5): string => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 1 < points.length - 1 ? points[i + 2] : points[i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    // [EDGE CASES E ROBUSTEZ] - Garante que as coordenadas são números
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;
    const safeP2x = isNaN(p2.x) ? p1.x : p2.x; // Fallback for p2 if it somehow becomes NaN
    const safeP2y = isNaN(p2.y) ? p1.y : p2.y; // Fallback for p2 if it somehow becomes NaN

    path += ` C ${safeCp1x},${safeCp1y} ${safeCp2x},${safeCp2y} ${safeP2x},${safeP2y}`;
  }
  return path;
};


export const AreaChart: React.FC<AreaChartProps> = ({
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
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || series.every(s => !Array.isArray(s.data) || s.data.length === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
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
  
  // Calcular valor máximo entre todas as séries para o eixo Y
  const allDataPoints = series.flatMap(s => s.data);
  const maxValue = Math.max(...allDataPoints, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  
  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';
  const legendTextColor = '#CCCCCC';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
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

  // Ordena as séries pelo valor máximo para desenhar áreas maiores primeiro (para melhor visibilidade se houver sobreposição)
  const sortedSeries = useMemo(() => {
    return [...series].sort((a, b) => {
      const maxA = Math.max(...a.data, 0);
      const maxB = Math.max(...b.data, 0);
      return maxB - maxA; // Ordem decrescente
    });
  }, [series]);

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

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
        {/* Definições de Gradientes [REGRAS DE CORES -> Area Chart -> Fill] */}
        <defs>
          {sortedSeries.map((s, i) => {
            const seriesColor = getPaletteColor(i);
            const gradientId = `areaGradient-${s.label.replace(/\s/g, '-')}-${i}`;
            return (
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0"
                y1={plotAreaY} // Coordenada Y absoluta para o topo do gradiente
                x2="0"
                y2={plotAreaY + plotHeight} // Coordenada Y absoluta para a base do gradiente
                gradientUnits="userSpaceOnUse" // Aplica o gradiente usando coordenadas SVG absolutas
              >
                <stop offset="0%" stopColor={seriesColor} stopOpacity="0.4" /> {/* opacidade topo: 0.4 */}
                <stop offset="100%" stopColor={seriesColor} stopOpacity="0.0" /> {/* opacidade base: 0.0 */}
              </linearGradient>
            );
          })}
        </defs>

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={textColor}
          style={{ textShadow: labelTextShadow }}
        >
          {title}
        </text>

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        <g transform={`translate(0, ${PLOT_AREA_PADDING + TITLE_HEIGHT / 2 - Math.round(legendFontSize / 2)})`}>
          {sortedSeries.map((s, i) => {
            const legendOpacity = interpolate(frame, [60 + i * 5, 80 + i * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const textX = width - PLOT_AREA_PADDING - Math.round(10 * scale); // Alinha o texto à direita da plot area
            const rectX = textX - Math.round(10 * scale) - Math.round(8 * scale); // 10px largura do ret, 8px gap
            return (
              <g key={`legend-${s.label}-${i}`} opacity={legendOpacity} transform={`translate(0, ${i * Math.round(20 * scale)})`}>
                <rect x={rectX} y={-Math.round(5 * scale)} width={Math.round(10 * scale)} height={Math.round(10 * scale)} fill={getPaletteColor(i)} rx={Math.round(2 * scale)} ry={Math.round(2 * scale)} />
                <text x={textX} y={0} fontSize={legendFontSize} fill={legendTextColor} textAnchor="end" alignmentBaseline="middle">
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = maxValue > 0 
            ? plotAreaY + plotHeight - (tickValue / maxValue) * plotHeight
            : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          const isZeroLine = tickValue === 0;
          
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
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, '', ' MBps', 1)} {/* Assumindo MBps como unidade, 1 casa decimal */}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas e Linhas [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {sortedSeries.map((s, seriesIndex) => {
          const seriesColor = getPaletteColor(seriesIndex);
          const points = s.data.map((value, dataIndex) => {
            const x = plotAreaX + (dataIndex / (labels.length - 1)) * plotWidth;
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
            const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
            // [EDGE CASES E ROBUSTEZ] - Garantir que x, y são números e não NaN
            return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? plotAreaY + plotHeight : y };
          });

          // Gera os caminhos para a linha e a área
          const linePathD = getCurvePathD(points);
          // O caminho da área vai da curva até o eixo X e fecha
          const areaPathD = linePathD 
            + ` L ${points[points.length - 1].x},${plotAreaY + plotHeight}` // Para o canto inferior direito
            + ` L ${points[0].x},${plotAreaY + plotHeight}` // Para o canto inferior esquerdo
            + ` Z`; // Fecha o caminho

          // Animação da linha: strokeDashoffset
          // Para o pathLength, usamos uma aproximação baseada na largura do plot.
          // Para paths dinâmicos, uma solução mais precisa envolveria `getTotalLength()` via ref,
          // mas Remotion favorece valores estáticos ou pré-calculados.
          const pathLength = plotWidth * 1.5; // Aproximação, para permitir alguma curva.
                                          // Regra: "strokeDashoffset de comprimento->0"
          const lineAnimationStart = 10 + seriesIndex * 15; // Início escalonado para cada série
          const lineDrawingProgress = interpolate(
            frame,
            [lineAnimationStart, lineAnimationStart + 50], // frames 10-60 (para a animação principal)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const strokeDashoffset = interpolate(lineDrawingProgress, [0, 1], [pathLength, 0]);

          // Animação de preenchimento da área: fade após a linha aparecer
          // Regra: "linha primeiro, depois fill aparece com fade"
          const fillOpacity = interpolate(
            frame,
            [lineAnimationStart + 20, lineAnimationStart + 60], // Começa depois que o desenho da linha inicia
            [0, 1], // Anima para opacidade total, o gradiente lida com a opacidade interna
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          const gradientId = `areaGradient-${s.label.replace(/\s/g, '-')}-${seriesIndex}`;

          return (
            <g key={`series-${s.label}-${seriesIndex}`}>
              {/* Área preenchida [REGRAS POR TIPO DE GRÁFICO -> Area Chart -> Fill] */}
              <path
                d={areaPathD}
                fill={`url(#${gradientId})`} // Preenche com o gradiente definido
                fillOpacity={fillOpacity} // Anima a opacidade do preenchimento
              />
              {/* Linha do contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart -> Linha do contorno] */}
              <path
                d={linePathD}
                stroke={seriesColor}
                strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
                fill="none"
                strokeDasharray={pathLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={1} // Linha do contorno sempre com opacidade 1.0
              />
            </g>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + (index / (labels.length - 1)) * plotWidth;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto
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
