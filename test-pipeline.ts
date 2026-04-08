import { processImage } from './server/pipeline.js';

const targetFile = "input/error/1775592588757_1775592456_image.png";
console.log(`[TESTE] Executando pipeline manualmente para: ${targetFile}`);

processImage(targetFile)
  .then(res => {
    console.log("✅ Sucesso:", res);
  })
  .catch(err => {
    console.error("❌ Falha:", err);
  });
