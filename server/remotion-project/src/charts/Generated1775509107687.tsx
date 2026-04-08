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

// Helper para converter coordenadas polares para cartesianas
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper para gerar o path SVG de uma fatia de pizza
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  if (endAngle - startAngle === 0) return `M ${x} ${y}`; // Evita paths inválidos para fatias de 0
  
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  const d = [
    "M", x, y,                     // Move para o centro do círculo
    "L", start.x, start.y,         // Linha para o início do arco
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, // O arco
    "Z"                           // Fecha o path de volta ao centro
  ].join(" ");
  return d;
};

interface PieChartProps {
  // Dados hardcoded para replicar a imagem fielmente, pois não foram fornecidos dados no JSON
  // A imagem não possui labels, então não precisamos de props para eles
}

export const PieChart: React.FC<PieChartProps> = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional (mas com foco na proporção quadrada da imagem)
  const scale = Math.min(width / 1080, height / 1080); // A imagem de referência é quadrada, então escalamos para ela

  // Cores extraídas fielmente da imagem de referência [REGRA #1 - Layout Original, Paleta de Cores]
  const backgroundColor = '#E28080'; // Fundo vermelho rosado
  const sliceColors = ['#409DFB', '#E4BD41', '#B984D3']; // Azul, Amarelo, Roxo
  const sliceBorderColor = '#000000'; // Borda preta
  const sliceBorderWidth = Math.round(2 * scale); // Largura da borda da fatia

  // Plot Area dimensions e padding. A imagem é quadrada, então vamos tentar centralizar um conteúdo quadrado.
  // A imagem mostra um container quadrado com bordas arredondadas.
  const containerSize = Math.min(width, height);
  const padding = Math.round(containerSize * 0.1); // Aproximadamente 10% de padding em relação ao container menor
  const plotSize = containerSize - 2 * padding;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = plotSize / 2;

  // Dados das fatias (hardcoded para 3 fatias iguais, como na imagem)
  const slices = [
    { value: 1, color: sliceColors[0] },
    { value: 1, color: sliceColors[1] },
    { value: 1, color: sliceColors[2] },
  ];
  const totalValue = slices.reduce((sum, s) => sum + s.value, 0);

  let currentStartAngle = 0;
  const animatedSlices = slices.map((slice, index) => {
    const sliceAngle = (slice.value / totalValue) * 360;
    const targetEndAngle = currentStartAngle + sliceAngle;

    // Animação de rotação/desenho de cada fatia [REGRAS DE ANIMAÇÃO]
    // Rotação em sentido horário — cada fatia entra em sequência (+5 frames de delay)
    const animationStartFrame = 10 + index * 5; // Começa após 10 frames de "respiro", com stagger de 5 frames
    const animationEndFrame = animationStartFrame + 50; // Duração da animação da fatia
    
    // Interpolar o ângulo final da fatia
    const animatedEndAngle = interpolate(
      frame,
      [animationStartFrame, animationEndFrame],
      [currentStartAngle, targetEndAngle],
      {
        extrapolateRight: 'clamp',
        config: SPRING_CONFIG_MAIN,
      }
    );

    const path = describeArc(centerX, centerY, radius, currentStartAngle, animatedEndAngle);
    currentStartAngle = targetEndAngle; // Atualiza para a próxima fatia

    return { ...slice, path, animatedEndAngle, animationStartFrame, animationEndFrame };
  });

  // Animação de entrada geral do gráfico (fade + scale) [REGRAS DE ANIMAÇÃO]
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });
  
  // [REGRA #1 - Borda arredondada do canvas]
  const borderRadius = Math.round(16 * scale); // Baseado na imagem de referência

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        borderRadius: borderRadius, // Borda arredondada do "card" principal
        overflow: 'hidden', // Garante que a borda arredondada seja visível
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Renderiza cada fatia da pizza */}
        {animatedSlices.map((slice, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteger contra paths vazios
          if (slice.path.trim() === `M ${centerX} ${centerY}`) {
            return null; // Não renderiza fatias sem área
          }
          return (
            <path
              key={`slice-${index}`}
              d={slice.path}
              fill={slice.color}
              stroke={sliceBorderColor}
              strokeWidth={sliceBorderWidth}
              strokeLinejoin="round" // Ajuda a suavizar as junções
            />
          );
        })}
      </svg>
    </div>
  );
};
