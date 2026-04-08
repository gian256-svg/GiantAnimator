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

interface ChartDataItem {
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataItem[];
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', suffix: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  }
  if (Math.abs(num) < 1000000) {
    // Usar . para milhar e , para decimal para pt-BR
    return `${prefix}${(num / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${suffix}k`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${suffix}M`;
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

export const BarChart: React.FC<BarChartProps> = ({
  title,
  subtitle,
  data,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const SUBTITLE_HEIGHT = subtitle ? Math.round(18 * scale) : 0; // +18px para subtítulo
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(100 * scale); // Espaço para labels do eixo Y (ajustado para R$ X.XM)

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - SUBTITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + SUBTITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
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

  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...values, 0); 
  
  const numBars = values.length;
  // [BAR CHART] - Largura da barra e gap
  const barGapPercentage = 0.35; // 35% do espaço total por categoria
  const barWidthPercentage = 1 - barGapPercentage; // 65% para a barra
  const totalSpacePerBar = plotWidth / numBars;
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(20 * scale); // 18-22px
  const subtitleFontSize = Math.round(14 * scale); // 13-14px
  const axisLabelFontSize = Math.round(12 * scale); // 11-12px
  const valueLabelFontSize = Math.round(12 * scale); // 11-13px

  // Cores [REGRAS DE CORES]
  const barColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const subtitleColor = '#AAAAAA';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering BarChart frame ${frame}.`);

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
        {/* Subtítulo [REGRAS DE TIPOGRAFIA E LABELS] */}
        {subtitle && (
          <text
            x={width / 2}
            y={PLOT_AREA_PADDING + TITLE_HEIGHT + SUBTITLE_HEIGHT / 2 - Math.round(4 * scale)} // Ajuste para espaçamento
            textAnchor="middle"
            fontSize={subtitleFontSize}
            fontWeight={400}
            fill={subtitleColor}
            style={{ textShadow: labelTextShadow }}
          >
            {subtitle}
          </text>
        )}

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
                {formatNumber(tickValue, 'R$ ')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Barras e Labels de Valor [REGRAS POR TIPO DE GRÁFICO -> Bar Chart] */}
        {values.map((value, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const barRatio = maxValue > 0 ? value / maxValue : 0;
          let barHeightRaw = barRatio * plotHeight;
          
          // Se o valor for muito pequeno mas positivo, garantir altura mínima visível
          const minBarHeight = Math.round(4 * scale); // [Regras de Edge Cases]
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

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
          
          // Animação do label de valor [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(frame, [50 + index * 5, 70 + index * 5], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const labelYOffsetAnimation = interpolate(frame, [50 + index * 5, 70 + index * 5], [Math.round(15 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          // [BAR CHART] - Cantos arredondados: `4px` no topo apenas.
          const borderRadius = Math.round(4 * scale);
          const currentBarHeight = Math.max(0, animatedHeight); // Ensure non-negative height for path calculation

          // Gera o path SVG para um retângulo com cantos superiores arredondados
          const barPathData = `
            M ${barX},${animatedY + borderRadius}
            A ${borderRadius},${borderRadius} 0 0 1 ${barX + borderRadius},${animatedY}
            L ${barX + barWidth - borderRadius},${animatedY}
            A ${borderRadius},${borderRadius} 0 0 1 ${barX + barWidth},${animatedY + borderRadius}
            L ${barX + barWidth},${animatedY + currentBarHeight}
            L ${barX},${animatedY + currentBarHeight}
            Z
          `;

          return (
            <React.Fragment key={labels[index]}>
              <path
                d={barPathData}
                fill={barColor}
              />
              {/* Label de Valor [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={barX + barWidth / 2}
                y={animatedY - Math.round(8 * scale) - labelYOffsetAnimation} // +8px da ponta da barra, ajustado pela animação
                textAnchor="middle"
                fontSize={valueLabelFontSize}
                fontWeight={600}
                fill={textColor}
                opacity={labelOpacity}
                style={{ textShadow: labelTextShadow }}
              >
                {formatNumber(value, 'R$ ')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * totalSpacePerBar + barOffset + barWidth / 2;
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
