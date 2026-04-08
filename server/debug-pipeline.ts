import 'dotenv/config';
import { processImage } from './pipeline.js';
import path from 'path';

const targetFile = "../input/error/1775592588757_1775592456_image.png";
console.log(`[DEBUG] Executando pipeline para: ${targetFile}`);

processImage(targetFile)
  .then(res => {
    console.log("✅ Sucesso:", JSON.stringify(res, null, 2));
  })
  .catch(err => {
    console.error("❌ Falha:", err);
  });
