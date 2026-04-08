import "dotenv/config";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { PATHS } from "./paths.js";

async function diagAudit() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-2.5-flash";
  const inputDir = PATHS.input;
  const doneDir = PATHS.done;
  
  const files = [
     path.join(inputDir, "Piechartexample2.png"),
     path.join(inputDir, "bar-charts-4.png"),
     path.join(inputDir, "test_bar_chart.png"),
     path.join(doneDir, "area-ref.png"),
     path.join(doneDir, "bar-ref.png"),
     path.join(doneDir, "line-ref.png"),
     path.join(doneDir, "pie-ref.png"),
     path.join(doneDir, "scatter-ref.png")
  ];

  const registryJson = JSON.stringify(COMPONENT_REGISTRY);
  const prompt = buildImageAnalysisPrompt(registryJson);

  console.log("--- FINAL AUDIT REPORT DATA ---");

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
        console.log(`[FILE_MISSING]: ${filePath}`);
        continue;
    }
    const fileName = path.basename(filePath);
    console.log(`\n### FILE: ${fileName}`);
    try {
        const imageData = fs.readFileSync(filePath).toString("base64");
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
        const text = res.text ?? "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log(jsonMatch[0]);
        } else {
            console.log("[NO_JSON]: " + text);
        }
    } catch (e: any) {
        console.error(`[ERROR]: ${fileName} - ${e.message}`);
    }
    // Throttle for quota
    await new Promise(r => setTimeout(r, 2000));
  }
}
diagAudit();
