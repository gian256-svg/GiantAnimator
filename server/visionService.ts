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

  // ─── MD5 Cache ───────────────────────────────────────────────
  const hash      = crypto.createHash("md5").update(rawImageData).digest("hex");
  const cacheDir  = path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${hash}.json`);

  if (fs.existsSync(cacheFile) && process.env.GEMINI_MOCK !== "true") {
    console.log(`📦 [VISION] Cache hit: ${hash}`);
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  }

  // ─── Mock ────────────────────────────────────────────────────
  if (process.env.GEMINI_MOCK === "true") {
    console.log(`🤖 [VISION] Modo mock ativado`);
    return {
      componentId: "BarChart",
      reasoning:   "MODO MOCK ATIVADO",
      props: {
        title: "Mock Chart",
        data:  [{ label: "A", value: 10 }, { label: "B", value: 20 }],
      },
    };
  }

  console.log(`🔍 [VISION] Enviando para Gemini Vision...`);

  // ─── Otimizar imagem ─────────────────────────────────────────
  const optimizedBuffer = await sharp(rawImageData)
    .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const imageBase64  = optimizedBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  const prompt       = buildImageAnalysisPrompt(registryJson);

  // ─── Chamada Gemini ──────────────────────────────────────────
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_VISION || "models/gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/png" } },
          { text: prompt },
        ],
      },
    ],
  });

  // ─── ✅ FIX: extrair texto corretamente ───────────────────────
  const responseText =
    response.candidates?.[0]?.content?.parts?.[0]?.text
    ?? (response as any).text  // fallback caso SDK normalize futuramente
    ?? "";

  console.log(`📝 [VISION] Raw response (200 chars): ${responseText.slice(0, 200)}`);

  if (!responseText.trim()) {
    throw new Error(
      `Gemini Vision retornou resposta vazia. ` +
      `Finish reason: ${response.candidates?.[0]?.finishReason ?? "desconhecido"}`
    );
  }

  // ─── Extrair JSON ────────────────────────────────────────────
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Sem JSON na resposta do Gemini Vision. ` +
      `Resposta recebida: ${responseText.slice(0, 300)}`
    );
  }

  let analysis: ChartAnalysis;
  try {
    analysis = JSON.parse(jsonMatch[0]) as ChartAnalysis;
  } catch (parseErr: any) {
    throw new Error(`JSON inválido do Gemini Vision: ${parseErr.message}. Trecho: ${jsonMatch[0].slice(0, 200)}`);
  }

  // ─── ✅ Validar campos obrigatórios ───────────────────────────
  if (!analysis.componentId) {
    console.warn(`⚠️  [VISION] componentId ausente, usando fallback 'BarChart'`);
    analysis.componentId = "BarChart";
  }
  if (!analysis.reasoning) {
    analysis.reasoning = "Análise concluída sem descrição";
  }
  if (!analysis.props || typeof analysis.props !== "object") {
    throw new Error(`analysis.props ausente ou inválido no retorno do Gemini`);
  }
  if (!Array.isArray(analysis.props.data)) {
    console.warn(`⚠️  [VISION] props.data ausente, inicializando vazio`);
    analysis.props.data = [];
  }

  // ─── Salvar cache ────────────────────────────────────────────
  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
  console.log(`✅ [VISION] Análise concluída → ${analysis.componentId} | ${analysis.props.data.length} pontos`);

  return analysis;
}
