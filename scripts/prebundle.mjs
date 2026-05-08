/**
 * Pre-builds the Remotion webpack bundle at Electron build time.
 * Output goes to dist/remotion-bundle/ — referenced by REMOTION_BUNDLE_PATH at runtime.
 */
import { bundle } from '@remotion/bundler';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');

const ENTRY_POINT   = path.join(ROOT, 'remotion-project', 'src', 'index.ts');
const OUTPUT_DIR    = path.join(ROOT, 'dist', 'remotion-bundle');

console.log('📦 [prebundle] Iniciando bundle Remotion...');
console.log('   Entry:', ENTRY_POINT);
console.log('   Output:', OUTPUT_DIR);

if (!fs.existsSync(ENTRY_POINT)) {
  console.error('❌ Entry point não encontrado:', ENTRY_POINT);
  process.exit(1);
}

const bundleLocation = await bundle({
  entryPoint: ENTRY_POINT,
  outDir: OUTPUT_DIR,
  webpackOverride: (config) => {
    config.cache = false;
    return config;
  },
});

console.log('✅ [prebundle] Bundle criado em:', bundleLocation);
