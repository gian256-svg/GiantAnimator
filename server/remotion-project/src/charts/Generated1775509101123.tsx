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

// Interface para os dados do gráfico de área
interface AreaChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números (mantido para compatibilidade, mas não usado sem dados)
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  labels, // Não utilizado na renderização atual, mas parte da interface de um AreaChart
  series, // Não utilizado na renderização atual, mas parte da interface de um AreaChart
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRA #1: Replique fielmente]
  // Análise da imagem de referência:
  // - Fundo: Cinza claro. Extraindo HEX: #F2F2F2 (ou similar)
  // - Cor do texto "Simple Area Chart": Cinza escuro. Extraindo HEX: #444444
  // - Sombra do texto: Sutil. Estimativa: 0 1px 1px rgba(0,0,0,0.2)
  // - Fonte: Sans-serif padrão (Inter, Helvetica Neue, Arial)
  // - Tamanho: Relativamente grande, centralizado.

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Cores e estilos extraídos da referência visual [REGRAS DE CORES]
  const backgroundColor = '#F2F2F2';
  const titleColor = '#444444';
  const titleTextShadow = '0 1px 1px rgba(0,0,0,0.2)';
  const titleFontSize = Math.round(28 * scale); // Estimativa de tamanho para o título

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  // [REGRA #1: Replique fielmente] - Atualmente, a imagem de referência mostra APENAS o título.
  // Portanto, o componente irá renderizar apenas o título com os estilos extraídos.
  // Se dados de série fossem fornecidos e uma referência visual completa de Area Chart,
  // esta seção seria expandida para incluir o grid, área, linha e eixos.

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo extraído da referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
      <h1
        style={{
          fontSize: titleFontSize,
          fontWeight: 700,
          color: titleColor, // Cor extraída da referência
          textShadow: titleTextShadow, // Sombra extraída da referência
          margin: 0, // Remover margem padrão do h1
          padding: 0,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>
      {/*
        [EDGE CASES E ROBUSTEZ]
        Este é o placeholder para o gráfico real.
        Como a referência visual forneceu APENAS o título,
        o restante do gráfico (área, eixos, etc.) não é renderizado aqui para
        evitar "melhorar" o design sem ser solicitado, conforme REGRA #1.
        Se `series` tivesse dados e uma referência visual completa,
        o código para renderizar a área, linhas, eixos e grid estaria abaixo.
      */}
      {/*
      {series && series.length > 0 && series[0].data && series[0].data.length > 0 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          // ... Código para renderizar Area Chart completo (eixos, grid, área, linha)
          // Isso seria adicionado apenas com uma referência visual completa de um Area Chart.
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: titleColor,
          fontSize: Math.round(18 * scale),
          marginTop: Math.round(50 * scale), // Abaixo do título
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' })
        }}>
          Sem dados de área para exibir.
        </div>
      )}
      */}
    </div>
  );
};
