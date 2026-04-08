// test-api.ts
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function checkModel(name: string) {
  try {
    const res = await ai.models.generateContent({
      model: name,
      contents: [{ role: "user", parts: [{ text: "Hi" }] }],
    });
    console.log(`✅ [${name}] OK`);
  } catch (err: any) {
    console.log(`❌ [${name}] FAILED: ${err.message}`);
  }
}

async function main() {
  await checkModel("gemini-2.0-flash");
  await checkModel("gemini-2.5-flash");
  await checkModel("gemini-1.5-flash-002");
  await checkModel("gemini-1.5-pro-002");
}

main();
