import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs
// Animação sutil — para o fade e escala do título
const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

// Componente para replicar APENAS o título da imagem
interface TitleOnlyComponentProps {
  titleText: string;
}

export const ScatterPlotTitleOnly: React.FC<TitleOnlyComponentProps> = ({ titleText }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Propriedades visuais extraídas da imagem de referência [REGRA ABSOLUTA #1]
  const backgroundColor = '#F2F2F2';
  const textColor = '#4D4D4D';
  const fontSize = Math.round(24 * scale);
  const fontWeight = 400; // Normal

  // Animação de entrada do título (fade e leve escala)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const titleScale = interpolate(frame, [0, 30], [0.9, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando ScatterPlotTitleOnly frame ${frame}.`);
  console.log(`[${new Date().toISOString()}] GiantAnimator: Atenção: A imagem de referência contém apenas texto. O componente gerado replica fielmente apenas este texto, não um gráfico. Por favor, forneça uma imagem de gráfico para gerar um componente de gráfico completo.`);


  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo extraído da imagem
        fontFamily: 'Inter, "Helvetica Neue", sans-serif', // Fonte padrão GiantAnimator
        display: 'flex',
        justifyContent: 'flex-start', // O texto na imagem parece estar alinhado à esquerda no topo
        alignItems: 'flex-start',
        padding: Math.round(20 * scale), // Pequeno padding para o texto
        width,
        height,
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          color: textColor, // Cor do texto extraída da imagem
          fontSize: fontSize,
          fontWeight: fontWeight,
          margin: 0, // Remover margem padrão do h1
          padding: 0,
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          transformOrigin: 'top left',
          lineHeight: 1.2,
        }}
      >
        {titleText}
      </h1>
    </div>
  );
};

// Este é o componente principal que você usaria, passando o texto da sua imagem
// Exemplo de como seria usado: <ScatterPlotFromReference titleText="Scatter Plot - Definition, Types, An..." />
// Mantenho o nome ScatterPlot para consistência se no futuro a imagem mudar para um gráfico
export const ScatterPlot: React.FC = () => {
    // Apenas encapsulando o componente de título para usar a API de forma consistente
    return <ScatterPlotTitleOnly titleText="Scatter Plot - Definition, Types, An..." />;
};
