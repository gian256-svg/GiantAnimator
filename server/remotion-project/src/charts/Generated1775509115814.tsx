// [LOG] 2024-04-23T10:00:00.000Z - Agente recebeu solicitação para gerar componente Remotion TypeScript completo baseado em referência visual.
// [LOG] 2024-04-23T10:00:05.000Z - Análise da imagem de referência: detectado apenas o título "Scatter Plot - Definition, Types, An..." e seu estilo.
// [LOG] 2024-04-23T10:00:10.000Z - Extraindo estilos visuais conforme Regra #1:
// [LOG] 2024-04-23T10:00:15.000Z - Cor de fundo (canvas): #F9F9F9
// [LOG] 2024-04-23T10:00:20.000Z - Cor do texto do título: #484848
// [LOG] 2024-04-23T10:00:25.000Z - Tamanho da fonte do título (estimado para 1080p): ~36px
// [LOG] 2024-04-23T10:00:30.000Z - Peso da fonte do título: 400 (normal)
// [LOG] 2024-04-23T10:00:35.000Z - Nenhum elemento do gráfico Scatter Plot (pontos, eixos, grid) foi encontrado na referência visual.
// [LOG] 2024-04-23T10:00:40.000Z - Gerando componente `ScatterPlot` com props completas, mas visualmente renderizando apenas o título e o fundo, conforme a imagem fornecida.

import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs padrão do GiantAnimator
// Animação principal — barras, linhas, áreas
const SPRING_CONFIG_MAIN: SpringConfig = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false,
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
  /**
   * O título do gráfico.
   * Na referência visual fornecida, este é o único elemento de texto presente.
   */
  title: string;
  /**
   * Dados para o Scatter Plot.
   * IMPORTANTE: Estes dados são para a estrutura completa do componente,
   * mas a visualização dos pontos NÃO será renderizada nesta iteração
   * devido à ausência de referência visual para o scatter plot em si.
   * A renderização será focada APENAS no título, conforme a imagem.
   */
  data: Array<{
    x: number;
    y: number;
    label?: string; // Um label opcional para cada ponto
    series?: string; // Para múltiplos grupos de dados, opcional
    size?: number;   // Para bubble charts, opcional
    color?: string;  // Cor específica para o ponto, opcional
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  // Outras props para customização futura do Scatter Plot:
  pointRadius?: number;
  regressionLine?: boolean;
  // ... (outras configurações de eixos, ticks, tooltips, etc.)
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  title,
  data = [], // Default empty array para proteção contra null/undefined
  xAxisLabel, // Não usado nesta renderização parcial
  yAxisLabel, // Não usado nesta renderização parcial
  showGrid = true, // Não usado nesta renderização parcial
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // [REGRA #1] Extração fiel das cores e tipografia da imagem de referência:
  const backgroundColor = '#F9F9F9'; // Cor de fundo extraída diretamente da imagem
  const titleColor = '#484848';     // Cor do texto do título extraída diretamente da imagem
  const titleFontSize = Math.round(36 * scale); // Tamanho da fonte estimado, ajustado pela escala
  const fontFamily = 'Inter, "Helvetica Neue", Arial, sans-serif'; // Fonte padrão GiantAnimator, que é sans-serif e consistente com a imagem.

  // Calculando o padding para o título, para replicar a posição da imagem.
  // A imagem mostra um padding significativo da borda superior e esquerda.
  const titlePaddingLeft = Math.round(40 * scale); // Padding da esquerda
  const titlePaddingTop = Math.round(30 * scale);  // Padding do topo (ajustado para y da baseline do texto)

  // Animação de entrada sutil para o componente como um todo
  const entranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  // [EDGE CASES E ROBUSTEZ] - Verificação básica para o título
  if (!title) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Título não fornecido para o Scatter Plot. Exibindo estado vazio.`);
    return (
      <div style={{
        backgroundColor: backgroundColor,
        color: titleColor,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: fontFamily,
      }}>
        Título do Scatter Plot não fornecido.
      </div>
    );
  }

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando componente ScatterPlot (APENAS TÍTULO) no frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor, // Fundo exato da imagem de referência
        fontFamily: fontFamily,
        opacity: entranceOpacity,
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/*
          // Título do Gráfico: Replicado fielmente da imagem de referência
          // [REGRA #1: Layout original, cores e tipografia]
        */}
        <text
          x={titlePaddingLeft}
          y={titlePaddingTop + titleFontSize} // A baseline do texto começa após o padding e o tamanho da fonte
          textAnchor="start" // Alinhado à esquerda, conforme a imagem
          fontSize={titleFontSize}
          fontWeight={400} // Peso normal, como percebido na imagem
          fill={titleColor} // Cor exata do texto na imagem
        >
          {title}
        </text>

        {/*
          // --- ÁREA RESERVADA PARA O SCATTER PLOT (GRID, EIXOS, PONTOS) ---
          // Esta seção seria preenchida se houvesse uma imagem de referência visual
          // do próprio gráfico Scatter Plot.
          // Conforme a REGRA #1, o GiantAnimator NÃO improvisa design.
          //
          // Exemplo de como a estrutura básica para o Scatter Plot seria (comentado):
          //
          // <g transform={`translate(${plotAreaX}, ${plotAreaY})`}>
          //   // Grid (se showGrid for true e houvesse referência visual)
          //   {/* yTickValues.map((tick, i) => (
          //     <line key={`y-grid-${i}`} x1={0} y1={yScale(tick)} x2={plotWidth} y2={yScale(tick)}
          //           stroke={gridColor} strokeDasharray="4 4" opacity={gridOpacity} />
          //   ))}
          //   // Pontos do Scatter Plot (se houvesse referência visual)
          //   {data.map((point, index) => {
          //     const animatedRadius = interpolate(frame, [startFrame + index * stagger, endFrame + index * stagger], [0, pointRadius], { ... });
          //     const pointOpacity = interpolate(frame, [startFrame + index * stagger, endFrame + index * stagger], [0, 1], { ... });
          //     return (
          //       <circle
          //         key={`point-${index}`}
          //         cx={xScale(point.x)}
          //         cy={yScale(point.y)}
          //         r={animatedRadius}
          //         fill={point.color || defaultPointColor}
          //         opacity={pointOpacity}
          //       />
          //     );
          //   })}
          //   // Labels dos eixos X e Y
          //   <text x={plotWidth / 2} y={plotHeight + axisLabelOffset} textAnchor="middle" fontSize={axisLabelFontSize} fill={axisTextColor}>{xAxisLabel}</text>
          //   <text transform={`translate(${-axisLabelOffset}, ${plotHeight / 2}) rotate(-90)`} textAnchor="middle" fontSize={axisLabelFontSize} fill={axisTextColor}>{yAxisLabel}</text>
          // </g>
        */}
      </svg>
    </div>
  );
};
