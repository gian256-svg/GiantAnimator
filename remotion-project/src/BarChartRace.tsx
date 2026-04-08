import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { Theme } from './theme';

interface BarChartRaceProps {
  title?: string;
  data: {
    labels: string[];
    periods: string[];
    values: number[][]; // [participant][period]
    colors?: string[];
    images?: string[];
  };
  topN?: number;
  transitionFrames?: number;
}

export const BarChartRace: React.FC<BarChartRaceProps> = ({
  title = "Bar Chart Race",
  data,
  topN = 10,
  transitionFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const { labels, periods, values, colors, images } = data;
  const numPeriods = periods.length;
  const numParticipants = labels.length;

  // Parâmetros de Layout (Breathing Room - Ciclo 35.4)
  const padding = Theme.spacing.padding;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2 - 100; // Espaço para título
  const barHeight = (chartHeight / topN) * 0.8;
  const barGap = (chartHeight / topN) * 0.2;

  // Cálculo do período atual e progresso
  // Distribuir períodos ao longo de (600 - 60) frames (margem final)
  const totalPlayFrames = 540; 
  const framesPerPeriod = Math.floor(totalPlayFrames / (numPeriods - 1));
  
  const currentPeriodProgress = frame / framesPerPeriod;
  const periodIndex = Math.min(Math.floor(currentPeriodProgress), numPeriods - 2);
  const nextPeriodIndex = periodIndex + 1;
  const interpolationFactor = Math.min(Math.max((frame % framesPerPeriod) / transitionFrames, 0), 1);
  const smoothFactor = Easing.inOut(Easing.quad)(interpolationFactor);

  // Calcular valores interpolados e rankings para o frame atual
  const currentValues = labels.map((_, i) => {
    const vStart = values[i][periodIndex];
    const vEnd = values[i][nextPeriodIndex];
    // Usar smoothFactor para transição de valor
    return vStart + (vEnd - vStart) * smoothFactor;
  });

  // Ranking
  const rankedData = labels.map((label, j) => ({
    label,
    value: currentValues[j],
    color: colors?.[j] || Theme.colors.categorical[j % Theme.colors.categorical.length],
    image: images?.[j],
    index: j,
  }))
  .sort((a, b) => b.value - a.value);

  // Mapear posição Y para cada participante
  const positions = new Array(numParticipants).fill(-1);
  rankedData.forEach((item, rank) => {
    positions[item.index] = rank;
  });

  // Valor máximo para escala do eixo X (Anima junto)
  const maxValue = Math.max(...currentValues) * 1.1;

  return (
    <AbsoluteFill style={{ backgroundColor: Theme.colors.background, padding }}>
      {/* Título (Ciclo 35.2 - Entrada 0-15f) */}
      <h1 style={{
        ...Theme.typography.title,
        textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1]),
        transform: `translateY(${interpolate(frame, [0, 15], [20, 0])}px)`,
      }}>
        {title}
      </h1>

      <div style={{ position: 'relative', width: chartWidth, height: chartHeight, marginTop: 40 }}>
        {/* Eixo X e Gridlines sutis */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, k) => (
          <div key={k} style={{
            position: 'absolute',
            left: `${p * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: Theme.colors.grid,
            opacity: interpolate(frame, [5, 25], [0, 0.2]),
          }}>
            <span style={{
              ...Theme.typography.axis,
              position: 'absolute',
              bottom: -25,
              transform: 'translateX(-50%)',
            }}>
              {Math.round(p * maxValue)}
            </span>
          </div>
        ))}

        {/* Barras */}
        {labels.map((label, l) => {
          const rank = positions[l];
          if (rank >= topN + 1) return null; 

          const yPos = rank * (barHeight + barGap);
          const barWidth = (currentValues[l] / maxValue) * chartWidth;
          const opacity = interpolate(rank, [topN - 1, topN], [1, 0], { extrapolateRight: 'clamp' });

          return (
            <div
              key={label}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: barWidth,
                height: barHeight,
                backgroundColor: colors?.[l] || Theme.colors.categorical[l % Theme.colors.categorical.length],
                transform: `translateY(${yPos}px)`,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '0 4px 4px 0',
                opacity: interpolate(frame, [15, 30], [0, opacity], { extrapolateLeft: 'clamp' }),
                transition: rank < topN ? `transform ${transitionFrames/fps}s ease-in-out` : 'none',
              }}
            >
              {/* Image/Icon (Feature Avançada) */}
              {images?.[l] && (
                <div style={{
                  width: barHeight * 0.8,
                  height: barHeight * 0.8,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  marginLeft: 5,
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                   <img src={images[l]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Label do participante */}
              <span style={{
                ...Theme.typography.category,
                position: 'absolute',
                right: '100%',
                marginRight: 10,
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>

              {/* Valor Counter Animado (Regra Crítica) */}
              <span style={{
                ...Theme.typography.value,
                position: 'absolute',
                left: '100%',
                marginLeft: 10,
              }}>
                {Math.round(currentValues[l]).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Label Temporal (Timestamp - Ciclo 30) */}
      <div style={{
        ...Theme.typography.timestamp,
        position: 'absolute',
        bottom: padding,
        right: padding,
      }}>
        {periods[periodIndex]}
      </div>
    </AbsoluteFill>
  );
};
