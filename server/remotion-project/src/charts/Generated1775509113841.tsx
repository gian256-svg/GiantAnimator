import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';
import { pie, arc, PieArcDatum } from 'd3-shape'; // Utiliza d3-shape para gerar os caminhos das fatias

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

// Interface para os dados de cada fatia do gráfico de pizza
interface PieSliceData {
  value: number; // O valor da fatia
  color: string; // A cor da fatia (extraída da referência)
}

interface PieChartProps {
  data: PieSliceData[];
  // O título e outros elementos não estão presentes na referência visual, então não os incluiremos.
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  // A referência sugere um canvas quadrado, então assumimos 1080x1080 como base
  const baseCanvasSize = 1080;
  const scale = Math.min(width / baseCanvasSize, height / baseCanvasSize);

  // Cores extraídas diretamente da imagem de referência [REGRA #1 - Fidelidade e REGRAS DE CORES]
  const backgroundColor = '#F38D8D'; // Cor de fundo do canvas

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0 || data.every(d => d.value === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty for PieChart. Displaying fallback.`);
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
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  // Cálculos de layout e raio do gráfico de pizza
  // O gráfico de pizza ocupa cerca de 60-70% do espaço, centralizado.
  const pieChartSize = Math.min(width, height) * 0.65;
  const outerRadius = pieChartSize / 2;
  const strokeWidth = Math.round(2 * scale); // Largura do traço, extraída da referência

  const centerX = width / 2;
  const centerY = height / 2;

  // Gerador de pie chart da d3-shape
  const pieGenerator = pie<PieSliceData>()
    .value(d => d.value)
    .sort(null); // Mantém a ordem dos dados conforme fornecido

  // Gerador de arco para cada fatia
  const arcGenerator = arc<any, PieArcDatum<PieSliceData>>()
    .innerRadius(0) // Gráfico de pizza completo (não donut)
    .outerRadius(outerRadius);

  // Animação geral do gráfico (fade + scale) [REGRAS DE ANIMAÇÃO]
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
        backgroundColor: backgroundColor, // Fundo exato da referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${centerX}, ${centerY})`}>
          {pieGenerator(data).map((sliceData, index) => {
            // Animação de rotação/desenho da fatia [REGRAS DE ANIMAÇÃO]
            // Cada fatia entra sequencialmente (+5 frames de delay)
            const startFrame = 10 + index * 5; // Início escalonado
            const endFrame = startFrame + 40; // Duração da animação da fatia

            const animatedEndAngle = interpolate(
              frame,
              [startFrame, endFrame],
              [sliceData.startAngle, sliceData.endAngle], // Anima o endAngle do startAngle até o endAngle final
              {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_MAIN,
              }
            );

            // [EDGE CASES E ROBUSTEZ] - Proteger contra valores inválidos no path
            const safePathD = arcGenerator({
              ...sliceData,
              endAngle: animatedEndAngle, // Usa o ângulo animado
            });

            return (
              <path
                key={index}
                d={safePathD || ''} // Fallback para string vazia se safePathD for nulo
                fill={sliceData.data.color} // Cor exata da fatia
                stroke="#000000" // Cor da borda exata da referência
                strokeWidth={strokeWidth}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// Dados inferidos da imagem para demonstração (não fornecidos pelo usuário, mas necessários para gerar o componente)
// [REGRA #1 - Não improvise design, mas use dados plausíveis para gerar a estrutura]
const inferredData: PieSliceData[] = [
  { value: 30, color: '#3D99F8' }, // Azul
  { value: 35, color: '#E2BA32' }, // Amarelo
  { value: 35, color: '#B87EE4' }, // Roxo
];

// Exemplo de uso do componente no arquivo de composição (Composition.tsx)
/*
import { Composition } from 'remotion';
import { PieChart, inferredData } from './PieChart'; // Ajuste o caminho conforme necessário

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PieChart"
        component={PieChart}
        durationInFrames={90}
        fps={30}
        width={1080} // Assumindo canvas quadrado para combinar com a referência
        height={1080}
        defaultProps={{
          data: inferredData,
        }}
      />
    </>
  );
};
*/
