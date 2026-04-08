import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs - Copiado fielmente das Regras de Ouro
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

interface BarChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  const absoluteNum = Math.abs(num);
  let formatted: string;

  if (absoluteNum < 1000) {
    formatted = num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  } else if (absoluteNum < 1000000) {
    formatted = `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  } else { // ≥ 1.000.000
    formatted = `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  }
  
  return `${prefix}${formatted}`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 para Bar Charts
  const ticks = [];
  if (maxValue === 0) {
    return [0]; // Se o valor máximo for 0, só tem um tick
  }
  const step = maxValue / numTicks;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

export const BarChart: React.FC<BarChartProps> = ({
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
  const TITLE_HEIGHT = title ? Math.round(24 * scale) : 0; // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço reservado para labels do eixo Y (ex: USD $XXXX.Xk)

  // Cálculo das dimensões da área do gráfico e da área de plotagem
  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Sem dados para exibir no gráfico de barras. Exibindo fallback.`);
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
  
  const data = series[0].data; // Utiliza apenas a primeira série para um Bar Chart simples
  
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 (exceto candlestick e scatter)
  // Certificamos que maxValue é no mínimo 0 para a escala começar do zero.
  const maxValue = Math.max(...data, 0); 
  const numBars = data.length;

  // [BAR CHART] - Largura da barra: 60–70% do espaço disponível por categoria. Gap: 30–40%.
  const barWidthPercentage = 0.65; // Usando 65% para a barra (60-70%)
  const totalSpacePerBar = plotWidth / numBars; // Espaço total horizontal por barra
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2; // Offset para centralizar a barra no seu espaço

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const valueLabelFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const barColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1 (azul suave)
  const gridColor = 'rgba(255,255,255,0.08)'; // Cor do grid padrão para fundo escuro
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Linha zero destacada
  const textColor = '#FFFFFF'; // Cor de texto para título e labels de valor
  const axisTextColor = '#999999'; // Cor de texto para labels de eixo
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)'; // Sombra para labels de valor

  // Calcular tick marks do eixo Y (5 ticks principais, conforme Highcharts)
  const numYTicks = 5; 
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering BarChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a2e', // Fundo do canvas padrão dark
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center', // Centro para a animação de escala
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        {title && ( // Renderiza o título apenas se ele existir
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
        )}

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero para cálculo de Y
          const yPos = maxValue > 0 
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
                y1={yPos}
                x2={plotAreaX + plotWidth}
                y2={yPos}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? Math.round(1.5 * scale) : Math.round(1 * scale)}
                strokeDasharray={isZeroLine ? '' : `${Math.round(4 * scale)} ${Math.round(4 * scale)}`} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita do eixo Y
                y={yPos + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar texto no tick
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, 'USD ')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Barras e Labels de Valor [REGRAS POR TIPO DE GRÁFICO -> Bar Chart] */}
        {data.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima visível
          const barRatio = maxValue > 0 ? value / maxValue : 0;
          let barHeightRaw = barRatio * plotHeight;
          
          // Altura mínima visível para valores positivos [REGRAS DE EDGE CASES E ROBUSTEZ]
          const minBarHeight = Math.round(4 * scale); 
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = plotAreaX + index * totalSpacePerBar + barOffset;
          const barY = plotAreaY + plotHeight - actualBarHeight;

          // Animação de crescimento da barra [REGRAS DE ANIMAÇÃO]
          // Crescimento de baixo para cima: height de 0 até valor final
          // As animações são escalonadas com base no índice da barra (stagger effect)
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
          
          // Animação do label de valor [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(frame, [50 + index * 5, 70 + index * 5], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          // Animação de deslocamento vertical do label para um efeito de "pop"
          const labelYOffsetAnimation = interpolate(frame, [50 + index * 5, 70 + index * 5], [Math.round(15 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          // [BAR CHART] - Cantos arredondados: `borderRadius: 4px` no topo apenas.
          // Nota: Para `rect` em SVG, `rx` e `ry` aplicam arredondamento a todos os cantos.
          // Para "apenas no topo" com animação de crescimento, seria necessário um `path` SVG customizado
          // ou máscara, o que aumenta a complexidade. Como não há referência visual específica,
          // aplicamos `rx` e `ry` a todos os cantos como uma solução prática para `rect`.
          const borderRadius = Math.round(4 * scale);

          return (
            <React.Fragment key={labels[index]}>
              <rect
                x={barX}
                y={animatedY}
                width={barWidth}
                height={animatedHeight}
                fill={barColor}
                rx={borderRadius} 
                ry={borderRadius} 
              />
              {/* Label de Valor [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={barX + barWidth / 2}
                y={animatedY - Math.round(8 * scale) - labelYOffsetAnimation} // Posição: +8px da ponta da barra, ajustado pela animação
                textAnchor="middle"
                fontSize={valueLabelFontSize}
                fontWeight={600}
                fill={textColor}
                opacity={labelOpacity}
                style={{ textShadow: labelTextShadow }}
              >
                {formatNumber(value, 'USD ')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * totalSpacePerBar + barOffset + barWidth / 2;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo X

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
