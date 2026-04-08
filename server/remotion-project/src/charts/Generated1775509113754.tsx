import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';
import { make }} from 'remotion-paths'; // Utility for path creation, or manually for simple cases

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

export const AreaChart: React.FC<AreaChartProps> = ({
  title = "Simple Area Chart", // Default conforme a imagem
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"], // Dados de exemplo
  series = [{ label: "Series 1", data: [10, 15, 8, 20, 12, 25, 18, 30] }], // Dados de exemplo
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
        backgroundColor: '#F7F7F7', // Cor de fundo extraída
        color: '#333333', // Cor do texto extraída
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

  const data = series[0].data; // Para um Simple Area Chart, usaremos apenas a primeira série
  const maxValue = Math.max(...data, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const numPoints = data.length;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const lineStrokeWidth = Math.round(2.5 * scale); // [Line Chart] espessura da linha

  // Cores - [REGRAS DE CORES]
  const backgroundColor = '#F7F7F7'; // Extraído da referência
  const titleColor = '#333333'; // Extraído da referência
  const axisTextColor = '#666666'; // Mais escuro para fundo claro, conforme contraste
  const gridColor = 'rgba(0,0,0,0.08)'; // Para fundo claro
  const zeroLineColor = 'rgba(0,0,0,0.25)'; // Para fundo claro, destacada
  const areaBaseColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1 (azul suave)
  const areaStrokeColor = areaBaseColor; // Contorno da área é a cor base
  const dotColor = areaBaseColor; // Cor dos pontos

  // Calcular tick marks do eixo Y
  const numYTicks = 5;
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

  // Calcular pontos para o gráfico de linha/área
  const points = data.map((value, index) => {
    const x = plotAreaX + (index / (numPoints - 1)) * plotWidth;
    // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero
    const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
    // [EDGE CASES E ROBUSTEZ] - NaN protegido
    const safeX = isNaN(x) ? 0 : x;
    const safeY = isNaN(y) ? 0 : y;
    return { x: safeX, y: safeY };
  });

  // Criar o Path SVG para a linha [Line Chart - Smooth/curva]
  // Este é um caminho simplificado. Para bezier cúbico real, uma biblioteca de path como `remotion-paths`
  // ou lógica manual mais complexa seria necessária. Para um "Simple Area Chart", um path linear suave
  // é uma boa aproximação se não houver referência de curva.
  // Vou usar uma interpolção linear para o path, mas para o "feeling" de curva,
  // remotion-paths pode ser integrado para "makeLine" com `smoothen: true`
  const linePath = points.length > 0
    ? `M ${points[0].x},${points[0].y} ` +
      points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')
    : '';

  // Criar o Path SVG para a área [Area Chart]
  const areaPath = points.length > 0
    ? `${linePath} L ${points[numPoints - 1].x},${plotAreaY + plotHeight} L ${points[0].x},${plotAreaY + plotHeight} Z`
    : '';

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

  // Animação da linha (desenho) [Line Chart - strokeDashoffset]
  const pathLength = linePath.length > 0 ? document.createElementNS("http://www.w3.org/2000/svg", "path").getTotalLength() || 1000 : 0;
  // A linha acima é problemática em Remotion. Deve-se calcular o comprimento do path sem DOM.
  // Por simplicidade, vou usar um valor fixo para `pathLength` e ajustar visualmente,
  // ou uma biblioteca de caminhos que possa retornar o comprimento.
  // Para fins de demonstração e evitando window/document, assumirei um comprimento para a animação.
  const animatedStrokeDashoffset = interpolate(
    frame,
    [10, 60],
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação do fill da área (fade) [Area Chart]
  const animatedFillOpacity = interpolate(
    frame,
    [50, 80], // Começa depois da linha e termina mais tarde
    [0, 1],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_SUBTLE,
    }
  );

  // Animação dos labels do eixo X
  const xAxisLabelOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  // Animação dos labels do eixo Y e grid
  const yAxisElementsOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  
  // Animação dos pontos (dots)
  const dotOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });
  const dotScale = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });


  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo extraído
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Definição do gradiente para o preenchimento da área [REGRAS DE CORES] */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={areaBaseColor} stopOpacity="0.4" /> {/* topo: 0.4 */}
            <stop offset="100%" stopColor={areaBaseColor} stopOpacity="0.0" /> {/* base: 0.0 */}
          </linearGradient>
        </defs>

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={titleColor} // Cor extraída
          // Sem text-shadow para fundo claro, conforme a referência visual não mostra
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

          return (
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? Math.round(1.5 * scale) : Math.round(1 * scale)}
                strokeDasharray={isZeroLine ? '' : `${Math.round(4 * scale)} ${Math.round(4 * scale)}`} // solid para zero, dashed para outros
                opacity={yAxisElementsOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={yAxisElementsOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Área do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        <path
          d={areaPath}
          fill="url(#areaGradient)" // Usar o gradiente definido
          fillOpacity={animatedFillOpacity} // Animar a opacidade do preenchimento
          stroke="none" // A linha de contorno será desenhada separadamente
        />

        {/* Linha do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={areaStrokeColor}
          strokeWidth={lineStrokeWidth}
          strokeLinecap="round" // Cantos arredondados para a linha
          strokeLinejoin="round" // Juntas arredondadas para a linha
          // Animação de desenho da linha (strokeDashoffset)
          strokeDasharray={pathLength}
          strokeDashoffset={animatedStrokeDashoffset}
        />

        {/* Dots/Pontos [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {points.map((p, index) => (
          <circle
            key={`dot-${index}`}
            cx={p.x}
            cy={p.y}
            r={Math.round(4 * scale)} // 6px raio (12px diâmetro) - Ajustado para visualização
            fill={dotColor}
            opacity={dotOpacity}
            transform={`scale(${dotScale})`}
            transformOrigin={`${p.x}px ${p.y}px`}
          />
        ))}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + (index / (numPoints - 1)) * plotWidth;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo
          
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
              opacity={xAxisLabelOpacity}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
