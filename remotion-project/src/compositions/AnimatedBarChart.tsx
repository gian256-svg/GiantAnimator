import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Dataset {
  label: string;
  data: number[];
  color: string;
}

interface Props {
  title: string | null;
  xAxisLabel: string | null;
  yAxisLabel: string | null;
  labels: string[];
  datasets: Dataset[];
}

export const AnimatedBarChart: React.FC<Props> = ({
  title,
  xAxisLabel,
  yAxisLabel,
  labels,
  datasets,
}) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
  const { fps } = useVideoConfig();

  // Se datasets for undefined/null/vazio, use fallback default vazio
  const primaryDataset = datasets && datasets.length > 0 ? datasets[0] : { data: [], color: "#29ABE2" };
  const values = primaryDataset.data || [];
  const primaryColor = primaryDataset.color || "#29ABE2";

  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  const contentOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0d1117",
        padding: "80px 100px",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        color: "#ffffff"
      }}
    >
      {/* Título */}
      {title && (
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            opacity: contentOpacity,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}

      {/* Container Principal */}
      <div style={{ display: "flex", flex: 1, marginTop: 40, position: "relative" }}>
        
        {/* Eixo Y */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingRight: 30, opacity: contentOpacity }}>
           {yAxisLabel && (
             <div style={{ position: "absolute", top: -40, left: 0, fontSize: 24, color: "#8b949e", fontWeight: 600 }}>
               {yAxisLabel}
             </div>
           )}
           <div style={{ fontSize: 24, color: "#8b949e" }}>{safeMaxValue}</div>
           <div style={{ fontSize: 24, color: "#8b949e" }}>{Math.round(safeMaxValue / 2)}</div>
           <div style={{ fontSize: 24, color: "#8b949e" }}>0</div>
        </div>

        {/* Área Gráfico */}
        <div style={{ flex: 1, borderLeft: "3px solid #30363d", borderBottom: "3px solid #30363d", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
           
          {values.map((value, index) => {
            const delay = 15 + index * 5;
            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 100 },
            });

            // Altura relativa da barra baseada no maxValue
            // 700 é um height arbritário representativo pra área útil
            const barHeight = interpolate(progress, [0, 1], [0, 700 * (value / safeMaxValue)]);

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: "100%",
                  paddingBottom: 2,
                  width: "100%"
                }}
              >
                {/* Valor acima da barra */}
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 12,
                    opacity: progress,
                  }}
                >
                  {value}
                </div>

                {/* Barra Animada com cor do Dataset ou Azul */}
                <div
                  style={{
                    width: Math.min(100, 1000 / values.length),
                    height: barHeight,
                    backgroundColor: primaryColor,
                    borderRadius: "8px 8px 0 0",
                    boxShadow: "0 0 30px " + primaryColor + "4D",
                  }}
                />

                {/* Label do Eixo X - posicionado fisicamente fora da borderBottom por absolute ou marginTop nfo label */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -50,
                    fontSize: 24,
                    color: "#8b949e",
                    opacity: interpolate(frame, [delay, delay + 15], [0, 1], {
                      extrapolateRight: "clamp",
                    }),
                    whiteSpace: "nowrap",
                    textAlign: "center"
                  }}
                >
                  {labels[index]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Label Geral Eixo X */}
      {xAxisLabel && (
        <div style={{ textAlign: "center", marginTop: 70, fontSize: 30, color: "#8b949e", fontWeight: 600, opacity: contentOpacity }}>
          {xAxisLabel}
        </div>
      )}

    </AbsoluteFill>
  );
};
