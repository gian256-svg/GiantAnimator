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

// Animação de labels — sem bounce (não usado diretamente aqui, mas mantido para consistência)
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

// Helper para converter graus para radianos
const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

interface PieChartProps {
  // Os dados são inferidos da imagem: 3 fatias de tamanho igual.
  // Se fossem fornecidos dados, eles seriam usados para calcular os ângulos.
  // Para replicar fielmente a imagem, assumimos 3 valores iguais.
  data?: number[]; // Opcional, para permitir que o componente seja genérico se for usado com outros dados
}

export const PieChart: React.FC<PieChartProps> = ({
  data = [1, 1, 1], // Default para 3 fatias iguais, conforme a imagem de referência
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A referência é um quadrado, então idealmente usaremos 1080x1080 como base para a escala.
  const baseCanvasSize = 1080;
  const scale = Math.min(width / baseCanvasSize, height / baseCanvasSize);

  // Cores extraídas diretamente da imagem de referência [REGRA #1]
  const backgroundColor = '#f97272';
  const sliceColors = [
    '#3b82f6', // Azul
    '#facc15', // Amarelo
    '#a78bfa', // Roxo
  ];
  const sliceBorderColor = '#000000';
  const sliceBorderWidth = Math.round(2 * scale); // Visualmente 2px

  // Dimensões do canvas e margens para o gráfico de pizza
  const containerSize = Math.min(width, height);
  const chartRadius = (containerSize / 2) - Math.round(40 * scale); // 40px de padding interno [REGRAS DE ESTRUTURA E LAYOUT]
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;
  const borderRadius = Math.round(16 * scale); // Cantos arredondados do container, conforme imagem

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
        borderRadius: borderRadius,
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  // Calcular a soma total e ângulos para cada fatia
  const totalValue = data.reduce((sum, val) => sum + val, 0);
  let currentAngle = 0; // Inicia em 0 (topo, 12 horas)

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
        backgroundColor: backgroundColor, // Cor de fundo extraída
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: width,
        height: height,
        borderRadius: borderRadius, // Cantos arredondados, conforme imagem
        overflow: 'hidden', // Garante que a borda arredondada seja respeitada
      }}
    >
      <svg
        width={containerSize}
        height={containerSize}
        viewBox={`0 0 ${containerSize} ${containerSize}`}
        style={{
          transform: `scale(${chartScale})`,
          opacity: chartEntrance,
          transformOrigin: 'center center',
        }}
      >
        {data.map((value, index) => {
          // Calcula o ângulo da fatia
          const sliceAngle = (value / totalValue) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;
          currentAngle = endAngle; // Atualiza para a próxima fatia

          // Animação da fatia [REGRAS DE ANIMAÇÃO]
          // Cada fatia "entra" com rotação, staggered.
          const animationDelay = 10 + index * 5; // Stagger de 5 frames por fatia
          const animationDuration = 50; // Duração da animação da fatia
          
          const animatedEndAngle = interpolate(
            frame,
            [animationDelay, animationDelay + animationDuration],
            [startAngle, endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Calcula os pontos de início e fim do arco
          const startX = centerX + chartRadius * Math.cos(degreesToRadians(startAngle - 90)); // -90 para iniciar no topo
          const startY = centerY + chartRadius * Math.sin(degreesToRadians(startAngle - 90));
          const endX = centerX + chartRadius * Math.cos(degreesToRadians(animatedEndAngle - 90));
          const endY = centerY + chartRadius * Math.sin(degreesToRadians(animatedEndAngle - 90));

          // Flag para arcos maiores que 180 graus
          const largeArcFlag = sliceAngle > 180 ? 1 : 0;

          // Construção do path SVG para a fatia
          const pathData = [
            `M ${centerX} ${centerY}`, // Move para o centro
            `L ${startX} ${startY}`, // Linha para o ponto inicial do arco
            `A ${chartRadius} ${chartRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arco
            `Z`, // Fecha o path de volta ao centro
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={sliceColors[index % sliceColors.length]} // Usa as cores extraídas
              stroke={sliceBorderColor} // Borda preta
              strokeWidth={sliceBorderWidth} // Espessura da borda
            />
          );
        })}
      </svg>
    </div>
  );
};
