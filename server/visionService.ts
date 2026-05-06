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
  let prompt = buildImageAnalysisPrompt(REGISTRY_JSON);
  if (auditorCritique) prompt += `\n### ⚠️ FEEDBACK AUDITORIA:\n${auditorCritique}\n`;

  // ─── MD5 Cache ───────────────────────────────────────────────
  const CACHE_VERSION = 'v19';
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

  // ─── Otimizar imagem (única) — cores e OCR no mesmo passe ───
  // CLAHE removido: destrói informação de cor, causando extração de seriesColors como preto.
  // normalize() + sharpen() são suficientes para OCR sem quebrar a paleta.
  const optimizedBuffer = await sharp(rawImageData)
    .resize(2560, 1440, { fit: "inside", withoutEnlargement: true })
    .normalize()
    .modulate({ brightness: 1.05 })
    .sharpen({ sigma: 1.0 })
    .jpeg({ quality: 97 })
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
        contents: [{ 
          role: "user", 
          parts: [
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0, topP: 0.1, maxOutputTokens: 16384 },
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
        const hasData = (normalized.props.data?.length > 0) || (normalized.props.series?.some((s: any) => s.data?.length > 0));
        if (!hasData) throw new Error("Groq retornou JSON sem dados numéricos");
        
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
      const ollamaAnalysis = await analyzeChartImageWithOllama(imageBase64);
      const normalized = normalizeAnalysisProps(ollamaAnalysis);
      const hasData = (normalized.props.data?.length > 0) || (normalized.props.series?.some((s: any) => s.data?.length > 0));
      if (!hasData) throw new Error("Ollama retornou JSON sem dados numéricos");

      fs.writeFileSync(cacheFile, JSON.stringify(normalized, null, 2));
      return normalized;
    } catch (ollamaErr: any) {
      console.warn("⚠️ [Simão] Fallback local falhou ou Ollama offline.");
    }

    throw new Error(`A detecção de dados falhou (Código: BLANK). IA não encontrou números na imagem. Verifique se suas chaves de API (Gemini/Groq) no .env são válidas ou se o seu modelo local do Ollama é capaz de analisar imagens.`);
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
  
  // Sanity Check: Se não extraiu NADA de numérico, tratamos como falha de percepção
  const hasData = (analysis.props.data?.length > 0) || (analysis.props.series?.some((s: any) => s.data?.length > 0));
  if (!hasData) {
    console.error("❌ [João] Extração retornou JSON válido, mas sem dados numéricos (BLANK).");
    if (!lastError) lastError = new Error("JSON sem dados numéricos");
    // Se ainda estamos no loop principal, isso vai forçar o retry ou fallback
    throw lastError; 
  }

  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
  return analysis;
}

const VALID_HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function isVeryDark(hex: string): boolean {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 15; // Apenas preto/quase-preto — navys, verdes-escuros e similares são legítimos
  } catch {
    return false;
  }
}

export function normalizeAnalysisProps(analysis: ChartAnalysis): ChartAnalysis {
  if (!analysis.props) analysis.props = {};
  const p = analysis.props;

  // 🛡️ ANTI-HIGH-CONTRAST: Remove fundo preto puro detectado pela IA de OCR
  // Se for #000000 ou muito escuro, permitimos que o tema (Dark/Light) decida o background real
  if (p.backgroundColor && (p.backgroundColor === '#000000' || p.backgroundColor === '#000' || isVeryDark(p.backgroundColor))) {
    console.log(`🛡️ [Normalize] Removendo backgroundColor detectado (${p.backgroundColor}) por ser muito escuro/contraste.`);
    delete p.backgroundColor;
  }

  // 🛡️ ANTI-HIGH-CONTRAST (SÉRIES): Remove cores pretas das séries para evitar invisibilidade no fundo Dark
  if (p.seriesColors && Array.isArray(p.seriesColors)) {
    const cleaned = p.seriesColors.filter((c: any) => typeof c === 'string' && VALID_HEX_RE.test(c) && !isVeryDark(c));
    if (cleaned.length < p.seriesColors.length) {
      console.warn(`⚠️ [Normalize] ${p.seriesColors.length - cleaned.length} seriesColor(s) removidas por serem muito escuras.`);
      p.seriesColors = cleaned.length > 0 ? cleaned : undefined;
    }
  }

  // Limpeza profunda em cada série individual
  if (p.series && Array.isArray(p.series)) {
    p.series.forEach((s: any) => {
      if (s.color && (typeof s.color !== 'string' || !VALID_HEX_RE.test(s.color) || isVeryDark(s.color))) {
        console.log(`🛡️ [Normalize] Removendo cor da série "${s.label}" por ser muito escura/inválida.`);
        delete s.color;
      }
    });
  }

  if (!p.labels) p.labels = [];

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
