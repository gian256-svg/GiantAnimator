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

// Interface para os dados do gráfico
interface AreaChartProps {
  title: string;
  labels: string[]; // Labels para o eixo X
  series: Array<{
    label: string;
    data: number[]; // Valores para a série
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

// Componente AreaChart
export const AreaChart: React.FC<AreaChartProps> = ({
  title = "Simple Area Chart", // Default title para o caso de não ser fornecido
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // Dados de exemplo
  series = [ // Dados de exemplo
    {
      label: "Series 1",
      data: [10, 12, 8, 15, 13, 18, 20, 16, 22, 19, 25, 23],
    },
  ],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(50 * scale); // Ajustado para o título proeminente da imagem
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y

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
        backgroundColor: '#F5F5F5', // Fundo da imagem de referência
        color: '#4C4C4C', // Cor do texto da imagem de referência
        fontSize: Math.round(36 * scale),
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        {title}
      </div>
    );
  }

  const seriesData = series[0].data; // Usando apenas a primeira série para um Area Chart simples
  const maxValue = Math.max(...seriesData, 0); // Escala Y sempre começa em 0, [REGRAS DE ESTRUTURA E LAYOUT]
  const numDataPoints = seriesData.length;

  // Cores [REGRAS DE CORES]
  const areaColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1 (azul suave)
  const lineColor = areaColor; // Linha do contorno: mesma cor do fill com opacity: 1.0
  const gridColor = 'rgba(0,0,0,0.08)'; // Cor do grid para tema light
  const zeroLineColor = 'rgba(0,0,0,0.25)'; // Linha zero destacada para tema light
  const titleColor = '#4C4C4C'; // Da imagem de referência
  const axisTextColor = '#666666'; // Cor de texto para eixos em tema light
  const valueLabelColor = '#4C4C4C'; // Cor para labels de valor em tema light

  // Tipografia [REGRAS DE TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(36 * scale); // Da imagem de referência
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

  // Gerar o caminho (path) para a área e a linha
  const generatePath = (data: number[], forLine: boolean) => {
    if (data.length === 0) return "";

    const points = data.map((value, i) => {
      // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
      const yRatio = maxValue > 0 ? value / maxValue : 0;
      const x = plotAreaX + i * (plotWidth / (numDataPoints - 1));
      const y = plotAreaY + plotHeight - yRatio * plotHeight;
      return { x, y: isNaN(y) ? plotAreaY + plotHeight : y }; // [EDGE CASES E ROBUSTEZ] - Proteger NaN no SVG
    });

    if (numDataPoints === 1) { // Lidar com um único ponto
      return `M ${points[0].x},${points[0].y} L ${points[0].x},${points[0].y}`;
    }

    // Usar cubic-bezier para suavizar a linha [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Smooth/curva]
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[0];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 1 !== points.length - 1 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    if (!forLine) { // Para a área, fechar o caminho na base do gráfico
      path += ` L ${points[numDataPoints - 1].x} ${plotAreaY + plotHeight}`;
      path += ` L ${points[0].x} ${plotAreaY + plotHeight} Z`;
    }
    return path;
  };

  const linePath = generatePath(seriesData, true);
  const areaPath = generatePath(seriesData, false);

  // Animação da linha (strokeDashoffset) [REGRAS DE ANIMAÇÃO]
  const pathLength = typeof document !== 'undefined' ? (document.createElementNS('http://www.w3.org/2000/svg', 'path').setAttribute('d', linePath), (document.createElementNS('http://www.w3.org/2000/svg', 'path').pathLength.baseVal.value || 0)) : 1000; // Fallback para SSR
  // Como `pathLength` depende do DOM, precisamos de uma forma segura para SSR.
  // Em Remotion, o ideal é não depender do DOM, então estimamos um valor ou passamos via prop.
  // Para fins de demonstração, vamos usar um valor fixo se o DOM não estiver disponível.
  // Um valor mais robusto viria de uma medição real em um ambiente DOM no cliente, ou pré-cálculo.

  const animatedLineDashoffset = interpolate(
    frame,
    [10, 60], // Desenho da linha: frames 10-60
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação do fill da área (opacity) [REGRAS DE ANIMAÇÃO]
  const animatedFillOpacity = interpolate(
    frame,
    [50, 80], // Fill aparece depois da linha
    [0, 1],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_SUBTLE,
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#F5F5F5', // Fundo da imagem de referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] - FIEL À IMAGEM */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={600} // Estimado da imagem
          fill={titleColor} // Da imagem de referência
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
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
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Área Preenchida [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        <path
          d={areaPath}
          fill={areaColor}
          fillOpacity={animatedFillOpacity * 0.4} // opacity topo: 0.4 [REGRAS DE CORES]
          stroke="none"
        >
          {/* Adicionando gradiente no fill para a área, conforme regras GiantAnimator */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={areaColor} stopOpacity="0.4" /> {/* topo: 0.4 */}
              <stop offset="100%" stopColor={areaColor} stopOpacity="0.0" /> {/* base: 0.0 */}
            </linearGradient>
          </defs>
          <use href="#areaGradient" /> {/* A Remotion não permite fill="url(#id)" diretamente no path para animação de opacidade */}
        </path>
        {/* Workaround para fill com gradiente e opacidade animada na Remotion.
            O atributo fill na tag <path> sobrescreve o uso de <use href="#areaGradient" />.
            A forma correta em SVG puro seria: fill="url(#areaGradient)" e animar a opacidade
            da área com um rect ou outro elemento que se sobreponha, ou animar o stop-opacity
            dentro do gradiente, mas isso complica a sincronia com a animação da linha.
            Para manter a simplicidade e a regra de opacidade, usaremos a cor sólida com
            a opacidade animada, conforme a regra de "fill: gradiente vertical — cor plena no topo,
            transparente na base", mas aplicada como opacidade global do path para facilitar a animação
            via `animatedFillOpacity`. A regra de `opacity topo: 0.4, opacity base: 0.0` é interpretada
            como o *efeito* de transparência da área decaindo para baixo.
        */}
        <path
          d={areaPath}
          fill={`url(#areaGradient)`} // Usando o gradiente definido
          opacity={animatedFillOpacity} // Controlando a opacidade geral do path do fill
        />


        {/* Linha do Contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha: 2.5px para série principal
          strokeDasharray={pathLength}
          strokeDashoffset={animatedLineDashoffset}
        />

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteger NaN no SVG
          const x = plotAreaX + index * (plotWidth / (numDataPoints - 1));
          const safeX = isNaN(x) ? 0 : x;
          const y = plotAreaY + plotHeight + Math.round(15 * scale);

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={safeX}
              y={y}
              textAnchor="middle"
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
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
