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

interface PieChartData {
  label: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
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

// [REGRAS DE CORES] - Paleta padrão GiantAnimator (quando sem referência)
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // azul suave — Highcharts default
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

/**
 * Função para gerar o atributo 'd' do path SVG para uma fatia de pizza.
 * Suporta tanto fatias de pizza (innerRadius=0) quanto anéis de donut.
 * @param centerX Coordenada X do centro do círculo.
 * @param centerY Coordenada Y do centro do círculo.
 * @param outerRadius Raio externo da fatia.
 * @param startAngle Ângulo de início da fatia em graus.
 * @param endAngle Ângulo de fim da fatia em graus.
 * @param innerRadius Raio interno da fatia (0 para pizza, >0 para donut).
 * @returns String do atributo 'd' para o path SVG.
 */
const getPathD = (
  centerX: number,
  centerY: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  innerRadius: number = 0
) => {
  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  // Pontos do arco externo
  const outerStartX = centerX + outerRadius * Math.cos(toRadians(startAngle));
  const outerStartY = centerY + outerRadius * Math.sin(toRadians(startAngle));
  const outerEndX = centerX + outerRadius * Math.cos(toRadians(endAngle));
  const outerEndY = centerY + outerRadius * Math.sin(toRadians(endAngle));

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1; // 0 para arco pequeno, 1 para arco grande

  // Construir o path
  let path = `M ${outerStartX} ${outerStartY} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`;

  // Se houver innerRadius (donut), conectar ao arco interno
  if (innerRadius > 0) {
    const innerStartX = centerX + innerRadius * Math.cos(toRadians(endAngle));
    const innerStartY = centerY + innerRadius * Math.sin(toRadians(endAngle));
    const innerEndX = centerX + innerRadius * Math.cos(toRadians(startAngle));
    const innerEndY = centerY + innerRadius * Math.sin(toRadians(startAngle));
    
    // Linha do final do arco externo para o final do arco interno
    path += `L ${innerStartX} ${innerStartY}`;
    // Arco interno (no sentido anti-horário)
    path += `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEndX} ${innerEndY}`;
    // Fechar a fatia conectando o início do arco interno ao início do arco externo
    path += `Z`;
  } else {
    // Para pizza, conectar o final do arco externo ao centro e fechar
    path += `L ${centerX} ${centerY} Z`;
  }
  return path;
};

export const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const LEGEND_WIDTH = Math.round(250 * scale); // Espaço para a legenda na direita

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  // Reduz a largura disponível para o gráfico de pizza para acomodar a legenda
  const plotWidthForPie = chartWidth - LEGEND_WIDTH; 
  const plotHeightForPie = chartHeight;

  // Centro do gráfico de pizza
  const centerX = plotAreaX + plotWidthForPie / 2;
  const centerY = plotAreaY + plotHeightForPie / 2;
  const outerRadius = Math.min(plotWidthForPie, plotHeightForPie) / 2 - Math.round(20 * scale); // Deixa um pequeno padding

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

  // Calcula o valor total e dados normalizados para as fatias
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0; // Inicia em 0 graus (3 horas)
  const processedData = data.map((item, index) => {
    // [EDGE CASES E ROBUSTEZ] - Proteger contra divisão por zero
    const percentage = totalValue > 0 ? (item.value / totalValue) : 0;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length], // Atribui cor da paleta
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale);
  const legendFontSize = Math.round(12 * scale);
  const textColor = '#FFFFFF';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChart frame ${frame}.`);

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

        {/* Fatias da Pizza [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {processedData.map((slice, index) => {
          // Animação de cada fatia [REGRAS DE ANIMAÇÃO]
          // Cada fatia entra em sequência (+5 frames de delay)
          const sliceAnimStartFrame = 10 + index * 5;
          const sliceAnimEndFrame = sliceAnimStartFrame + 50; // 50 frames para animar cada fatia

          // Animar o endAngle da fatia de startAngle até seu endAngle real
          // [EDGE CASES E ROBUSTEZ] - Clamp interpolate
          const animatedEndAngle = interpolate(
            frame,
            [sliceAnimStartFrame, sliceAnimEndFrame],
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN no path
          const safeAnimatedEndAngle = isNaN(animatedEndAngle) ? slice.startAngle : animatedEndAngle;

          const d = getPathD(centerX, centerY, outerRadius, slice.startAngle, safeAnimatedEndAngle);
          
          // Calcular a posição do label externo da fatia
          const midAngle = (slice.startAngle + slice.endAngle) / 2;
          const labelOffsetRadius = outerRadius * 0.7; // Posição para labels dentro da fatia, mas não no centro
          const labelX = centerX + labelOffsetRadius * Math.cos((midAngle * Math.PI) / 180);
          const labelY = centerY + labelOffsetRadius * Math.sin((midAngle * Math.PI) / 180);

          // Animação do label de valor
          const labelAnimStartFrame = sliceAnimEndFrame - 10; // Labels aparecem um pouco antes do fim da animação da fatia
          const labelAnimEndFrame = labelAnimStartFrame + 20;
          const labelOpacity = interpolate(frame, [labelAnimStartFrame, labelAnimEndFrame], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const labelYOffsetAnimation = interpolate(frame, [labelAnimStartFrame, labelAnimEndFrame], [Math.round(10 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          // [PIE CHART] - Label externo: mostrar apenas quando fatia > 5%
          const showLabel = slice.percentage > 0.05; // 5%
          
          return (
            <React.Fragment key={slice.label}>
              <path d={d} fill={slice.color} />
              {showLabel && (
                <text
                  x={labelX}
                  y={labelY + labelYOffsetAnimation}
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fontWeight={600}
                  fill={textColor}
                  opacity={labelOpacity}
                  style={{ textShadow: labelTextShadow }}
                >
                  {formatNumber(slice.percentage * 100, '', 1)}%
                </text>
              )}
            </React.Fragment>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {/* Posição direita, alinhada verticalmente */}
        <g transform={`translate(${plotAreaX + plotWidthForPie + Math.round(20 * scale)}, ${plotAreaY + Math.round(50 * scale)})`}>
          {processedData.map((item, index) => {
            const legendAnimStartFrame = 60 + index * 5; // Aparece depois das fatias
            const legendAnimEndFrame = legendAnimStartFrame + 20;
            const legendOpacity = interpolate(frame, [legendAnimStartFrame, legendAnimEndFrame], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const legendYOffset = interpolate(frame, [legendAnimStartFrame, legendAnimEndFrame], [Math.round(10 * scale), 0], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const legendItemY = index * Math.round(25 * scale); // Espaçamento entre itens

            return (
              <g key={item.label} opacity={legendOpacity} transform={`translate(0, ${legendItemY + legendYOffset})`}>
                {/* Retângulo de cor [REGRAS DE CORES] */}
                <rect x="0" y="0" width={Math.round(12 * scale)} height={Math.round(12 * scale)} fill={item.color} rx={Math.round(2 * scale)} ry={Math.round(2 * scale)} />
                {/* Texto da legenda [REGRAS DE TIPOGRAFIA E LABELS] */}
                <text x={Math.round(20 * scale)} y={Math.round(9 * scale)} fontSize={legendFontSize} fill="#CCCCCC">
                  {item.label}: {formatNumber(item.percentage * 100, '', 1)}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
