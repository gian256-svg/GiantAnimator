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

// Interface para as fatias da pizza (inferida dos dados visuais)
interface PieSegment {
  value: number; // Percentual ou valor absoluto
  color: string;
}

// Helper para converter coordenadas polares em cartesianas (necessário para desenhar arcos SVG)
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0; // 0 graus no topo, crescendo sentido horário
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper para gerar o path SVG de uma fatia de pizza
const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  if (radius <= 0 || startAngle === endAngle) {
    return `M ${centerX} ${centerY} L ${centerX} ${centerY} Z`; // Retorna um ponto se raio zero ou ângulo zero
  }

  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  const d = [
    "M", centerX, centerY, // Mover para o centro
    "L", start.x, start.y, // Desenhar linha para o ponto inicial do arco
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, // Desenhar o arco
    "Z" // Fechar o path (desenha linha de volta para o centro)
  ].join(" ");

  return d;
};

export const PieChartReference: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A referência tem proporção quadrada, então a escala deve ser baseada no menor lado
  const baseWidth = 1080; // Supondo uma resolução base para um canvas quadrado
  const baseHeight = 1080;
  const scale = Math.min(width / baseWidth, height / baseHeight);

  // Cores extraídas fielmente da imagem de referência [REGRA ABSOLUTA #1, REGRAS DE CORES]
  const backgroundColor = '#F5877E'; // Fundo do canvas
  const borderColor = '#000000'; // Borda das fatias
  const borderWidth = Math.round(2 * scale); // Espessura da borda

  // Dados inferidos da imagem de referência (percentuais e cores)
  const segments: PieSegment[] = [
    { value: 25, color: '#4292F4' }, // Azul
    { value: 35, color: '#FCD34D' }, // Amarelo
    { value: 40, color: '#BF80FF' }, // Roxo/Lilás
  ];

  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);

  // Dimensões do gráfico de pizza
  const centerX = width / 2;
  const centerY = height / 2;
  // O raio é ajustado para deixar um respiro visual, conforme a imagem
  const radius = Math.round(Math.min(width, height) * 0.35); // Aproximadamente 35% do menor lado

  // Animação geral de entrada do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChartReference frame ${frame}.`);

  let currentAngle = 0; // Início no topo (equivalente a 0 graus ou 270 no sistema padrão)

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Cor de fundo fiel à referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Math.round(20 * scale), // Cantos arredondados do contêiner, fiel à imagem
        overflow: 'hidden', // Para que o borderRadius seja visível
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {segments.map((segment, index) => {
          const segmentAngle = (segment.value / totalValue) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + segmentAngle;

          // Animação de cada fatia [REGRAS DE ANIMAÇÃO -> Pie/Donut Chart]
          // Cada fatia entra em sequência, girando em sentido horário
          const animationDelay = 5; // +5 frames de delay entre fatias
          const animationStartFrame = 10 + index * animationDelay; // Atraso para cada fatia
          const animationEndFrame = 60 + index * animationDelay;

          const animatedEndAngle = interpolate(
            frame,
            [animationStartFrame, animationEndFrame],
            [startAngle, endAngle],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN e garantir path válido
          const pathD = describeArc(centerX, centerY, radius, startAngle, animatedEndAngle);

          currentAngle = endAngle; // Atualiza o ângulo para a próxima fatia

          return (
            <path
              key={index}
              d={pathD}
              fill={segment.color} // Cor da fatia fiel à referência
              stroke={borderColor} // Borda preta fiel à referência
              strokeWidth={borderWidth} // Espessura da borda fiel à referência
            />
          );
        })}
      </svg>
    </div>
  );
};
