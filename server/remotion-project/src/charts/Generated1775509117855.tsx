import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig, AbsoluteFill } from 'remotion';

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
const formatNumber = (num: number, decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
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

export const AreaChart: React.FC<AreaChartProps> = ({
  title = "Simple Area Chart", // Título padrão conforme a referência visual
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // Dados de exemplo
  series = [{ label: "Value", data: [10, 20, 15, 25, 30, 20, 35, 40, 30, 45, 50, 40] }], // Dados de exemplo
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
      <AbsoluteFill style={{
        backgroundColor: '#F0F0F0', // Fundo conforme referência visual
        color: '#333333', // Texto conforme referência visual
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  const data = series[0].data; // Utiliza apenas a primeira série para um Area Chart simples
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...data, 0); 
  
  const numDataPoints = data.length;
  const xStep = plotWidth / (numDataPoints > 1 ? numDataPoints - 1 : 1);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(22 * scale); // Ajustado para ser proeminente
  const axisLabelFontSize = Math.round(11 * scale);
  const valueLabelFontSize = Math.round(12 * scale);

  // Cores adaptadas para o tema CLARO da referência visual
  // [REGRA ABSOLUTA #1] Fundo do canvas conforme referência
  const canvasBackgroundColor = '#F0F0F0';
  // [REGRA ABSOLUTA #1] Cor do título conforme referência
  const titleColor = '#333333';
  // [REGRAS DE CORES] - Grid e linha zero para tema claro
  const gridColor = 'rgba(0,0,0,0.08)';
  const zeroLineColor = 'rgba(0,0,0,0.25)';
  // [REGRAS DE CORES] - Texto para tema claro, sem text-shadow (regra era para fundo escuro)
  const textColor = '#333333'; 
  const axisTextColor = '#666666'; 

  // Paleta padrão GiantAnimator, adaptada para o fill e stroke do Area Chart
  const seriesColor = '#7CB5EC'; // Azul suave - Highcharts default
  const areaFillColorTop = `rgba(${parseInt(seriesColor.slice(1,3), 16)}, ${parseInt(seriesColor.slice(3,5), 16)}, ${parseInt(seriesColor.slice(5,7), 16)}, 0.4)`; // opacity topo: 0.4
  const areaFillColorBottom = `rgba(${parseInt(seriesColor.slice(1,3), 16)}, ${parseInt(seriesColor.slice(3,5), 16)}, ${parseInt(seriesColor.slice(5,7), 16)}, 0.0)`; // opacity base: 0.0
  const lineColor = `rgba(${parseInt(seriesColor.slice(1,3), 16)}, ${parseInt(seriesColor.slice(3,5), 16)}, ${parseInt(seriesColor.slice(5,7), 16)}, 1.0)`; // opacity 1.0 para stroke

  // Calcular tick marks do eixo Y
  const numYTicks = 5; 
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

  // Gerar o path SVG para a linha e a área
  let linePath = "";
  let areaPath = "";

  if (numDataPoints > 0) {
    const points = data.map((value, i) => {
      const x = plotAreaX + i * xStep;
      // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
      const y = maxValue > 0 
        ? plotAreaY + plotHeight - (value / maxValue) * plotHeight 
        : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base
      return { x, y };
    });

    // Curva suave [REGRAS POR TIPO DE GRÁFICO -> Line Chart]
    linePath = points.map((p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `S ${midX},${prev.y} ${p.x},${p.y}`; // Usa smooth curve (S)
    }).join(' ');

    areaPath = `M ${plotAreaX},${plotAreaY + plotHeight} ` + // Começa na base do primeiro ponto
               points.map((p, i) => {
                 if (i === 0) return `L ${p.x},${p.y}`;
                 const prev = points[i - 1];
                 const midX = (prev.x + p.x) / 2;
                 return `S ${midX},${prev.y} ${p.x},${p.y}`;
               }).join(' ') +
               ` L ${plotAreaX + (numDataPoints - 1) * xStep},${plotAreaY + plotHeight} Z`; // Termina na base do último ponto e fecha
  }

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

  // Animação de desenho da linha (strokeDashoffset)
  const pathLength = linePath ? document.createElementNS('http://www.w3.org/2000/svg', 'path').getTotalLength() : 0;
  // A linha aparece primeiro
  const lineAnimation = interpolate(
    frame,
    [10, 60], // frames 10-60
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação do fill da área (fade)
  const areaFillAnimation = interpolate(
    frame,
    [50, 80], // Fill aparece depois da linha
    [0, 1],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_SUBTLE,
    }
  );

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: canvasBackgroundColor, // Fundo conforme referência visual
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
          fontWeight={700} // Usando 700 para dar destaque ao título
          fill={titleColor} // Cor do título conforme referência
          // Sem text-shadow, pois não é visível na referência e a regra é para fundo escuro
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = maxValue > 0 
            ? plotAreaY + plotHeight - (tickValue / maxValue) * plotHeight
            : plotAreaY + plotHeight;

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
                x={plotAreaX - Math.round(8 * scale)} 
                y={y + Math.round(axisLabelFontSize / 3)} 
                textAnchor="end" 
                fontSize={axisLabelFontSize}
                fill={axisTextColor} // Cor para tema claro
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Área (Fill) [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={areaFillColorTop} />
            <stop offset="100%" stopColor={areaFillColorBottom} />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          opacity={areaFillAnimation}
          style={{ transform: `translateY(0)` }} // Fixa o path para o gradiente funcionar corretamente
        />

        {/* Linha [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
          strokeDasharray={pathLength}
          strokeDashoffset={lineAnimation}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xStep;
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
              textAnchor="middle" 
              fontSize={axisLabelFontSize}
              fill={axisTextColor} // Cor para tema claro
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
