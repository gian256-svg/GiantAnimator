import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GEMINI_MODEL_VISION } from "./calibration/constants.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { type ChartAnalysis } from "./types.js";

// ─── Rules carregadas uma vez por processo/cold start ───────────────────────
let _systemInstruction: string | null = null;

function getSystemInstruction(): string {
  if (_systemInstruction !== null) return _systemInstruction;
  const rootDir = process.cwd().endsWith("server")
    ? path.join(process.cwd(), "..")
    : process.cwd();
  const visionRulesPath = path.join(rootDir, ".agent", "knowledge", "active-vision-rules.md");
  const designRulesPath = path.join(rootDir, ".agent", "knowledge", "active-design-rules.md");
  let rules = "";
  if (fs.existsSync(visionRulesPath)) rules += fs.readFileSync(visionRulesPath, "utf-8") + "\n\n";
  if (fs.existsSync(designRulesPath)) rules += fs.readFileSync(designRulesPath, "utf-8") + "\n";
  _systemInstruction = rules || "Você é um especialista em análise forense de gráficos.";
  console.log(`📋 [João] Regras de ouro carregadas (${_systemInstruction.length} chars).`);
  return _systemInstruction;
}

// Registry comprimido (sem indentação) — calculado uma vez no módulo
const REGISTRY_JSON = JSON.stringify(COMPONENT_REGISTRY);

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
  let prompt = buildImageAnalysisPrompt(REGISTRY_JSON, settings.includeCallouts);
  if (auditorCritique) prompt += `\n### ⚠️ FEEDBACK AUDITORIA:\n${auditorCritique}\n`;

  // ─── MD5 Cache ───────────────────────────────────────────────
  const CACHE_VERSION = 'v17';
  const IS_VERCEL = !!process.env.VERCEL;
  const cacheKey = `${crypto.createHash("md5").update(rawImageData).digest("hex")}_${requestedTheme || 'default'}_${auditorCritique ? crypto.createHash("md5").update(auditorCritique).digest("hex") : 'nocritic'}_${CACHE_VERSION}`;
  const cacheDir = IS_VERCEL ? "/tmp/cache" : path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  if (fs.existsSync(cacheFile) && process.env.GEMINI_MOCK !== "true") {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as ChartAnalysis;
      if (cached.props && (cached.props.data?.length > 0 || cached.props.series?.length > 0)) {
        return normalizeAnalysisProps(cached);
      }
    } catch (e: any) {
      console.warn(`⚠️ [João] Cache corrompido, regenerando: ${e.message}`);
    }
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

  // ─── Gemini Call ───
  const systemInstruction = getSystemInstruction();
  let response;
  let retries = 0;
  let lastError: any = null;
  while (retries < 3) {
    try {
      const model = (await import("./agent.js")).getAIInstance().getGenerativeModel({
        model: GEMINI_MODEL_VISION,
        systemInstruction,
      });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, { text: prompt }] }],
        generationConfig: { temperature: 0.1, topP: 0.1, maxOutputTokens: 16384 },
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
      
      console.error(`❌ [João] Tentativa ${retries}/3 falhou: ${errMsg}`);
      
      if (isServiceError) {
        (await import("./agent.js")).rotateKey();
        const wait = Math.min(Math.pow(2, retries) * 1000, 10000); 
        console.log(`⏳ [João] Aguardando ${wait/1000}s antes da próxima tentativa (503/Demand)...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        break;
      }
    }
  }

  if (!response) {
    // ── Fallback 2: Groq (Llama 3.2 Vision 90B — grátis) ────────
    if (process.env.GROQ_API_KEY) {
      if (onProgress) onProgress("⚠️ Gemini fora do ar. Chaveando para GROQ (Llama Vision)...");
      console.warn("⚠️ [Tiago] Gemini fora do ar. Usando Groq como fallback...");
      try {
        const { analyzeChartImageWithGroq } = await import("./groqService.js");
        const groqAnalysis = await analyzeChartImageWithGroq(imagePath, auditorCritique, settings);
        const normalized = normalizeAnalysisProps(groqAnalysis);
        fs.writeFileSync(cacheFile, JSON.stringify(normalized, null, 2));
        return normalized;
      } catch (groqErr: any) {
        console.error("❌ [Tiago] Fallback Groq falhou:", groqErr.message);
      }
    } else {
      console.warn("⚠️ [Tiago] Pular Groq: GROQ_API_KEY não definida.");
    }

    // ── Fallback 3: Ollama local ─────────────────────────────────
    try {
      if (onProgress) onProgress("⚠️ APIs cloud indisponíveis. Chaveando para OLLAMA local...");
      console.warn("⚠️ [Simão] Usando Ollama como fallback final...");
      const { analyzeChartImageWithOllama } = await import("./ollamaService.js");
      const ollamaAnalysis = await analyzeChartImageWithOllama(imagePath, prompt);
      const normalized = normalizeAnalysisProps(ollamaAnalysis);
      fs.writeFileSync(cacheFile, JSON.stringify(normalized, null, 2));
      return normalized;
    } catch (ollamaErr: any) {
      console.warn("⚠️ [Simão] Fallback local falhou ou Ollama offline.");
    }

    const detail = lastError?.message || "Erro desconhecido";
    throw new Error(`Todos os provedores falharam (Gemini → Groq → Ollama). Detalhe: ${detail}`);
  }
  const candidate = response.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text ?? "";
  const finishReason = candidate?.finishReason;

  if (finishReason && finishReason !== "STOP") {
    console.warn(`⚠️ [João] Gemini finalizou com status: ${finishReason}. Possível truncamento ou restrição.`);
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
    console.warn("⚠️ [João] JSON truncado detectado. Tentando reparo automático de chaves...");
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
      console.log("✅ [João] Reparo automático bem-sucedido.");
    } catch (e) {
      console.error("❌ [João] Falha no reparo automático. JSON ainda inválido.");
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

const VALID_HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function normalizeAnalysisProps(analysis: ChartAnalysis): ChartAnalysis {
  if (!analysis.props) analysis.props = {};
  const p = analysis.props;
  if (!p.labels) p.labels = [];

  // Strip invalid/truncated hex colors so the theme applies defaults instead of blocking
  if (p.seriesColors && Array.isArray(p.seriesColors)) {
    const cleaned = p.seriesColors.filter((c: any) => typeof c === 'string' && VALID_HEX_RE.test(c) && c !== '#000000');
    if (cleaned.length < p.seriesColors.length) {
      console.warn(`⚠️ [Normalize] ${p.seriesColors.length - cleaned.length} seriesColor(s) removidas (inválidas ou preto puro).`);
      p.seriesColors = cleaned.length > 0 ? cleaned : undefined;
    }
  }
  // Same for per-series color
  if (p.series && Array.isArray(p.series)) {
    p.series.forEach((s: any) => {
      if (s.color && (typeof s.color !== 'string' || !VALID_HEX_RE.test(s.color) || s.color === '#000000')) {
        delete s.color;
      }
    });
  }

  if (p.series?.length > 0 && Array.isArray(p.series[0].data)) {
    // Formato series[] → garante p.data espelhado (sem inventar labels)
    if (p.labels.length > 0 && (!p.data || p.data.length === 0)) {
      p.data = p.labels.map((l: string, i: number) => ({ label: l, value: p.series[0].data[i] ?? 0 }));
    }
  } else if (p.data?.length > 0) {
    // Formato data[{label,value}] → deriva labels e series a partir dos dados reais
    if (p.labels.length === 0) {
      p.labels = p.data.map((d: any) => (typeof d === 'object' && d.label ? d.label : null)).filter(Boolean);
    }
    if (!p.series) {
      p.series = [{ label: p.title || "", data: p.data.map((d: any) => (typeof d === 'object' ? d.value : d)) }];
    }
  }

  return analysis;
}
