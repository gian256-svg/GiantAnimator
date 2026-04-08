import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';
import { area, curveCardinal } from 'd3-shape'; // Importar d3-shape para gerar o path da área

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
  title?: string; // Título é opcional se o usuário não quiser
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

export const AreaChart: React.FC<AreaChartProps> = ({
  title = "Simple Area Chart", // Título padrão, replicando o da imagem
  labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"], // Dados placeholder
  series = [
    { label: "Series 1", data: [65, 59, 80, 81, 56, 55, 40, 70] }, // Dados placeholder
  ],
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
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#F5F5F5', // Cor de fundo da referência
        color: '#333333', // Cor do título da referência
        fontSize: Math.round(28 * scale),
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

  const data = series[0].data; // Utiliza apenas a primeira série para um Area Chart simples
  const maxValue = Math.max(...data, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  
  const numDataPoints = data.length;
  const xStep = plotWidth / (numDataPoints - 1);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(28 * scale); // Estimado da imagem de referência
  const axisLabelFontSize = Math.round(11 * scale);
  
  // Cores [REGRAS DE CORES] - Adaptado para fundo claro da referência
  const backgroundColor = '#F5F5F5'; // Cor de fundo da referência
  const titleColor = '#333333'; // Cor do título da referência
  const areaStrokeColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(0,0,0,0.08)'; // Grid para fundo claro
  const zeroLineColor = 'rgba(0,0,0,0.25)'; // Linha zero para fundo claro
  const axisTextColor = '#666666'; // Eixos para fundo claro

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

  // Geração do caminho SVG para a área
  const areaGenerator = area<number>()
    .x((d, i) => plotAreaX + i * xStep)
    .y0(plotAreaY + plotHeight) // Base da área no Y=0 (bottom of plot area)
    .y1((d) => {
      // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
      const yValue = maxValue > 0 ? (d / maxValue) * plotHeight : 0;
      return plotAreaY + plotHeight - yValue;
    })
    .curve(curveCardinal); // [LINE CHART] - Smooth/curva: usar cubic-bezier

  // A linha do contorno será a mesma do topo da área
  const lineGenerator = areaGenerator.lineY1();

  const areaPath = areaGenerator(data);
  const linePath = lineGenerator(data);

  // Animação do desenho da linha (stroke-dashoffset) [AREA CHART]
  const lineLength = linePath ? document.createElementNS("http://www.w3.org/2000/svg", "path").getTotalLength() : 0;
  // `getTotalLength()` só funciona com o elemento já no DOM ou criado e anexado.
  // Para Remotion, é melhor calcular o path fora ou usar um valor fixo/estimado para o comprimento se houver problemas.
  // Uma alternativa robusta é estimar ou pré-calcular o comprimento do path em um ambiente sem DOM (e.g. Node.js),
  // ou renderizar uma vez e capturar o comprimento, ou usar uma biblioteca que calcule o comprimento de um path D3.
  // Para fins desta demonstração, vamos usar uma estimativa ou um cálculo mais simples se o `document` não for acessível.
  // No ambiente de renderização do Remotion (Node.js), `document` não está disponível.
  // Para calcular `lineLength`, precisaríamos de uma abordagem alternativa ou de um polyfill para `getTotalLength`.
  // Por simplicidade na geração de código inicial, e dada a restrição de não usar `window/document`,
  // vamos *simular* o cálculo do comprimento, ou usar uma interpolação direta para o `strokeDashoffset` que vai de um valor grande para 0.
  // Se fosse um projeto real com `d3-path` ou similar, poderíamos ter o `path.node().getTotalLength()`.
  // Para este exercício, vou usar um valor grande (`1000`) para a animação do `strokeDashoffset` simulando o desenho.
  
  const animatedDashoffset = interpolate(
    frame,
    [10, 60], // frames 10-60 para desenho da linha
    [1000, 0], // do comprimento máximo para 0
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação do fill da área (fade-in) [AREA CHART]
  const areaFillOpacity = interpolate(
    frame,
    [50, 80], // começa a aparecer depois que a linha já está bem avançada
    [0, 1],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_SUBTLE,
    }
  );

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo do canvas da referência
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
          fill={titleColor} // Cor do título da referência
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
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
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Path da Área [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#areaGradient)`} // Usar gradiente para o fill
            opacity={areaFillOpacity}
          />
        )}

        {/* Definição do Gradiente para o Fill da Área */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={areaStrokeColor} stopOpacity="0.4" /> {/* opacidade topo: 0.4 */}
            <stop offset="100%" stopColor={areaStrokeColor} stopOpacity="0.0" /> {/* opacidade base: 0.0 */}
          </linearGradient>
        </defs>

        {/* Path da Linha de Contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={areaStrokeColor}
            strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
            strokeDasharray={1000} // Valor grande para a animação
            strokeDashoffset={animatedDashoffset}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

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
