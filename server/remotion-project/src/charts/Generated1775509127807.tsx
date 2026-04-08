import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (IMUTÁVEIS)
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

// Interface para as fatias da pizza (inferida dos dados visuais da referência)
interface PieSegment {
  value: number;
  color: string;
}

// Helper para converter coordenadas polares em cartesianas, para desenhar o arco SVG
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  // Ajusta o ângulo para que 0 graus esteja no topo (12 horas) e cresça no sentido horário
  // No sistema de coordenadas cartesianas com Y crescendo para baixo, o ângulo 0 é à direita (3 horas).
  // Para começar no topo, ajustamos o ângulo de entrada subtraindo 90 graus.
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper para gerar o path SVG para uma fatia de pizza
const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  // [EDGE CASES E ROBUSTEZ] - Proteger contra raio zero ou ângulo zero
  if (radius <= 0 || startAngle === endAngle) {
    return `M ${centerX} ${centerY} L ${centerX} ${centerY} Z`; // Retorna um ponto (invisível)
  }

  // Coordenadas do início e fim do arco na circunferência
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);

  // Flag para arcos maiores que 180 graus (necessário para SVG)
  const largeArcFlag = endAngle - startAngle >= 180 ? "1" : "0";
  
  // O path do arco:
  // M centerX centerY (Move para o centro)
  // L start.x start.y (Linha do centro até o ponto inicial do arco)
  // A radius radius 0 largeArcFlag 0 end.x end.y (Desenha o arco)
  // Z (Fecha o path, conectando de volta ao centro)
  const pathD = [
    "M", centerX, centerY,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");

  return pathD;
};

export const PieChartReference: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A imagem de referência tem proporção quadrada.
  // Usamos uma resolução base (e.g., 1080x1080) para calcular a escala.
  const baseCanvasSize = 1080;
  const scale = Math.min(width / baseCanvasSize, height / baseCanvasSize);

  // Cores extraídas fielmente da imagem de referência [REGRA #1: Paleta de cores (extrair os hex exatos)]
  const CANVAS_BG_COLOR = '#F5877E'; // Fundo do canvas (vermelho-rosado)
  const PIE_SLICE_COLORS = ['#44A1F6', '#EEC21B', '#C586ED']; // Azul, Amarelo, Roxo
  const PIE_BORDER_COLOR = '#000000'; // Borda das fatias (preto)
  const PIE_BORDER_WIDTH = Math.round(2 * scale); // Espessura da borda (aprox. 2px, escalado)

  // Dimensões e posicionamento do gráfico de pizza
  // O gráfico é centralizado e ocupa a maior parte do contêiner.
  const chartDiameter = Math.min(width, height) * 0.7; // Ocupa ~70% da menor dimensão do canvas
  const radius = chartDiameter / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  // Dados das fatias (inferidos visualmente da imagem, pois não foram fornecidos dados JSON específicos para as fatias)
  const segments: PieSegment[] = [
    { value: 25, color: PIE_SLICE_COLORS[0] }, // Azul (aproximadamente 25%)
    { value: 35, color: PIE_SLICE_COLORS[1] }, // Amarelo (aproximadamente 35%)
    { value: 40, color: PIE_SLICE_COLORS[2] }, // Roxo (aproximadamente 40%)
  ];
  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);

  // Animação geral de entrada do gráfico (fade e scale) [REGRAS DE ANIMAÇÃO]
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });
  
  // [REGRA #1 - Borda arredondada do canvas]
  const CANVAS_BORDER_RADIUS = Math.round(16 * scale); // Baseado na imagem de referência

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering PieChartReference frame ${frame}.`);

  let currentStartingAngle = 0; // Onde a próxima fatia começará a ser desenhada (no sistema de graus)

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: CANVAS_BG_COLOR, // Fundo exato da referência
        borderRadius: CANVAS_BORDER_RADIUS, // Borda arredondada exata da referência
        overflow: 'hidden', // Garante que o borderRadius seja visível
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, "Helvetica Neue", sans-serif', // Fonte padrão
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

        {/* Renderiza cada fatia da pizza */}
        {segments.map((segment, index) => {
          const segmentAngle = totalValue > 0 ? (segment.value / totalValue) * 360 : 0;
          const startAngle = currentStartingAngle;
          const endAngle = currentStartingAngle + segmentAngle;

          // Animação de "desenho" da fatia [REGRAS DE ANIMAÇÃO -> Pie/Donut Chart]
          // Cada fatia entra em sequência, girando em sentido horário.
          const animationDelayPerSlice = 5; // +5 frames de delay entre fatias
          const sliceAnimationStartFrame = 10 + index * animationDelayPerSlice; // Início escalonado
          const sliceAnimationDuration = 50; // Duração do "desenho" de cada fatia

          // O ângulo final interpolado da fatia
          const animatedEndAngle = interpolate(
            frame,
            [sliceAnimationStartFrame, sliceAnimationStartFrame + sliceAnimationDuration],
            [startAngle, endAngle], // Começa no startAngle e vai até o endAngle final
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG path
          const safeAnimatedEndAngle = isNaN(animatedEndAngle) ? startAngle : animatedEndAngle;

          const pathData = describeArc(centerX, centerY, radius, startAngle, safeAnimatedEndAngle);

          currentStartingAngle = endAngle; // Atualiza o ângulo para o início da próxima fatia

          return (
            <path
              key={`slice-${index}`}
              d={pathData}
              fill={segment.color} // Cor da fatia fiel à referência
              stroke={PIE_BORDER_COLOR} // Borda preta fiel à referência
              strokeWidth={PIE_BORDER_WIDTH} // Espessura da borda fiel à referência
            />
          );
        })}
      </svg>
    </div>
  );
};
