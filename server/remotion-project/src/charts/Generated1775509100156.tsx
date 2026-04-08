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

interface ScatterPlotProps {
  // Para este caso, o componente só replica o texto da imagem.
  // Em um cenário real de Scatter Plot, esperaria-se:
  // title?: string; // Título opcional, se diferente do texto da imagem
  // xAxisLabel?: string;
  // yAxisLabel?: string;
  // series: Array<{
  //   label: string;
  //   data: Array<{ x: number; y: number; size?: number }>; // size para bubble charts
  // }>;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Cores e tipografia extraídas da imagem de referência [REGRA #1 - REPLICAR FIELMENTE]
  const backgroundColor = '#F5F5F5'; // Cinza claro do fundo da imagem
  const textColor = '#333333';       // Cinza escuro do texto da imagem
  const fontSize = Math.round(28 * scale); // Tamanho estimado do texto
  const fontFamily = 'Roboto, Arial, sans-serif'; // Fonte sans-serif comum, próxima da imagem

  // Animação de entrada sutil para o texto
  const textOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const textScale = interpolate(frame, [0, 30], [0.9, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering ScatterPlot (title only, as per reference image) frame ${frame}.`);
  console.log(`[${new Date().toISOString()}] GiantAnimator: Atenção: A imagem de referência fornecida contém apenas um título de texto, e não um gráfico de dispersão. O componente gerado replica fielmente o texto.`);


  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor,
        fontFamily: fontFamily,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
      }}
    >
      {/* O único elemento visual na imagem de referência é este título */}
      <h1
        style={{
          color: textColor,
          fontSize: fontSize,
          fontWeight: 500, // Peso visual médio, próximo da imagem
          transform: `scale(${textScale})`,
          opacity: textOpacity,
          transformOrigin: 'center center',
          textAlign: 'center',
          padding: `0 ${Math.round(40 * scale)}px`, // Para garantir respiro
          // Note: O texto original tem reticências ("An..."), replicando-o fielmente
        }}
      >
        Scatter Plot - Definition, Types, An...
      </h1>

      {/*
        Comentário: O espaço para um Scatter Plot real seria renderizado aqui,
        mas como a imagem de referência não continha elementos de gráfico,
        não há nada para replicar fielmente além do título.

        Se você puder fornecer uma imagem de referência de um Scatter Plot real,
        com seus pontos, eixos, cores, etc., poderei gerar o componente completo.
      */}
    </div>
  );
};
