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
    const rawImageData = fs.readFileSync(imagePath);
    
    // MD5 & Cache
    const hash = crypto.createHash("md5").update(rawImageData).digest("hex");
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const cacheFile = path.join(cacheDir, `${hash}.json`);
    let analysis: any = null;

    if (fs.existsSync(cacheFile) && !process.env.GEMINI_MOCK) {
      console.log(`📦 [CACHE] Usando resultado cacheado: ${fileName}`);
      analysis = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    } else if (process.env.GEMINI_MOCK === "true") {
      analysis = {
        componentId: "BarChart",
        props: {
          data: [{ label: "Mock A", value: 40 }, { label: "Mock B", value: 80 }],
          title: "Mock Chart",
          colors: ["#7c6aff", "#00d4ff"]
        },
        reasoning: "MOCK"
      };
    } else {
      const optimizedBuffer = await sharp(rawImageData)
        .resize(800, 600, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
      
      const imageBase64 = optimizedBuffer.toString("base64");

      const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
      const prompt = buildImageAnalysisPrompt(registryJson);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL || "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: imageBase64, mimeType: "image/png" } },
              { text: prompt }
            ]
          }
        ]
      });

      const responseText = response.text ?? "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`Sem JSON na resposta.`);
      
      analysis = JSON.parse(jsonMatch[0]) as ChartAnalysis;
      fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
    }

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
  const fileName = path.basename(filePath);
  const destPath = path.join(PATHS.done, fileName);
  try {
    fs.renameSync(filePath, destPath);
  } catch (err) {}
}
