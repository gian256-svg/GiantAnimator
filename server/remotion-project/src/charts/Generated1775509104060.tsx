import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs
// Animação sutil — linhas de grid, fade, e para este título
const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

// Interface para um gráfico de área (não utilizada para renderizar o gráfico neste componente,
// mas incluída para demonstrar os dados esperados caso um gráfico completo fosse gerado)
interface AreaChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

export const SimpleAreaChartTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // [REGRAS DE CORES] - Extraídas fielmente da imagem de referência
  const backgroundColor = '#F5F5F5';
  const textColor = '#444444';
  const textShadow = '1px 1px 2px rgba(0,0,0,0.3)'; // Sombra sutil extraída da imagem

  // [REGRAS DE TIPOGRAFIA E LABELS]
  const titleText = "Simple Area Chart";
  const titleFontSize = Math.round(24 * scale); // Tamanho ajustado para um título típico

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada suave para o texto (fade + leve scale)
  const textOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const textScale = interpolate(frame, [0, 30], [0.9, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering SimpleAreaChartTitle frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo extraído da imagem
        fontFamily: 'Inter, "Helvetica Neue", sans-serif', // Fonte padrão GiantAnimator
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
      }}
    >
      <h1
        style={{
          color: textColor, // Cor do texto extraída da imagem
          fontSize: titleFontSize,
          fontWeight: 700, // Títulos geralmente são bold
          textShadow: textShadow, // Sombra extraída da imagem
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          transformOrigin: 'center center',
          margin: 0, // Remover margens padrão do h1
        }}
      >
        {titleText}
      </h1>
    </div>
  );
};
