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

interface ScatterPlotTitleProps {
  title: string;
}

export const ScatterPlotTitleOnly: React.FC<ScatterPlotTitleProps> = ({ title }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Propriedades extraídas da imagem
  const backgroundColor = '#F2F2F2';
  const textColor = '#4D4D4D';
  const fontSize = Math.round(24 * scale); // Aproximado da referência
  const fontWeight = 400; // Normal, conforme referência
  const padding = Math.round(40 * scale); // Um padding razoável para o título

  // Animação de entrada do título
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const titleScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering ScatterPlotTitleOnly frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        width,
        height,
        padding: padding,
        boxSizing: 'border-box',
        transform: `scale(${titleScale})`,
        opacity: titleOpacity,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          color: textColor,
          fontSize: fontSize,
          fontWeight: fontWeight,
          lineHeight: 1.2,
          // A referência parece ter um "..." no final, indicando truncamento.
          // Replicaremos o texto exato para ser fiel, mas notamos o truncamento no original.
        }}
      >
        {title}
      </div>
    </div>
  );
};
