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

// [REGRA ABSOLUTA #1] - Cores e estilos extraídos fielmente da imagem de referência.
// Fundo do canvas: #F4F4F4 (light theme)
const BG_COLOR = '#F4F4F4';
// Título do gráfico: #444444, com sombra sutil
const TITLE_TEXT_COLOR = '#444444';
const TITLE_TEXT_SHADOW = '0px 1px 2px rgba(0,0,0,0.3)';

// Cores para elementos do gráfico (adaptadas para light theme, usando paleta padrão GiantAnimator)
const GRID_COLOR = 'rgba(0,0,0,0.08)'; // Light theme grid
const ZERO_LINE_COLOR = 'rgba(0,0,0,0.25)'; // Linha zero destacada
const AXIS_TEXT_COLOR = '#666666'; // Labels dos eixos
const VALUE_TEXT_COLOR = '#333333'; // Labels de valor (mais escuro para contraste)
const AREA_COLOR_SERIES1 = '#7CB5EC'; // Azul suave (Highcharts default)

// Placeholder Data para demonstração (nenhum dado foi fornecido, apenas o tipo e título)
const DEFAULT_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_DATA = [100, 150, 120, 180, 160, 200, 170, 220, 190, 240, 210, 260];

interface AreaChartProps {
  title?: string; // Título é opcional, default para "Simple Area Chart" da imagem
  labels?: string[];
  series?: Array<{
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

// Função para gerar um path SVG suave usando cubic Bezier (aproximação)
// [REGRAS POR TIPO DE GRÁFICO -> Line Chart, Area Chart - Smooth/curva: usar cubic-bezier]
const getSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const tension = 0.5; // Controla a tensão da curva
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN em atributos SVG
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;

    path += ` C ${safeCp1x} ${safeCp1y}, ${safeCp2x} ${safeCp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};

export const AreaChart: React.FC<AreaChartProps> = ({
  title = "Simple Area Chart", // Default para o título da imagem de referência
  labels = DEFAULT_LABELS,
  series = [{ label: "Data", data: DEFAULT_DATA }],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(60 * scale); // Espaço para labels do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: BG_COLOR,
        color: TITLE_TEXT_COLOR,
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
  
  const data = series[0].data; // Para um Area Chart simples, usa a primeira série
  const maxValue = Math.max(...data, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const minValue = 0; // Area Chart vai até a linha de base

  const numPoints = data.length;
  const xInterval = numPoints > 1 ? plotWidth / (numPoints - 1) : 0;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const valueLabelFontSize = Math.round(12 * scale);

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  // Calcular pontos para o path
  const points = data.map((value, index) => {
    const x = plotAreaX + index * xInterval;
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const y = maxValue > 0 
      ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
      : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base
    
    // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
    const safeX = isNaN(x) ? plotAreaX : x;
    const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

    return { x: safeX, y: safeY };
  });

  // Gerar o path da linha e da área
  const linePath = getSmoothPath(points);
  const areaPath = points.length > 0
    ? `M ${points[0].x} ${plotAreaY + plotHeight} ` + 
      `L ${points[0].x} ${points[0].y} ` + 
      getSmoothPath(points).substring(1) + // remove 'M' inicial
      ` L ${points[points.length - 1].x} ${plotAreaY + plotHeight} Z`
    : '';

  // Animação de "desenho" da linha [REGRAS DE ANIMAÇÃO -> Line Chart]
  const pathLength = React.useMemo(() => {
    if (!linePath) return 0;
    // Calcular o comprimento do path. Requer um elemento SVG para 'getTotalLength()'.
    // Em Remotion, precisamos fazer um truque ou estimar.
    // Para simplificar, vou usar uma estimativa baseada na largura do plot.
    // Uma implementação mais robusta poderia renderizar o path invisivelmente e obter o comprimento.
    return plotWidth * 1.5; // Estimativa, geralmente a linha é um pouco mais longa que a largura do plot
  }, [linePath, plotWidth]);

  const animatedDashoffset = interpolate(
    frame,
    [10, 60], // Desenho da linha: frames 10-60
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação do preenchimento da área (fade após a linha) [REGRAS DE ANIMAÇÃO -> Area Chart]
  const animatedAreaOpacity = interpolate(
    frame,
    [50, 80], // Fill aparece com fade, depois da linha
    [0, 1],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_SUBTLE,
    }
  );

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: BG_COLOR, // Fundo do canvas conforme referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Definição do gradiente para o preenchimento da área [REGRAS DE CORES -> Area Chart] */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={AREA_COLOR_SERIES1} stopOpacity="0.4" />
            <stop offset="100%" stopColor={AREA_COLOR_SERIES1} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={TITLE_TEXT_COLOR} // Cor do título da imagem de referência
          style={{ textShadow: TITLE_TEXT_SHADOW }} // Sombra do título da imagem de referência
        >
          {title}
        </text>

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
                stroke={isZeroLine ? ZERO_LINE_COLOR : GRID_COLOR}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
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

        {/* Preenchimento da Área [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          opacity={animatedAreaOpacity}
        />

        {/* Linha do Contorno da Área [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={AREA_COLOR_SERIES1}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha principal
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={animatedDashoffset}
        />
        
        {/* Dots/pontos: mostrar apenas em hover OU quando < 20 pontos [Line Chart Rule] */}
        {points.length < 20 && points.map((point, index) => {
          const dotOpacity = interpolate(
            frame,
            [50 + index * 2, 70 + index * 2], // staggered appearance
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );
          return (
            <circle
              key={`dot-${index}`}
              cx={point.x}
              cy={point.y}
              r={Math.round(4 * scale)} // Tamanho do ponto: 6px raio (12px diâmetro) - ajustado para o que geralmente fica bem visível
              fill={AREA_COLOR_SERIES1}
              opacity={dotOpacity}
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xInterval;
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
              textAnchor="middle" // Centralizado
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
