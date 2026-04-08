import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { PATHS } from "./paths.js";

async function diag() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-2.5-flash";
  const imagePath = path.join(PATHS.input, "test_bar_chart.png");
  
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Imagem não encontrada: ${imagePath}`);
    return;
  }

  const imageData = fs.readFileSync(imagePath).toString("base64");
  const prompt = buildImageAnalysisPrompt(JSON.stringify(COMPONENT_REGISTRY));

  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageData, mimeType: "image/png" } },
          { text: prompt }
        ]
      }]
    });
    console.log("JSON_START");
    console.log(res.text);
    console.log("JSON_END");
  } catch (e) {
    console.error(e);
  }
}
diag();
