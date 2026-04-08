import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';

const ROOT = 'C:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/remotion-project';
const ENTRY = `${ROOT}/src/index.ts`;
const OUTPUT = 'C:/temp/output-teste.mp4';

const inputProps = {
  title: "Teste",
  data: [{ label: "A", value: 42 }]
};

console.log('📦 Criando bundle Webpack...');

const bundleLocation = await bundle({
  entryPoint: ENTRY,
  webpackOverride: (config) => config,
});

console.log('✅ Bundle criado:', bundleLocation);
console.log('🎬 Selecionando composição...');

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: 'BarChart',
  inputProps,
});

console.log('🎥 Iniciando render...');

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: OUTPUT,
  inputProps,
});

console.log('✅ Render concluído:', OUTPUT);
