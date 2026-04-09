import fs from "fs";
import path from "path";
import { ai } from "./agent.js";
import { GEMINI_MODEL } from "./calibration/constants.js";
import { COMPONENT_REGISTRY, type ComponentEntry } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { renderChart } from "./renderService.js";
import sharp from "sharp";
import crypto from "crypto";
import { type ChartAnalysis } from "./types.js";
import { PATHS } from "./paths.js";

import { analyzeChartImage } from "./visionService.js";

/**
 * Pipeline Principal — Da imagem ao MP4.
 */
export async function processImage(imagePath: string): Promise<{
  outputFile: string;
  props: any;
  componentId: string;
  reasoning: string;
  duration: number;
}> {
  const start = Date.now();
  const fileName = path.basename(imagePath);
  console.log(`📸 Lendo imagem: ${fileName}`);

  try {
    const analysis = await analyzeChartImage(imagePath);
    const { componentId, props, reasoning } = analysis;
    const outputPath = await renderChart(componentId, props);

    await moveToDone(imagePath);

    const duration = (Date.now() - start) / 1000;
    return {
      outputFile: path.basename(outputPath),
      props,
      componentId,
      reasoning,
      duration: parseFloat(duration.toFixed(1))
    };

  } catch (error) {
    console.error(`❌ Pipeline Erro:`, error);
    throw error;
  }
}

async function moveToDone(filePath: string) {
  // Se for parte do Gauntlet (input/real), não movemos para preservar a estrutura
  const normalizedPath = path.resolve(filePath);
  if (normalizedPath.includes(path.join('input', 'real'))) {
    console.log(`ℹ️ [GAUNTLET] Preservando imagem original: ${path.basename(filePath)}`);
    return;
  }

  const fileName = path.basename(filePath);
  const destPath = path.join(PATHS.done, fileName);
  try {
    fs.renameSync(filePath, destPath);
  } catch (err) {}
}
