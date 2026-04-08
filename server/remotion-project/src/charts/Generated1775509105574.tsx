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

interface PieChartData {
  label: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
}

// [REGRAS DE CORES] - Paleta padrão GiantAnimator (quando sem referência)
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // azul suave
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatPercentage = (num: number): string => {
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
};

// Helper para converter coordenadas polares em cartesianas
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper para gerar o path SVG de um arco de pizza
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  // [EDGE CASES E ROBUSTEZ] - Prevenir NAN em atributos SVG
  const safeStartX = isNaN(start.x) ? x : start.x;
  const safeStartY = isNaN(start.y) ? y : start.y;
  const safeEndX = isNaN(end.x) ? x : end.x;
  const safeEndY = isNaN(end.y) ? y : end.y;

  return [
    `M ${x} ${y}`, // Mover para o centro do círculo
    `L ${safeStartX} ${safeStartY}`, // Linha para o ponto inicial do arco
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${safeEndX} ${safeEndY}`, // Desenhar o arco
    `Z` // Fechar o path de volta ao centro
  ].join(" ");
};

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data: rawData,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale);
  const TITLE_HEIGHT = Math.round(24 * scale);

  const chartCenterX = width / 2;
  const chartCenterY = PLOT_AREA_PADDING + TITLE_HEIGHT + (height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT) / 2;
  const outerRadius = Math.min(
    (width - 2 * PLOT_AREA_PADDING) / 2,
    (height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT) / 2
  ) * 0.8; // Reduzir um pouco para dar espaço aos labels

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(rawData) || rawData.length === 0 || rawData.every(d => d.value === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty/all zeros. Displaying fallback.`);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#1a1a2e',
          color: '#FFFFFF',
          fontSize: Math.round(24 * scale),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        }}
      >
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  // Calcular total e percentuais
  const totalValue = rawData.reduce((sum, item) => sum + item.value, 0);

  // [PIE CHART RULE] - Fatias < 3%: agrupar em "Outros" - A entrada de dados já contém "Others",
  // mas vamos garantir a regra se algum valor pequeno for passado
  let processedData = [...rawData];
  if (totalValue > 0) {
    let smallSlices = [];
    let othersValue = 0;
    let othersLabel = "Others"; // Default label

    // Remove existing "Others" if any to re-calculate, or assume it's part of the data
    const existingOthersIndex = processedData.findIndex(d => d.label === "Others");
    if (existingOthersIndex !== -1) {
        // If "Others" already exists, keep its value, and remove it from general processing
        // This assumes the user manually provided a combined "Others" slice
        othersValue = processedData[existingOthersIndex].value;
        smallSlices = processedData.filter((_, i) => i !== existingOthersIndex);
        processedData = smallSlices; // Reset processedData to only non-Others
    } else {
        // If no "Others" exists, find small slices
        smallSlices = processedData.filter(item => (item.value / totalValue) * 100 < 3);
        processedData = processedData.filter(item => (item.value / totalValue) * 100 >= 3);
        if (smallSlices.length > 0) {
            othersValue += smallSlices.reduce((sum, item) => sum + item.value, 0);
        }
    }

    if (othersValue > 0) {
        processedData.push({ label: othersLabel, value: othersValue });
    }
  }

  // Prepara os dados para o gráfico, calculando ângulos
  let currentAngle = 0;
  const pieSlices = processedData.map((item, index) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenir divisão por zero
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const angle = totalValue > 0 ? (item.value / totalValue) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage: percentage,
      startAngle: startAngle,
      endAngle: endAngle,
      color: GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length],
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const labelFontSize = Math.round(12 * scale);
  const valueLabelFontSize = Math.round(13 * scale);

  // Cores [REGRAS DE CORES]
  const textColor = '#FFFFFF';
  const labelTextColor = '#CCCCCC';
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

        {/* Fatias do Pie Chart [REGRAS POR TIPO DE GRÁFICO -> Pie Chart] */}
        {pieSlices.map((slice, index) => {
          // Animação da fatia: rotação em sentido horário — cada fatia entra em sequência (+5 frames de delay)
          const animationDelay = 10 + index * 5; // Staggered start
          const animatedEndAngle = interpolate(
            frame,
            [animationDelay, animationDelay + 40], // 40 frames de duração para cada fatia
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Path para a fatia
          const d = describeArc(chartCenterX, chartCenterY, outerRadius, slice.startAngle, animatedEndAngle);

          // Posição para o label (no meio do arco)
          const midAngle = (slice.startAngle + slice.endAngle) / 2;
          const labelRadius = outerRadius * 0.7; // Um pouco mais para dentro
          const labelCoords = polarToCartesian(chartCenterX, chartCenterY, labelRadius, midAngle);

          // Posição para o label externo de percentual
          const externalLabelRadius = outerRadius * 1.1; // Um pouco para fora
          const externalLabelCoords = polarToCartesian(chartCenterX, chartCenterY, externalLabelRadius, midAngle);
          
          // Animação dos labels de valor [REGRAS DE ANIMAÇÃO]
          const labelOpacity = interpolate(frame, [animationDelay + 30, animationDelay + 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const labelYOffsetAnimation = interpolate(frame, [animationDelay + 30, animationDelay + 60], [Math.round(10 * scale), 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          // [PIE CHART RULE] - Label externo: mostrar apenas quando fatia > 5%
          const showLabel = slice.percentage > 5;
          const labelTextAnchor = externalLabelCoords.x > chartCenterX ? "start" : "end";


          return (
            <React.Fragment key={slice.label}>
              <path
                d={d}
                fill={slice.color}
                // opacity={sliceOpacity} // Opcional se quisermos animar a opacidade também
              />
              {showLabel && (
                <>
                  {/* Label de percentual [REGRAS DE TIPOGRAFIA E LABELS] */}
                  <text
                    x={externalLabelCoords.x}
                    y={externalLabelCoords.y + Math.round(valueLabelFontSize / 2) - labelYOffsetAnimation} // Ajuste para centralizar verticalmente
                    textAnchor={labelTextAnchor}
                    fontSize={valueLabelFontSize}
                    fontWeight={600}
                    fill={textColor}
                    opacity={labelOpacity}
                    style={{ textShadow: labelTextShadow }}
                  >
                    {formatPercentage(slice.percentage)}
                  </text>
                  {/* Label do nome da fatia, um pouco abaixo */}
                  <text
                    x={externalLabelCoords.x}
                    y={externalLabelCoords.y + Math.round(valueLabelFontSize / 2) + Math.round(15 * scale) - labelYOffsetAnimation} // Ajuste para centralizar verticalmente
                    textAnchor={labelTextAnchor}
                    fontSize={labelFontSize}
                    fill={labelTextColor}
                    opacity={labelOpacity}
                    style={{ textShadow: labelTextShadow }}
                  >
                    {slice.label}
                  </text>
                </>
              )}
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
};
