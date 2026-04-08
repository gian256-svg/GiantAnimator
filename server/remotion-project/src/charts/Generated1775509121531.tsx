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

interface ScatterChartProps {
  title: string;
  data: Array<{ x: number; y: number }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  if (num === 0) return `${prefix}0`;
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para gerar um range de números para os ticks dos eixos
const generateAxisTicks = (min: number, max: number, numTicks: number): number[] => {
  const ticks = [];
  // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero se min === max
  if (min === max) {
    return [min]; // Se min e max são iguais, apenas um tick
  }
  const step = (max - min) / numTicks;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(min + i * step);
  }
  return ticks;
};

export const ScatterChart: React.FC<ScatterChartProps> = ({
  title,
  data,
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

  // Determine min/max valores dos dados
  const actualMinX = Math.min(...data.map(d => d.x));
  const actualMaxX = Math.max(...data.map(d => d.x));
  const actualMinY = Math.min(...data.map(d => d.y));
  const actualMaxY = Math.max(...data.map(d => d.y));

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 (exceto scatter com range específico)
  // Para scatter, adaptamos o range, mas garantimos que 0 seja incluído se o mínimo for positivo,
  // e adicionamos uma pequena margem aos valores máximos para melhor visualização.
  const xRangePadding = (actualMaxX - actualMinX) * 0.1 || 1; // 10% de padding, mínimo 1
  const yRangePadding = (actualMaxY - actualMinY) * 0.1 || 1; // 10% de padding, mínimo 1

  const axisMinX = Math.floor(Math.min(0, actualMinX));
  const axisMaxX = Math.ceil(actualMaxX + xRangePadding);
  const axisMinY = Math.floor(Math.min(0, actualMinY));
  const axisMaxY = Math.ceil(actualMaxY + yRangePadding);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const pointRadius = Math.round(8 * scale); // [SCATTER PLOT] - Tamanho do ponto: 8px raio
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Linha zero destacada

  // Número de ticks para os eixos
  const numXTicks = 5;
  const numYTicks = 5;

  const xTickValues = generateAxisTicks(axisMinX, axisMaxX, numXTicks);
  const yTickValues = generateAxisTicks(axisMinY, axisMaxY, numYTicks);

  // Funções de mapeamento para converter valores dos dados em coordenadas de pixel
  const getXPos = (value: number) => {
    const rangeX = axisMaxX - axisMinX;
    // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero
    if (rangeX === 0) return plotAreaX + plotWidth / 2;
    return plotAreaX + ((value - axisMinX) / rangeX) * plotWidth;
  };

  const getYPos = (value: number) => {
    const rangeY = axisMaxY - axisMinY;
    // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero
    if (rangeY === 0) return plotAreaY + plotHeight / 2;
    // O eixo Y é invertido no SVG (0 no topo, max na base)
    return plotAreaY + plotHeight - ((value - axisMinY) / rangeY) * plotHeight;
  };

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering ScatterChart frame ${frame}.`);

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
          const y = getYPos(tickValue);
          // Destacar linha zero apenas se 0 estiver no range e for um tick real
          const isZeroLine = Math.abs(tickValue) < 0.001 && axisMinY <= 0 && axisMaxY >= 0;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
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
                {formatNumber(tickValue, '', 0)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Grid Verticais e Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          const x = getXPos(tickValue);
          // Destacar linha zero apenas se 0 estiver no range e for um tick real
          const isZeroLine = Math.abs(tickValue) < 0.001 && axisMinX <= 0 && axisMaxX >= 0;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`x-grid-line-${index}`}>
              <line
                x1={x}
                y1={plotAreaY}
                x2={x}
                y2={plotAreaY + plotHeight}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo X [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={x}
                y={plotAreaY + plotHeight + Math.round(15 * scale)} // Posição abaixo do eixo
                textAnchor="middle" // Centralizado sob cada tick
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, '', 0)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Pontos de Dispersão [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          const cx = getXPos(point.x);
          const cy = getYPos(point.y);

          // Animação de escala dos pontos com stagger [REGRAS DE ANIMAÇÃO]
          // Pontos aparecem com scale 0→1 em sequência (stagger 2 frames)
          const pointScale = interpolate(
            frame,
            [20 + index * 2, 70 + index * 2], // Stagger de 2 frames entre pontos
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Opacidade dos pontos [SCATTER PLOT] - opacidade: 0.7
          const pointOpacity = interpolate(
            frame,
            [20 + index * 2, 30 + index * 2],
            [0, 0.7],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Garantir que cx e cy não são NaN
          const safeCx = isNaN(cx) ? plotAreaX + plotWidth / 2 : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight / 2 : cy;

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={pointRadius}
              fill={pointColor}
              opacity={pointOpacity}
              transform={`scale(${pointScale})`}
              transformOrigin={`${safeCx}px ${safeCy}px`} // Animação de escala a partir do centro do ponto
            />
          );
        })}
      </svg>
    </div>
  );
};
