import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { buildAuditorPrompt } from "./prompts/auditor.js";
import { type ChartAnalysis } from "./types.js";

const VISION_MODEL = "llama-3.2-90b-vision-preview";
const TEXT_MODEL   = "llama-3.3-70b-versatile";

let _client: Groq | null = null;

function getClient(): Groq {
  if (_client) return _client;
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não definida.");
  _client = new Groq({ apiKey: key });
  return _client;
}

// ── Extração de JSON robusta (reutiliza lógica do visionService) ─────────────
function extractJson(text: string): string {
  let depth = 0, first = -1, inString = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && !escaped) inString = !inString;
    escaped = c === '\\' && !escaped;
    if (!inString) {
      if (c === '{') { if (!depth) first = i; depth++; }
      else if (c === '}' && --depth === 0 && first !== -1)
        return text.slice(first, i + 1);
    }
  }
  throw new Error("Groq: JSON não encontrado na resposta.");
}

function cleanJson(raw: string): string {
  return raw.replace(/\/\/.*$/gm, "").replace(/,\s*([\]\}])/g, "$1");
}

// ── Análise de imagem de gráfico ─────────────────────────────────────────────
export async function analyzeChartImageWithGroq(
  imagePath: string,
  auditorCritique?: string,
  settings: { includeCallouts?: boolean } = {}
): Promise<ChartAnalysis> {
  const groq = getClient();

  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  let prompt = buildImageAnalysisPrompt(registryJson, settings.includeCallouts);

  const rootDir = process.cwd().endsWith("server")
    ? path.join(process.cwd(), "..")
    : process.cwd();
  const visionRulesPath = path.join(rootDir, ".agent", "knowledge", "active-vision-rules.md");
  const designRulesPath = path.join(rootDir, ".agent", "knowledge", "active-design-rules.md");

  if (fs.existsSync(visionRulesPath))
    prompt += "\n\n### DIRETRIZES ATIVAS:\n" + fs.readFileSync(visionRulesPath, "utf-8");
  if (fs.existsSync(designRulesPath))
    prompt += "\n" + fs.readFileSync(designRulesPath, "utf-8");
  if (auditorCritique)
    prompt += `\n### ⚠️ FEEDBACK AUDITORIA:\n${auditorCritique}`;

  console.log("🦙 [Tiago] Analisando imagem com Llama 3.2 Vision 90B...");

  const completion = await groq.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0.1,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const analysis = JSON.parse(cleanJson(extractJson(text))) as ChartAnalysis;
  analysis.engine = "groq-llama-vision";
  return analysis;
}

// ── Auditoria de fidelidade ──────────────────────────────────────────────────
export async function auditRenderFidelityWithGroq(
  originalImagePath: string,
  renderedStillPath: string
): Promise<{ score: number; isApproved: boolean; critique: string; recommendedAdjustments?: any }> {
  const groq = getClient();

  const originalB64 = fs.readFileSync(originalImagePath).toString("base64");
  const renderedB64 = fs.readFileSync(renderedStillPath).toString("base64");
  const prompt = buildAuditorPrompt();

  console.log("⚖️ [Tiago] Auditoria de fidelidade com Llama 3.2 Vision 90B...");

  // Groq Vision aceita múltiplas imagens na mesma mensagem
  const completion = await groq.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0.1,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "IMAGEM 1 — ORIGINAL DE REFERÊNCIA:" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${originalB64}` } },
          { type: "text", text: "IMAGEM 2 — RENDER GERADO PELO SISTEMA:" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${renderedB64}` } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Groq Auditor: JSON inválido na resposta.");
  return JSON.parse(jsonMatch[0]);
}

// ── Geração de insight executivo ─────────────────────────────────────────────
export async function generateInsightWithGroq(analysis: ChartAnalysis): Promise<string> {
  const groq = getClient();

  const dataContext = {
    title: analysis.props.title,
    subtitle: analysis.props.subtitle,
    componentId: analysis.componentId,
    labels: analysis.props.labels,
    series: analysis.props.series,
    data: analysis.props.data,
  };

  const completion = await groq.chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.2,
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Você é um analista financeiro executivo ("Giant").
Dados do gráfico: ${JSON.stringify(dataContext, null, 2)}

Escreva UMA frase curta e de alto impacto resumindo a principal tendência, como comentário executivo premium.
Responda APENAS com o texto do insight em Português, sem introduções.`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? analysis.props.title ?? "Insight não disponível.";
}
