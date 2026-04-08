import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs
// Animação principal — barras, linhas, áreas (adaptado para o "crescimento" do pie chart)
const SPRING_CONFIG_MAIN: SpringConfig = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

// Animação sutil — fade de elementos, ou entrada geral do gráfico
const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface PieChartProps {
  // Dados inferidos da imagem de referência para replicar fielmente
  // O usuário não forneceu dados, então usamos dados que resultam em proporções visuais similares.
  data?: number[];
  colors?: string[];
}

// Helper para converter coordenadas polares em cartesianas, para desenhar o arco SVG
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  // Ajusta o ângulo para que 0 graus esteja no topo (12 horas) e cresça no sentido horário
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper para gerar o path SVG para uma fatia de pizza
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  // [EDGE CASES E ROBUSTEZ] - Garantir que o ângulo não seja negativo ou NaN
  const safeStartAngle = isNaN(startAngle) ? 0 : startAngle;
  const safeEndAngle = isNaN(endAngle) ? 0 : endAngle;

  const start = polarToCartesian(x, y, radius, safeEndAngle);
  const end = polarToCartesian(x, y, radius, safeStartAngle);

  // Se a fatia é um círculo completo ou quase, ou tem um ângulo muito pequeno,
  // precisamos ajustar para que o SVG renderize corretamente.
  const largeArcFlag = safeEndAngle - safeStartAngle >= 180 ? "1" : "0";
  
  // Se os ângulos são iguais, ou muito próximos, desenhe um ponto ou um círculo pequeno.
  // Para fins de animação de "crescimento", se endAngle === startAngle, o path é invisível.
  if (safeEndAngle - safeStartAngle < 0.001) {
    return `M ${x} ${y}`; // Retorna um ponto, efetivamente invisível
  }

  const d = [
    "M", x, y, // Move para o centro do círculo
    "L", start.x, start.y, // Linha do centro até o ponto inicial do arco
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, // O próprio arco
    "Z" // Fecha o path, conectando de volta ao centro
  ].join(" ");

  return d;
};

export const PieChart: React.FC<PieChartProps> = ({
  // Dados inferidos diretamente da imagem de referência
  data = [100, 100, 100], // 3 fatias de valores iguais para replicar as proporções da imagem
  // Cores exatas extraídas da imagem de referência [REGRA #1: Paleta de cores (extrair os hex exatos)]
  colors = ['#44A1F6', '#EEC21B', '#C586ED'],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1080, height / 1080); // Usamos 1080x1080 como base para um gráfico quadrado

  // Fundo do canvas e borda arredondada [REGRA #1: Replique fielmente]
  const CANVAS_BG_COLOR = '#F08080'; // Cor exata da imagem
  const CANVAS_BORDER_RADIUS = Math.round(16 * scale); // Arredondamento do quadrado externo

  // Dimensões do gráfico (o pie chart é centralizado e ocupa a maior parte do canvas)
  const chartSize = Math.min(width, height) * 0.8; // Ocupa 80% da menor dimensão do canvas
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = chartSize / 2;

  // Stroke do pie chart [REGRA #1: Espessura e arredondamento dos elementos]
  const PIE_STROKE_COLOR = '#000000'; // Preto
  const PIE_STROKE_WIDTH = Math.round(3 * scale); // Espessura do contorno, fiel à referência

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: CANVAS_BG_COLOR,
        borderRadius: CANVAS_BORDER_RADIUS,
        overflow: 'hidden',
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

  // Cálculo dos ângulos das fatias
  const totalValue = data.reduce((sum, val) => sum + val, 0);
  let currentAngle = 0; // Onde a fatia atual começa
  const slices = data.map((value, index) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const sliceAngle = totalValue > 0 ? (value / totalValue) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      startAngle,
      endAngle,
      color: colors[index % colors.length], // Cicla pelas cores se houver mais fatias que cores
      value,
    };
  });

  // Animação de entrada geral do gráfico (fade e scale) [REGRAS DE ANIMAÇÃO]
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: CANVAS_BG_COLOR, // Fundo exato da referência
        borderRadius: CANVAS_BORDER_RADIUS, // Borda arredondada exata da referência
        overflow: 'hidden', // Esconde o que sai da borda arredondada
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/*
          [REGRA #1: NUNCA IMPROVISAR DESIGN]
          A imagem de referência NÃO possui título, subtítulo, labels de valor, legendas ou grid.
          Portanto, NENHUM desses elementos deve ser gerado.
        */}

        {/* Renderiza as fatias da pizza */}
        {slices.map((slice, index) => {
          // Animação de "desenho" da fatia [REGRAS DE ANIMAÇÃO]
          // Cada fatia entra em sequência (+5 frames de delay)
          const animationStart = 10 + index * 5; // Atraso de 5 frames por fatia
          const animationDuration = 50;

          // O ângulo final interpolado da fatia
          const animatedEndAngle = interpolate(
            frame,
            [animationStart, animationStart + animationDuration],
            [slice.startAngle, slice.endAngle], // Começa no startAngle e vai até o endAngle final
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          // [EDGE CASES E ROBUSTEZ] - NaN protegido
          const safeAnimatedEndAngle = isNaN(animatedEndAngle) ? slice.startAngle : animatedEndAngle;

          const pathData = describeArc(centerX, centerY, radius, slice.startAngle, safeAnimatedEndAngle);

          return (
            <path
              key={index}
              d={pathData}
              fill={slice.color}
              stroke={PIE_STROKE_COLOR}
              strokeWidth={PIE_STROKE_WIDTH}
            />
          );
        })}
      </svg>
    </div>
  );
};
