import "dotenv/config";
import path from "path";
import fs from "fs";
import { processImage } from "./pipeline.js";
import { PATHS } from "./paths.js";

/**
 * Smoke Test — Simula o fluxo do Pipeline com uma imagem de teste.
 */
async function runSmokeTest() {
  const TEST_IMAGE = path.join(PATHS.input, "test_bar_chart.png");

  console.log("🚀 Iniciando Smoke Test do Pipeline...");

  if (!fs.existsSync(TEST_IMAGE)) {
    console.error(`❌ Imagem de teste não encontrada: ${TEST_IMAGE}`);
    process.exit(1);
  }

  try {
    // 1. Processar Imagem
    await processImage(TEST_IMAGE);

    // 2. Verificar Output
    const baseName = path.parse(TEST_IMAGE).name;
    const expectedOutput = path.join(PATHS.output, `${baseName}-animated.mp4`);


    if (fs.existsSync(expectedOutput)) {
      console.log(`✅ Fumaça dissipada! MP4 gerado em: ${expectedOutput}`);
    } else {
      console.error(`❌ MP4 não encontrado no destino esperado: ${expectedOutput}`);
    }
  } catch (error) {
    console.error("❌ Smoke Test falhou com erro:", error);
  }
}

runSmokeTest().catch(console.error);
