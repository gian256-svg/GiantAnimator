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

interface PieChartProps {
  // O gráfico de referência não possui labels ou títulos.
  // Geramos dados arbitrários para 3 fatias iguais.
  // Se o usuário quiser dados diferentes, precisará especificar.
  data?: number[]; // Usaremos dados padrão se não fornecido
}

// Helper para converter coordenadas polares para cartesianas
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
};

// Helper para gerar o path 'd' de uma fatia de pizza (SVG Arc)
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', x, y,
    'Z',
  ].join(' ');
};

export const PieChart: React.FC<PieChartProps> = ({ data = [1, 1, 1] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // O gráfico de referência tem um fundo quadrado com cantos arredondados.
  // Vamos assumir uma composição quadrada para replicar o visual fielmente.
  const canvasSize = Math.min(width, height);
  const canvasPadding = Math.round(canvasSize * 0.1); // Aproximadamente 10% de padding em cada lado
  const chartRadius = (canvasSize - 2 * canvasPadding) / 2;
  const chartCenterX = canvasSize / 2;
  const chartCenterY = canvasSize / 2;

  // Extrair cores da imagem de referência [REGRA #1 - Paleta de cores]
  const backgroundColor = '#F97068';
  const sliceColors = ['#3399FF', '#FFCC33', '#CC99FF'];
  const strokeColor = '#000000';
  const strokeWidth = Math.round(2 * (canvasSize / 500)); // Ajusta a espessura da borda proporcionalmente

  // [EDGE CASES E ROBUSTEZ] - Verificar dados
  if (!Array.isArray(data) || data.length === 0 || data.every(val => val <= 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty/zero for PieChart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: backgroundColor,
        color: '#FFFFFF',
        fontSize: Math.round(24 * (canvasSize / 500)),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(16 * (canvasSize / 500)), // Cantos arredondados do canvas
        overflow: 'hidden',
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  const totalValue = data.reduce((sum, val) => sum + Math.max(0, val), 0); // Ignora valores negativos ou zero no total
  if (totalValue === 0) { // Se todos os valores são 0 ou negativos
    console.log(`[${new Date().toISOString()}] GiantAnimator: Total value is zero for PieChart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: backgroundColor,
        color: '#FFFFFF',
        fontSize: Math.round(24 * (canvasSize / 500)),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(16 * (canvasSize / 500)),
        overflow: 'hidden',
      }}>
        Sem dados válidos para exibir.
      </div>
    );
  }

  let currentAngle = 0;
  const slices = data.map((value, index) => {
    // [EDGE CASES E ROBUSTEZ] - Tratar valores não positivos
    const actualValue = Math.max(0, value); 
    const sliceAngle = (actualValue / totalValue) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      startAngle,
      endAngle,
      color: sliceColors[index % sliceColors.length], // Cicla pelas cores disponíveis
      originalValue: value, // Manter o valor original para referência
    };
  });

  // Animação de entrada do gráfico [REGRAS DE ANIMAÇÃO]
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
        width,
        height,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: backgroundColor, // Fundo extraído da imagem
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        borderRadius: Math.round(16 * (canvasSize / 500)), // Cantos arredondados do canvas
        overflow: 'hidden', // Garante que o borderRadius seja visível
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={canvasSize} height={canvasSize} viewBox={`0 0 ${canvasSize} ${canvasSize}`}>
        {slices.map((slice, index) => {
          // [REGRAS DE ANIMAÇÃO] - Pie/Donut: rotação em sentido horário — cada fatia entra em sequência
          const animationDelay = index * 5; // +5 frames de delay entre fatias
          const animatedEndAngle = interpolate(
            frame,
            [10 + animationDelay, 60 + animationDelay], // Animação começa no frame 10, com stagger
            [slice.startAngle, slice.endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // Se a fatia tem valor 0 ou negativo, não a desenhe.
          if (slice.originalValue <= 0) {
            return null;
          }

          return (
            <path
              key={index}
              d={describeArc(chartCenterX, chartCenterY, chartRadius, slice.startAngle, animatedEndAngle)}
              fill={slice.color}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </svg>
    </div>
  );
};
