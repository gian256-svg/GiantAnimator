import { renderChart } from "./renderService.js";
import path from "path";
import { fileURLToPath } from "url";
import { PATHS } from "./paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const filename = process.argv[2] || "calibration-h-1-v2.png";
  const image = path.join(PATHS.input, filename);

  console.log(`🚀 Iniciando render de teste manual: ${image}`);
  try {
    // Exemplo de props para o render manual (deve ser ajustado conforme o tipo do gráfico)
    const result = await renderChart("BarChart", {
        title: "Manual Render Test",
        data: [{ label: "A", value: 10 }, { label: "B", value: 20 }]
    });
    console.log("✅ Render concluído:", result);
  } catch (err: any) {
    console.error("❌ Falha no render:", err.message);
  }
}

main();
