import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import Tesseract from "tesseract.js";
import { ai } from "./agent.js";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GEMINI_MODEL_VISION } from "./calibration/constants.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { type ChartAnalysis } from "./types.js";

/**
 * Serviço de Visão Compartilhado para análise de imagens de gráficos.
 */
export async function analyzeChartImage(
  imagePath: string,
  requestedTheme?: string,
  auditorCritique?: string,
  settings: { includeCallouts?: boolean } = {},
  onProgress?: (message: string) => void
): Promise<ChartAnalysis> {
  const rawImageData = fs.readFileSync(imagePath);

  // ─── MD5 Cache ───────────────────────────────────────────────
  const IS_VERCEL = !!process.env.VERCEL;
  const cacheKey = `${crypto.createHash("md5").update(rawImageData).digest("hex")}_${requestedTheme || 'default'}_${auditorCritique ? crypto.createHash("md5").update(auditorCritique).digest("hex") : 'nocritic'}_v7`;
  const cacheDir = IS_VERCEL ? "/tmp/cache" : path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  if (fs.existsSync(cacheFile) && process.env.GEMINI_MOCK !== "true") {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as ChartAnalysis;
      if (cached.props && (cached.props.data?.length > 0 || cached.props.series?.length > 0)) {
        return normalizeAnalysisProps(cached);
      }
    } catch (e) { }
  }

  // ─── Otimizar imagem ───
  const optimizedBuffer = await sharp(rawImageData)
    .resize(2560, 1440, { fit: "inside", withoutEnlargement: true })
    .normalize()
    .modulate({ brightness: 1.1 })
    .sharpen({ sigma: 1.2 })
    .jpeg({ quality: 98 })
    .toBuffer();

  const imageBase64 = optimizedBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  let prompt = buildImageAnalysisPrompt(registryJson, settings.includeCallouts);

  const trainingLogPath = path.join(process.cwd(), "..", "TRAINING_LOG.md");
  if (fs.existsSync(trainingLogPath)) {
    prompt += `\n\n### DIRETRIZES DE DESIGN:\n${fs.readFileSync(trainingLogPath, "utf-8").slice(-3000)}\n`;
  }

  if (auditorCritique) prompt += `\n### ⚠️ FEEDBACK AUDITORIA:\n${auditorCritique}\n`;

  // ─── Gemini Call ───
  let response;
  let retries = 0;
  let lastError: any = null;
  while (retries < 10) {
    try {
      const model = (await import("./agent.js")).getAIInstance().getGenerativeModel({ model: GEMINI_MODEL_VISION });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, { text: prompt }] }],
        generationConfig: { temperature: 0.1, topP: 0.1, maxOutputTokens: 4096 },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });
      response = result.response;
      break;
    } catch (err: any) {
      retries++;
      lastError = err;
      const errMsg = err.message || String(err);
      const isServiceError = errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
      
      console.error(`❌ [VISION] Tentativa ${retries}/10 falhou: ${errMsg}`);
      
      if (isServiceError) {
        (await import("./agent.js")).rotateKey();
        const wait = Math.min(Math.pow(2, retries) * 1000, 30000); 
        console.log(`⏳ [VISION] Aguardando ${wait/1000}s antes da próxima tentativa (503/Demand)...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        // Se for erro de autenticação ou parâmetro, não adianta tentar 10 vezes
        break;
      }
    }
  }

  if (!response) {
    const detail = lastError?.message || "Erro desconhecido";
    throw new Error(`API Gemini falhou após ${retries} tentativas. Detalhe: ${detail}`);
  }
  const candidate = response.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text ?? "";
  const finishReason = candidate?.finishReason;

  if (finishReason && finishReason !== "STOP") {
    console.warn(`⚠️ [Vision] Gemini finalizou com status: ${finishReason}. Possível truncamento ou restrição.`);
  }

  // ─── EXTRAÇÃO CIRÚRGICA DE JSON (Brace-Stacking + String-Aware) ───
  let jsonStr = "";
  let depth = 0;
  let first = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < responseText.length; i++) {
    const char = responseText[i];
    if (char === '"' && !escaped) inString = !inString;
    if (char === '\\' && !escaped) escaped = true; else escaped = false;

    if (!inString) {
      if (char === '{') {
        if (depth === 0) first = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && first !== -1) {
          jsonStr = responseText.slice(first, i + 1);
          break;
        }
      }
    }
  }

  // 🔥 RESGATE DE TRUNCAMENTO (Manual Repair)
  if (!jsonStr && first !== -1) {
    console.warn("⚠️ [Vision] JSON truncado detectado. Tentando reparo automático de chaves...");
    let partial = responseText.slice(first);

    // Se terminou no meio de uma string, fecha a aspa
    if (inString) {
      partial += '"';
    }

    // Fecha todas as chaves pendentes
    let tempDepth = depth;
    while (tempDepth > 0) {
      partial += "}";
      tempDepth--;
    }

    // Tenta validar se virou um JSON minimamente parseável
    try {
      // Remove vírgula trailing se existir antes de fechar (ex: "key": "val",})
      const fixed = partial.replace(/,\s*([\]\}])/g, "$1");
      JSON.parse(fixed);
      jsonStr = fixed;
      console.log("✅ [Vision] Reparo automático bem-sucedido.");
    } catch (e) {
      console.error("❌ [Vision] Falha no reparo automático. JSON ainda inválido.");
    }
  }

  if (!jsonStr) throw new Error(`Falha na extração: Braces não balanceados. FinishReason: ${finishReason}. Resposta: ${responseText.slice(0, 100)}`);

  // ─── LIMPEZA DE CARACTERES ILEGAIS (Newlines em Strings) ───
  // Substitui quebras de linha reais por \n se estiverem dentro de aspas
  let cleanedJson = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && !esc) inStr = !inStr;
    if (char === '\\' && !esc) esc = true; else esc = false;

    if (inStr && (char === '\n' || char === '\r')) {
      cleanedJson += "\\n";
    } else {
      cleanedJson += char;
    }
  }

  // Remove trailing commas e comentários
  cleanedJson = cleanedJson.replace(/\/\/.*$/gm, "").replace(/,\s*([\]\}])/g, "$1");

  let analysis: ChartAnalysis;
  try {
    analysis = JSON.parse(cleanedJson) as ChartAnalysis;
  } catch (e: any) {
    throw new Error(`JSON Corrompido: ${e.message}. Snippet: ${cleanedJson.slice(0, 150)}`);
  }

  analysis = normalizeAnalysisProps(analysis);
  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
  return analysis;
}

function normalizeAnalysisProps(analysis: ChartAnalysis): ChartAnalysis {
  if (!analysis.props) analysis.props = {};
  const p = analysis.props;
  if (!p.labels) p.labels = [];
  if (p.series?.length > 0 && Array.isArray(p.series[0].data)) {
    if (p.labels.length === 0) p.labels = p.series[0].data.map((_: any, i: number) => `Item ${i + 1}`);
    if (!p.data || p.data.length === 0) p.data = p.labels.map((l: string, i: number) => ({ label: l, value: p.series[0].data[i] ?? 0 }));
  } else if (p.data?.length > 0) {
    if (!p.series) p.series = [{ label: p.title || "Série", data: p.data.map((d: any) => (typeof d === 'object' ? d.value : d)) }];
    if (p.labels.length === 0) p.labels = p.data.map((d: any) => (typeof d === 'object' ? d.label : `Item`));
  }
  return analysis;
}
