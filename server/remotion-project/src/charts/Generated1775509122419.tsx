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

// Animação sutil — linhas de grid, fade
const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface PieSliceData {
  label: string; // Rótulo da fatia
  value: number; // Valor da fatia para cálculo de proporção
  color: string; // Cor da fatia
}

interface PieChartProps {
  data?: PieSliceData[]; // Dados para as fatias
  canvasColor?: string; // Cor de fundo do canvas, se diferente do padrão da referência
}

// Helper function para converter coordenadas polares em cartesianas
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  // Ajusta o ângulo para que 0 graus esteja às 12 horas (topo do círculo)
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper function para descrever o caminho SVG (path) de uma fatia de pizza
const describeArc = (
  x: number, // Centro X
  y: number, // Centro Y
  radius: number, // Raio do círculo
  startAngle: number, // Ângulo inicial da fatia
  endAngle: number // Ângulo final da fatia
) => {
  // Garante que os ângulos são válidos para o cálculo do arco
  const actualStartAngle = Math.min(startAngle, endAngle);
  const actualEndAngle = Math.max(startAngle, endAngle);

  // Calcula os pontos inicial e final do arco na circunferência
  const pathStart = polarToCartesian(x, y, radius, actualStartAngle);
  const pathEnd = polarToCartesian(x, y, radius, actualEndAngle);

  // Determina se o arco é "grande" (maior que 180 graus)
  const largeArcFlag = actualEndAngle - actualStartAngle <= 180 ? 0 : 1;

  // Monta o comando do path SVG:
  // M x y           -> Move para o centro do círculo
  // L pathStart.x pathStart.y -> Desenha uma linha do centro para o ponto inicial do arco
  // A radius radius 0 largeArcFlag 1 pathEnd.x pathEnd.y -> Desenha o arco
  // Z               -> Fecha o caminho de volta para o centro
  const d = [
    `M ${x} ${y}`,
    `L ${pathStart.x} ${pathStart.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${pathEnd.x} ${pathEnd.y}`,
    `Z`,
  ].join(' ');

  return d;
};


export const PieChart: React.FC<PieChartProps> = ({
  // Dados inferidos da imagem: 3 fatias com proporções aproximadas de 25%, 33.3%, 41.7%
  data = [
    { label: "Blue", value: 3, color: "#4A90E2" },
    { label: "Yellow", value: 4, color: "#F8E71C" },
    { label: "Purple", value: 5, color: "#B868D8" }
  ],
  canvasColor = '#F8847C', // Cor de fundo do canvas extraída da imagem de referência
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional para um canvas quadrado 1080x1080
  const scale = Math.min(width / 1080, height / 1080);

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for PieChart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: canvasColor,
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(16 * scale), // Bordas arredondadas do canvas da referência
        overflow: 'hidden', // Garante que o conteúdo respeite as bordas arredondadas
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  const totalValue = data.reduce((sum, slice) => sum + slice.value, 0);
  if (totalValue === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Total value of data is zero for PieChart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: canvasColor,
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(16 * scale),
        overflow: 'hidden',
      }}>
        Total de dados zero.
      </div>
    );
  }

  // Dimensões do gráfico [REGRAS DE ESTRUTURA E LAYOUT]
  const PIE_PADDING = Math.round(50 * scale); // Padding visual observado na imagem
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - PIE_PADDING;
  const strokeWidth = Math.round(2 * scale); // Espessura do contorno extraída da imagem

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const chartScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  let currentAngle = 0; // Começa às 12 horas (0 graus)

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: canvasColor,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
        borderRadius: Math.round(16 * scale), // Bordas arredondadas do canvas da referência
        overflow: 'hidden', // Importante para que as bordas arredondadas funcionem
        width: width,
        height: height,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((slice, index) => {
          const sliceAngle = (slice.value / totalValue) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          currentAngle = endAngle; // Atualiza o ângulo inicial para a próxima fatia

          // Animação de entrada da fatia [REGRAS DE ANIMAÇÃO]
          // Cada fatia entra em sequência com um delay de 5 frames
          const animationStartFrame = 10 + index * 5;
          const animationEndFrame = 60 + index * 5;

          const animatedEndAngle = interpolate(
            frame,
            [animationStartFrame, animationEndFrame],
            [startAngle, endAngle], // A fatia "cresce" do seu ângulo inicial até o final
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Path para a fatia (o ângulo final é animado)
          const d = describeArc(centerX, centerY, radius, startAngle, animatedEndAngle);

          // [REGRAS DE CORES] - Cores das fatias e contorno preto
          return (
            <path
              key={slice.label}
              d={d}
              fill={slice.color}
              stroke="#000000" // Contorno preto da referência
              strokeWidth={strokeWidth}
            />
          );
        })}
      </svg>
    </div>
  );
};
