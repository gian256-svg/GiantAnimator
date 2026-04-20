import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import fs from 'fs';
import { PATHS } from './paths.js';

// ✅ Caminhos Base
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const REMOTION_ROOT = path.join(PROJECT_ROOT, 'remotion-project');
const ENTRY_POINT = path.join(REMOTION_ROOT, 'src/index.ts');
const OUTPUT_DIR = PATHS.output;

// ✅ Cache do Bundle
let cachedBundleLocation: string | null = null;
let isBundling = false;

/**
 * Cria ou recupera o bundle do Remotion
 */
async function getBundle(): Promise<string> {
  if (cachedBundleLocation) return cachedBundleLocation;

  if (isBundling) {
    while (isBundling) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (cachedBundleLocation) return cachedBundleLocation;
    }
  }

  isBundling = true;
  try {
    console.log('📦 Criando bundle...');
    const bundleLocation = await bundle({
      entryPoint: ENTRY_POINT,
      webpackOverride: (config) => config,
    });
    
    cachedBundleLocation = bundleLocation;
    console.log('✅ Bundle criado');
    return bundleLocation;
  } catch (err: any) {
    console.error('❌ Erro ao criar bundle:', err.message);
    throw err;
  } finally {
    isBundling = false;
  }
}

/**
 * Renderiza um gráfico e retorna o caminho do arquivo gerado
 */
export async function renderChart(
  compositionId: string,
  inputProps: any
): Promise<string> {
  try {
    // Garantir pasta de output
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const outputFilename = `render-${timestamp}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // 1. Obter Bundle
    const bundleLocation = await getBundle();

    // 2. Selecionar Composição
    console.log(`🎬 Selecionando composição: ${compositionId}`);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // CORREÇÃO CRÍTICA (4K UHD)
    composition.durationInFrames = 600;
    composition.fps = 30;
    composition.width = 3840;
    composition.height = 2160;

    // 3. Renderizar
    console.log('🎥 Renderizando...');
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    console.log(`✅ Render concluído: ${outputPath}`);
    return outputPath;
  } catch (err: any) {
    console.error('❌ Erro no render service:', err.message);
    throw err;
  }
}

/**
 * Gera um frame estático para auditoria de fidelidade
 */
export async function generateStill(
  compositionId: string,
  inputProps: any,
  frame: number = 480  // FIX: Capturar frame 480 (16s) — APÓS todas animações completarem (~270f)
): Promise<string> {
  try {
    const bundleLocation = await getBundle();
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // Forçar resolução UHD e garantir que o frame 480 existe na composição
    composition.width = 3840;
    composition.height = 2160;
    composition.durationInFrames = Math.max(composition.durationInFrames, 600);
    
    // Garante que o frame de auditoria não excede a duração total
    const auditFrame = Math.min(frame, composition.durationInFrames - 1);

    const outputFilename = `still-${Math.floor(Date.now() / 1000)}.png`;
    const cacheDir = PATHS.cache || path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const outputPath = path.join(cacheDir, outputFilename);

    console.log(`📸 [STILL] Capturando frame ${auditFrame} de ${composition.durationInFrames} (composição: ${compositionId})`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outputPath,
      frame: auditFrame,
      inputProps,
    });

    return outputPath;
  } catch (err: any) {
    console.error('❌ Erro ao gerar still:', err.message);
    throw err;
  }
}
