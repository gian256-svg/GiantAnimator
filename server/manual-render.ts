import { renderFromImage } from "./render.js";
import path from "path";
import { PATHS } from "./paths.js";

async function main() {
  const filename = process.argv[2] || "calibration-h-1-v2.png";
  const image = path.join(PATHS.input, filename);


  const output = `${path.basename(filename, path.extname(filename))}.mp4`;
  console.log(`🚀 Iniciando render de teste: ${image}`);
  try {
    await renderFromImage(image, output);
    console.log("✅ Render concluído com sucesso!");
  } catch (err: any) {
    console.error("❌ Falha no render:", err.message);
  }
}

main();
