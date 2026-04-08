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
  if (maxValue <= 0) return [0]; // Lida com casos onde o valor máximo é 0 ou negativo
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper para gerar um path SVG com cantos arredondados APENAS no topo
// [BAR CHART] - Cantos arredondados: 4px no topo apenas
const getTopRoundedRectPath = (x: number, y: number, width: number, height: number, r: number) => {
  // Se a altura for menor que o borderRadius ou a largura for muito pequena, retorna um retângulo simples
  if (height < r || width < r * 2) {
    return `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
  }
  return `
    M${x},${y + height}
    L${x},${y + r}
    A${r},${r} 0 0 1 ${x + r},${y}
    L${x + width - r},${y}
    A${r},${r} 0 0 1 ${x + width},${y + r}
    L${x + width},${y + height}
    Z
  `;
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
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y (ajustado para USD $XXXX.Xk)

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Sem dados fornecidos ou dados vazios. Exibindo fallback.`);
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
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...data, 0); 
  const effectiveMaxValue = maxValue; // Para bar charts verticais, só nos preocupamos com valores positivos
  
  const numBars = data.length;
  // [BAR CHART] - Largura da barra e gap
  const barGapPercentage = 0.35; // 30-40% do espaço total por categoria
  const barWidthPercentage = 1 - barGapPercentage; // 60-70% para a barra
  const totalSpacePerBar = plotWidth / numBars;
  const barWidth = totalSpacePerBar * barWidthPercentage;
  const barOffset = (totalSpacePerBar - barWidth) / 2;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const valueLabelFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const barColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(effectiveMaxValue, numYTicks);

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando BarChart frame ${frame}.`);

  // [BAR CHART] - borderRadius para o path (4px no topo apenas)
  const borderRadius = Math.round(4 * scale); 

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

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const yPos = effectiveMaxValue > 0 
            ? plotAreaY + plotHeight - (tickValue / effectiveMaxValue) * plotHeight
            : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN
          const safeYPos = isNaN(yPos) ? plotAreaY + plotHeight : yPos;

          const isZeroLine = tickValue === 0;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={safeYPos}
                x2={plotAreaX + plotWidth}
                y2={safeYPos}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={safeYPos + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
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
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e altura mínima
          const barRatio = effectiveMaxValue > 0 ? value / effectiveMaxValue : 0;
          let barHeightRaw = barRatio * plotHeight;
          
          // Se o valor for muito pequeno mas positivo, garantir altura mínima visível
          const minBarHeight = Math.round(4 * scale); // [Regras de Edge Cases]
          const actualBarHeight = value > 0 ? Math.max(barHeightRaw, minBarHeight) : barHeightRaw;

          const barX = plotAreaX + index * totalSpacePerBar + barOffset;
          // finalBarY é a posição Y do TOPO da barra na sua altura final.
          const finalBarY = plotAreaY + plotHeight - actualBarHeight;

          // Animação de crescimento da barra [REGRAS DE ANIMAÇÃO]
          // Crescimento de baixo para cima: height de 0 até valor final
          // O path do SVG precisa ser recalculado em cada frame com a altura e Y animados.
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
            [plotAreaY + plotHeight, finalBarY], // Y inicial (base) até Y final (topo da barra)
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN
          const safeAnimatedY = isNaN(animatedY) ? plotAreaY + plotHeight : animatedY;
          const safeAnimatedHeight = isNaN(animatedHeight) ? 0 : animatedHeight;
          
          // Gerar o path com cantos arredondados apenas no topo
          const barPath = getTopRoundedRectPath(barX, safeAnimatedY, barWidth, safeAnimatedHeight, borderRadius);

          // Animação do label de valor [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(frame, [50 + index * 5, 70 + index * 5], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const labelYOffsetAnimation = interpolate(frame, [50 + index * 5, 70 + index * 5], [Math.round(15 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          
          // Se a barra for muito pequena, o label pode precisar ir para fora (acima)
          const valueLabelY = safeAnimatedY - Math.round(8 * scale) - labelYOffsetAnimation;

          return (
            <React.Fragment key={`bar-${labels[index]}`}>
              <path
                d={barPath}
                fill={barColor}
              />
              {/* Label de Valor [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={barX + barWidth / 2}
                y={valueLabelY}
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
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN
          const safeX = isNaN(x) ? 0 : x;
          const safeY = isNaN(y) ? 0 : y;

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={safeX}
              y={safeY}
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
