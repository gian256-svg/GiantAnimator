// server/calibration/render-tester.ts
import path   from "path";
import fs     from "fs";
import os     from "os";
import { bundle }                                   from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import type { ChartType }                           from "./types.js";
import { REFERENCE_CATALOG }                        from "./reference-scraper.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const REMOTION_ENTRY = "c:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/remotion-project/src/index.ts";
const OUT_DIR        = "c:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/server/calibration/renders";

const COMPOSITION_MAP: Record<ChartType, string> = {
  "vertical-bar":   "BarChart",
  "horizontal-bar": "HorizontalBarChart",
  "line":           "LineChart",
  "multi-line":     "MultiLineChart",
  "area":           "AreaChart",
  "pie-donut":      "PieChart",
  "scatter":        "ScatterPlot",
  "waterfall":      "WaterfallChart",
  "candlestick":    "CandlestickChart",
  "heatmap":        "Heatmap",
};

// ─────────────────────────────────────────────────────────────
// Bundle cache — recriado quando um novo .tsx é salvo
// ─────────────────────────────────────────────────────────────
let _bundleUrl:  string | null = null;
let _bundleDir:  string | null = null;   // diretório físico do bundle

export function invalidateBundleCache(): void {
  // ✅ FIX: apaga o diretório físico do bundle anterior
  // Isso força o webpack a recompilar do zero na próxima chamada
  if (_bundleDir && fs.existsSync(_bundleDir)) {
    try {
      fs.rmSync(_bundleDir, { recursive: true, force: true });
      console.log(`🗑️  Bundle anterior removido: ${_bundleDir}`);
    } catch {
      // ignora se ocupado
    }
  }
  _bundleUrl = null;
  _bundleDir = null;
  console.log("🔄 Bundle cache invalidado — próximo render recompila do zero");
}

async function getBundleUrl(): Promise<string> {
  if (_bundleUrl) {
    console.log("📦 Usando bundle cacheado");
    return _bundleUrl;
  }

  // Cria diretório temporário exclusivo para este bundle
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-calib-"));
  _bundleDir   = outDir;

  console.log("📦 Compilando bundle Remotion (pode levar ~30s)...");

  _bundleUrl = await bundle({
    entryPoint:      REMOTION_ENTRY,
    outDir,
    // ✅ Desabilita cache do webpack — garante leitura do .tsx mais recente
    enableCaching:   false,
    webpackOverride: (config: any) => config,
  });

  console.log("✅ Bundle compilado e cacheado");
  return _bundleUrl as string;
}

export async function renderCalibrationStill(
  chartType: ChartType,
  iteration: number
): Promise<string> {
  const compositionId = COMPOSITION_MAP[chartType];
  console.log(`🖼️  [${chartType}] ID: ${compositionId} | Entry: ${REMOTION_ENTRY}`);
  const ref           = REFERENCE_CATALOG[chartType];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const outputPath = path.join(OUT_DIR, `${chartType}-iter${iteration}-still.png`);
  const bundleUrl  = await getBundleUrl();

  console.log(`🖼️  [${chartType}] Calling selectComposition with ID: ${compositionId}`);
  const composition = await selectComposition({
    serveUrl:   bundleUrl,
    id:         compositionId,
    inputProps: ref.sampleData ?? {},
  });

  // Frame seguro: 50% da duração (nunca excede durationInFrames)
  const safeFrame = Math.min(30, Math.floor(composition.durationInFrames * 0.5));
  console.log(`🖼️  [${chartType}] Still → frame ${safeFrame}/${composition.durationInFrames}`);

  await renderStill({
    composition,
    serveUrl:    bundleUrl,
    output:      outputPath,
    inputProps:  ref.sampleData ?? {},
    frame:       safeFrame,
    imageFormat: "png",
    scale:       1,
  });

  console.log(`✅ [${chartType}] Still: ${path.basename(outputPath)}`);
  return outputPath;
}

export async function renderCalibrationVideo(
  chartType: ChartType,
  iteration: number
): Promise<string> {
  const compositionId = COMPOSITION_MAP[chartType];
  const ref           = REFERENCE_CATALOG[chartType];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const outputPath = path.join(OUT_DIR, `${chartType}-iter${iteration}.mp4`);
  const bundleUrl  = await getBundleUrl();

  const composition = await selectComposition({
    serveUrl:   bundleUrl,
    id:         compositionId,
    inputProps: ref.sampleData ?? {},
  });

  console.log(`🎬 [${chartType}] Renderizando vídeo...`);

  await renderMedia({
    composition,
    serveUrl:       bundleUrl,
    codec:          "h264",
    outputLocation: outputPath,
    inputProps:     ref.sampleData ?? {},
    concurrency:    2,
    onProgress: ({ progress }: { progress: number }) => {
      process.stdout.write(`\r  ⏳ [${chartType}] ${Math.round(progress * 100)}%  `);
    },
  });

  console.log(`\n✅ [${chartType}] Vídeo: ${path.basename(outputPath)}`);
  return outputPath;
}
