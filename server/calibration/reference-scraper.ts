// server/calibration/reference-scraper.ts
// Coleta referências de animação do Jitter e YouTube
// ⚠️  YouTube: usa yt-dlp em qualidade baixa (480p) para economizar tempo

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import type { ChartType, ReferenceData } from "./types";

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────────────
// Referências estáticas catalogadas do Jitter e YouTube
// ─────────────────────────────────────────────────────────────────────────────
export const REFERENCE_CATALOG: Record<ChartType, ReferenceData> = {
  "vertical-bar": {
    chartType:   "vertical-bar",
    source:      "jitter",
    url:         "https://jitter.video/templates/charts/",
    description: "Animated Bar Chart — crescimento bottom-up com stagger",
    animationNotes: [
      "Barras crescem de baixo para cima individualmente",
      "Stagger visível entre barras consecutivas (~6 frames)",
      "Leve bounce no final (spring elástico profissional)",
      "Labels aparecem após a barra atingir altura final",
    ],
    visualNotes: [
      "barW ≈ 58% do espaço disponível por coluna",
      "Grid horizontal tracejado com baixa opacidade",
      "Gradiente vertical na barra (topo sólido → base semi-transparente)",
    ],
    sampleData: {
      data: [
        { label: "Jan", value: 420 },
        { label: "Fev", value: 890 },
        { label: "Mar", value: 650 },
        { label: "Abr", value: 1200 },
        { label: "Mai", value: 980 },
      ],
    },
  },

  "horizontal-bar": {
    chartType:   "horizontal-bar",
    source:      "jitter",
    url:         "https://jitter.video/templates/charts/",
    description: "Multiple Bar Chart — barras horizontais com multi-dataset",
    animationNotes: [
      "Barras crescem da esquerda para a direita",
      "Stagger por linha (não por dataset)",
      "MIN_ROW_HEIGHT = 52px garantido",
    ],
    visualNotes: [
      "dataLabelPosition configurável",
      "Multi-dataset: cores distintas por série",
    ],
    sampleData: {
      datasets: [
        {
          label: "2023",
          data: [
            { label: "Norte",  value: 320 },
            { label: "Sul",    value: 540 },
            { label: "Leste",  value: 280 },
          ],
        },
      ],
    },
  },

  "line": {
    chartType:   "line",
    source:      "jitter",
    url:         "https://jitter.video/templates/charts/",
    description: "Animated Line Chart — draw esquerda→direita",
    animationNotes: [
      "Linha se desenha progressivamente da esquerda para a direita",
      "Marcador circular segue a ponta da linha em tempo real",
      "Dots aparecem com pop (scale 0→1.2→1) logo após a linha passar",
      "Duração total: 1500–2000ms para série completa",
    ],
    visualNotes: [
      "Área preenchida com gradiente descendente (opacidade 0.5→0.1)",
      "Espessura da linha: 3–5px",
      "Labels apenas em máximo, mínimo e ponto final",
    ],
    sampleData: {
      data: [
        { label: "Jan", value: 100 },
        { label: "Fev", value: 250 },
        { label: "Mar", value: 180 },
        { label: "Abr", value: 420 },
        { label: "Mai", value: 380 },
        { label: "Jun", value: 510 },
      ],
    },
  },

  "multi-line": {
    chartType:   "multi-line",
    source:      "jitter",
    url:         "https://jitter.video/templates/charts/",
    description: "Multiple Line Chart — múltiplas séries com stagger",
    animationNotes: [
      "Cada linha aparece sequencialmente (stagger entre séries)",
      "Mesma animação draw da linha simples",
      "Legenda aparece junto com cada linha",
    ],
    visualNotes: [
      "Cores distintas por série da paleta THEME.chartColors",
      "Labels inline omitidos quando > 3 séries",
      "clipPath obrigatório para todas as linhas",
    ],
    sampleData: {
      series: [
        { label: "Produto A", color: "#6C63FF", data: [100, 200, 150, 300, 250] },
        { label: "Produto B", color: "#FF6584", data: [80,  160, 200, 180, 320] },
        { label: "Produto C", color: "#43E97B", data: [120, 90,  170, 260, 200] },
      ],
      labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
    },
  },

  "area": {
    chartType:   "area",
    source:      "jitter",
    url:         "https://jitter.video/templates/charts/",
    description: "Area Chart — área preenchida animada",
    animationNotes: [
      "Área surge simultaneamente com a linha (draw + fill juntos)",
      "Fill aparece com fade-in sincronizado ao progresso da linha",
    ],
    visualNotes: [
      "Gradiente obrigatório: opacidade 0.5 no topo → 0.1 na base",
      "Linha sobre a área com strokeWidth 3–5px",
    ],
    sampleData: {
      data: [
        { label: "Jan", value: 200 },
        { label: "Fev", value: 450 },
        { label: "Mar", value: 320 },
        { label: "Abr", value: 580 },
        { label: "Mai", value: 490 },
        { label: "Jun", value: 720 },
      ],
    },
  },

  "pie-donut": {
    chartType:   "pie-donut",
    source:      "jitter",
    url:         "https://jitter.video/templates/charts/",
    description: "Animated Donut Chart — abertura de fatias sequencial",
    animationNotes: [
      "Fatias abrem sequencialmente (stagger de 8 frames)",
      "Animação de sweep: arco cresce de 0° até o ângulo final",
      "Total central aparece com fade após todas as fatias",
    ],
    visualNotes: [
      "Raio do donut: 35–40% da menor dimensão",
      "Espessura do anel: ~25% do raio",
      "Labels: percentual externo ou interno dependendo do tamanho da fatia",
    ],
    sampleData: {
      data: [
        { label: "Produto A", value: 35, color: "#6C63FF" },
        { label: "Produto B", value: 25, color: "#FF6584" },
        { label: "Produto C", value: 20, color: "#43E97B" },
        { label: "Outros",    value: 20, color: "#F7971E" },
      ],
    },
  },

  "scatter": {
    chartType:   "scatter",
    source:      "youtube",
    url:         "https://www.youtube.com/watch?v=Bm652LjBAyE&list=PL5ZlXxM-0LTEfsuDfvh7QBRZI1gq5vWTo",
    description: "Scatter Plot — pontos animados com stagger",
    animationNotes: [
      "Pontos aparecem com pop (scale 0→1→1) em stagger",
      "Delay progressivo por índice",
      "Linha de tendência opcional aparece após os pontos",
    ],
    visualNotes: [
      "Grid X e Y (único gráfico com grade vertical)",
      "Raio dos pontos: 6–8px",
      "Eixos X e Y com labels",
    ],
    sampleData: {
      data: Array.from({ length: 20 }, (_, i) => ({
        x: Math.round(Math.random() * 100),
        y: Math.round(Math.random() * 100),
        label: `P${i + 1}`,
      })),
    },
  },

  "waterfall": {
    chartType:   "waterfall",
    source:      "youtube",
    url:         "https://www.youtube.com/watch?v=Bm652LjBAyE&list=PL5ZlXxM-0LTEfsuDfvh7QBRZI1gq5vWTo",
    description: "Waterfall Chart — barras acumulativas positivas/negativas",
    animationNotes: [
      "Cada barra cresce a partir da posição acumulada anterior",
      "Cores distintas: verde (positivo) / vermelho (negativo) / cinza (total)",
      "Linhas de conexão aparecem após cada barra",
      "Stagger de 8 frames entre barras",
    ],
    visualNotes: [
      "Linha baseline no zero (não necessariamente na base do gráfico)",
      "Labels com valor delta (+/-) dentro ou acima de cada barra",
    ],
    sampleData: {
      data: [
        { label: "Início",    value: 1000, type: "total"    },
        { label: "Vendas",    value: 420,  type: "positive" },
        { label: "Devoluções",value: -80,  type: "negative" },
        { label: "Custos",    value: -200, type: "negative" },
        { label: "Outros",    value: 60,   type: "positive" },
        { label: "Final",     value: 1200, type: "total"    },
      ],
    },
  },

  "candlestick": {
    chartType:   "candlestick",
    source:      "youtube",
    url:         "https://www.youtube.com/watch?v=Bm652LjBAyE&list=PL5ZlXxM-0LTEfsuDfvh7QBRZI1gq5vWTo",
    description: "Candlestick Chart — OHLC financeiro animado",
    animationNotes: [
      "Candles crescem a partir da linha de abertura",
      "Wicks (sombras) aparecem após o corpo do candle",
      "Cores: verde (alta) / vermelho (baixa)",
      "Stagger de 4 frames entre candles",
    ],
    visualNotes: [
      "Corpo: ~60% da largura da coluna",
      "Wick centralizado horizontalmente no corpo",
      "Grid horizontal tracejado",
    ],
    sampleData: {
      data: [
        { date: "01/04", open: 100, high: 115, low: 95,  close: 110 },
        { date: "02/04", open: 110, high: 120, low: 105, close: 108 },
        { date: "03/04", open: 108, high: 125, low: 100, close: 122 },
        { date: "04/04", open: 122, high: 130, low: 118, close: 119 },
        { date: "05/04", open: 119, high: 135, low: 115, close: 132 },
      ],
    },
  },

  "heatmap": {
    chartType:   "heatmap",
    source:      "youtube",
    url:         "https://www.youtube.com/watch?v=Bm652LjBAyE&list=PL5ZlXxM-0LTEfsuDfvh7QBRZI1gq5vWTo",
    description: "Heatmap — grid 2D com intensidade de cor animada",
    animationNotes: [
      "Células aparecem em wave (diagonal ou linha a linha)",
      "Fade-in por célula com stagger progressivo",
      "Intensidade da cor cresce junto com o fade",
    ],
    visualNotes: [
      "Escala de cor: branco/amarelo (baixo) → laranja/vermelho (alto)",
      "Labels X e Y nos eixos",
      "Valor numérico dentro de cada célula (se espaço permitir)",
    ],
    sampleData: {
      xLabels: ["Seg", "Ter", "Qua", "Qui", "Sex"],
      yLabels: ["Manhã", "Tarde", "Noite"],
      data: [
        [10, 40, 30, 80, 20],
        [60, 90, 45, 70, 55],
        [30, 20, 85, 40, 65],
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Downloader de vídeo YouTube (qualidade baixa)
// Requer yt-dlp instalado: pip install yt-dlp
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadYouTubeReference(
  chartType: ChartType,
  outputDir: string
): Promise<string | null> {
  const ref = REFERENCE_CATALOG[chartType];
  if (ref.source !== "youtube") return null;

  const outputPath = path.join(outputDir, `${chartType}-reference.mp4`);

  if (fs.existsSync(outputPath)) {
    console.log(`📹 [${chartType}] Referência YouTube já existe — pulando download`);
    return outputPath;
  }

  console.log(`⬇️  [${chartType}] Baixando referência YouTube em 480p...`);

  try {
    // ✅ 480p — baixa qualidade para não demorar
    await execAsync(
      `yt-dlp -f "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]" ` +
      `--merge-output-format mp4 ` +
      `-o "${outputPath}" ` +
      `"${ref.url}"`
    );
    console.log(`✅ [${chartType}] Download concluído: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`⚠️  [${chartType}] Download falhou (yt-dlp não instalado?):`, err);
    return null;
  }
}
