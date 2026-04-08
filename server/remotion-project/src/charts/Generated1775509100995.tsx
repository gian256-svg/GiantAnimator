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

// Animação de labels — sem bounce (não usado neste gráfico, mas mantido para consistência)
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

// Interface para os dados da fatia
interface PieSliceData {
  value: number;
  color: string;
}

interface PieChartProps {
  data?: PieSliceData[]; // Dados inferidos do gráfico de referência
}

// Helper para converter ângulo para coordenadas de círculo
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
};

// Helper para criar o path SVG de uma fatia de pizza
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    `L ${x} ${y}`,
    `Z`,
  ].join(' ');
};

export const PieChart: React.FC<PieChartProps> = ({
  data = [ // Dados inferidos do gráfico de referência - 3 fatias aproximadamente iguais
    { value: 100, color: '#3498DB' }, // Azul
    { value: 100, color: '#F1C40F' }, // Amarelo
    { value: 100, color: '#B167E2' }, // Roxo
  ],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Cores extraídas fielmente da imagem de referência [REGRA #1 - Paleta de cores exatas]
  const backgroundColor = '#F5928C'; // Cor de fundo avermelhada/coral
  const borderColor = '#000000'; // Borda preta
  const borderWidth = Math.round(2 * scale); // Espessura da borda inferida

  // [EDGE CASES E ROBUSTEZ] - Verificar dados
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for PieChart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: backgroundColor,
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(8 * scale), // Borda arredondada do canvas
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  const totalValue = data.reduce((sum, slice) => sum + slice.value, 0);

  // Dimensões do gráfico [REGRAS DE ESTRUTURA E LAYOUT]
  const chartRadius = Math.min(width, height) / 2 - Math.round(80 * scale); // Raio do pie chart, com padding
  const centerX = width / 2;
  const centerY = height / 2;

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChart frame ${frame}.`);

  let currentAngle = 0; // O ângulo de início para cada fatia

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo customizado da referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        borderRadius: Math.round(8 * scale), // Borda arredondada do canvas, replicando a ref
        transform: `scale(${chartScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((slice, index) => {
          const sliceAngle = (slice.value / totalValue) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          currentAngle = endAngle; // Atualiza o ângulo para a próxima fatia

          // Animação de cada fatia: rotação em sentido horário, cada fatia entra em sequência
          // Rule: "cada fatia entra em sequência (+5 frames de delay)"
          const animationDelay = 10 + index * 5; // Staggered start delay
          const animationDuration = 40;

          const animatedEndAngle = interpolate(
            frame,
            [animationDelay, animationDelay + animationDuration],
            [startAngle, endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG path
          const safeStartAngle = isNaN(startAngle) ? 0 : startAngle;
          const safeAnimatedEndAngle = isNaN(animatedEndAngle) ? 0 : animatedEndAngle;

          return (
            <path
              key={index}
              d={describeArc(centerX, centerY, chartRadius, safeStartAngle, safeAnimatedEndAngle)}
              fill={slice.color}
              stroke={borderColor}
              strokeWidth={borderWidth}
            />
          );
        })}
      </svg>
    </div>
  );
};
