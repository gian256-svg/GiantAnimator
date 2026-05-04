import "dotenv/config";
import path from "path";
import { analyzeChartImage } from "./visionService.js";
import { PATHS } from "./paths.js";

async function test() {
  const imagePath = path.join(PATHS.input, "final_surgery_test.png");
  console.log("🔍 Analisando:", imagePath);
  const analysis = await analyzeChartImage(imagePath);
  console.log("✅ Resultado:");
  console.log(JSON.stringify(analysis, null, 2));
}

test().catch(console.error);
