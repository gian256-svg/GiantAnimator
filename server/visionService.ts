import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import { ai } from "./agent.js";
import { GEMINI_MODEL_VISION } from "./calibration/constants.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { type ChartAnalysis } from "./types.js";

/**
 * Serviço de Visão Compartilhado para análise de imagens de gráficos.
 */
export async function analyzeChartImage(imagePath: string): Promise<ChartAnalysis> {
  const rawImageData = fs.readFileSync(imagePath);

  // MD5 & Cache
  const hash = crypto.createHash("md5").update(rawImageData).digest("hex");
  const cacheDir = path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const cacheFile = path.join(cacheDir, `${hash}.json`);

  if (fs.existsSync(cacheFile) && !process.env.GEMINI_MOCK) {
    console.log(`📦 [VISION] Usando resultado cacheado.`);
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  }

  if (process.env.GEMINI_MOCK === "true") {
    return {
      componentId: "BarChart",
      reasoning: "MODO MOCK ATIVADO",
      props: {
        title: "Mock Chart",
        data: [{ label: "A", value: 10 }, { label: "B", value: 20 }]
      }
    };
  }

  console.log(`🔍 [VISION] Enviando para Gemini Vision...`);

  // Otimizar imagem para o Gemini (800px é suficiente para gráficos e economiza tokens/tempo)
  const optimizedBuffer = await sharp(rawImageData)
    .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const imageBase64 = optimizedBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  const prompt = buildImageAnalysisPrompt(registryJson);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_VISION || "models/gemini-2.5-flash",
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
  if (!jsonMatch) throw new Error(`Sem JSON na resposta do Gemini Vision.`);

  const analysis = JSON.parse(jsonMatch[0]) as ChartAnalysis;

  // Salvar no cache
  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));

  return analysis;
}
