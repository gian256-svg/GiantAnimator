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
  // Invalidação de cache via versão (_v5) para garantir que as novas regras de sync sejam aplicadas.
  const cacheKey  = `${crypto.createHash("md5").update(rawImageData).digest("hex")}_${requestedTheme || 'default'}_${auditorCritique ? crypto.createHash("md5").update(auditorCritique).digest("hex") : 'nocritic'}_v5`;
  const cacheDir  = IS_VERCEL ? "/tmp/cache" : path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  if (fs.existsSync(cacheFile) && process.env.GEMINI_MOCK !== "true") {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as ChartAnalysis;
      // Valida o cache: se tem data ou series, nós o normalizamos e retornamos.
      const hasData = (cached.props?.series?.length > 0) || (cached.props?.data?.length > 0) || (cached.props?.datasets?.length > 0);
      if (hasData) {
        console.log(`📦 [VISION] Cache hit: ${cacheKey.slice(0,16)}...`);
        return normalizeAnalysisProps(cached);
      }
      fs.unlinkSync(cacheFile); 
    } catch (e) {
      console.error("Erro ao ler cache:", e);
    }
  }

  // ─── Otimizar imagem (2560p JPEG - Ultra Fidelity) ───
  const optimizedBuffer = await sharp(rawImageData)
    .resize(2560, 1440, { fit: "inside", withoutEnlargement: true })
    .normalize()
    .modulate({ brightness: 1.1 }) 
    .sharpen({ sigma: 1.2 })
    .jpeg({ quality: 98 })
    .toBuffer();

  const imageBase64  = optimizedBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  
  let prompt = buildImageAnalysisPrompt(registryJson, settings.includeCallouts);

  // Injetar Conhecimento Relevante (RAG)
  const trainingLogPath = path.join(process.cwd(), "..", "TRAINING_LOG.md");
  if (fs.existsSync(trainingLogPath)) {
    const trainingLog = fs.readFileSync(trainingLogPath, "utf-8");
    prompt += `\n\n### DIRETRIZES DE DESIGN E APRENDIZADOS RELEVANTES:\n${trainingLog.slice(-3000)}\n`;
  }

  if (auditorCritique) {
    prompt += `\n### ⚠️ FEEDBACK DA AUDITORIA:\n${auditorCritique}\n`;
  }

  // ─── Chamada Gemini com Retry ───
  let response;
  let retries = 0;
  const MAX_RETRIES = 5;

  while (retries <= MAX_RETRIES) {
    try {
      const aiInstance = (await import("./agent.js")).getAIInstance();
      const model = aiInstance.getGenerativeModel({ model: GEMINI_MODEL_VISION });

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
            { text: prompt },
          ]
        }],
        generationConfig: { temperature: 0.1, topP: 0.1, maxOutputTokens: 4096 },
      });
      response = result.response;
      break; 
    } catch (err: any) {
      retries++;
      await new Promise(r => setTimeout(r, 2000 * retries));
    }
  }

  if (!response) throw new Error("Falha na análise visual após retentativas.");

  const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Sem JSON na resposta do Gemini.");

  let analysis = JSON.parse(jsonMatch[0]) as ChartAnalysis;

  // Normalização e Sincronização Final
  analysis = normalizeAnalysisProps(analysis);

  // Validação de Integridade
  const p = analysis.props;
  const hasData = (p.series?.length > 0 && p.series[0].data?.length > 0) || (p.data?.length > 0);
  if (!hasData) throw new Error("A IA não conseguiu extrair dados numéricos.");

  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
  return analysis;
}

/**
 * Função de Normalização Global de Dados
 */
function normalizeAnalysisProps(analysis: ChartAnalysis): ChartAnalysis {
  if (!analysis.props) analysis.props = {};
  const p = analysis.props;

  // 1. Garantir que labels existam
  if (!p.labels || !Array.isArray(p.labels)) {
    p.labels = [];
  }

  // 2. Sync Principal: series -> data (para o Editor Visual)
  if (p.series && Array.isArray(p.series) && p.series.length > 0) {
    const s = p.series[0];
    if (Array.isArray(s.data)) {
      if (p.labels.length === 0) {
        p.labels = s.data.map((_: any, i: number) => `Item ${i + 1}`);
      }
      if (!p.data || !Array.isArray(p.data) || p.data.length === 0) {
        p.data = p.labels.map((l: string, i: number) => ({
          label: l,
          value: s.data[i] ?? 0
        }));
      }
    }
  } 
  
  // 3. Sync Reverso: data -> series (para componentes)
  if (p.data && Array.isArray(p.data) && p.data.length > 0) {
    if (!p.series || !Array.isArray(p.series) || p.series.length === 0) {
      p.series = [{
        label: p.title || "Série 1",
        data: p.data.map((d: any) => (typeof d === 'object' ? d.value : d))
      }];
    }
    if (p.labels.length === 0) {
      p.labels = p.data.map((d: any) => (typeof d === 'object' ? d.label : `Item` ));
    }
  }

  // 4. Heurística de Resgate (props.values ou props.datasets)
  if (p.datasets && Array.isArray(p.datasets) && p.datasets.length > 0 && (!p.series || p.series.length === 0)) {
    p.series = p.datasets.map((d: any) => ({ label: d.label || "Série", data: d.data || d.values || [] }));
    return normalizeAnalysisProps(analysis);
  }

  return analysis;
}
