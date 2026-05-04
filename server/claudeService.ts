import Anthropic from '@anthropic-ai/sdk';
import { ChartAnalysis } from './types.js';
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import fs from "fs";
import path from "path";

let anthropic: Anthropic | null = null;

function getClaudeInstance() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is missing in environment.");
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

/**
 * Gera insights executivos usando Claude 3.5 Sonnet.
 */
export async function generateInsightsWithClaude(analysis: ChartAnalysis): Promise<string> {
  const claude = getClaudeInstance();
  
  const dataContext = {
    title: analysis.props.title,
    subtitle: analysis.props.subtitle,
    componentId: analysis.componentId,
    labels: analysis.props.labels,
    series: analysis.props.series,
    data: analysis.props.data,
  };

  const prompt = `
Você é um analista financeiro e executivo de alto nível ("Giant").
Um gráfico foi extraído pela nossa IA visual. Os dados brutos são:
${JSON.stringify(dataContext, null, 2)}

Sua tarefa:
1. Valide se os dados fazem sentido.
2. Escreva UMA (1) frase curta e de alto impacto que resuma a principal mensagem, insight ou tendência desses dados.
3. Não use linguagem robótica. Seja direto, Premium e focado no negócio.
4. Responda APENAS com o texto final do insight em Português.
`;

  const response = await claude.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type === 'text') {
    return contentBlock.text.trim();
  }
  
  return analysis.props.title || "Insight não disponível.";
}

/**
 * Uses Claude 3.5 Sonnet to analyze a chart image (Fallback for Gemini).
 */
export async function analyzeChartImageWithClaude(
  imagePath: string,
  auditorCritique?: string,
  settings: { includeCallouts?: boolean } = {}
): Promise<ChartAnalysis> {
  const claude = getClaudeInstance();
  const rawImageData = fs.readFileSync(imagePath);
  const imageBase64 = rawImageData.toString("base64");
  
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  let prompt = buildImageAnalysisPrompt(registryJson, settings.includeCallouts);

  const rootDir = process.cwd().endsWith("server") ? path.join(process.cwd(), "..") : process.cwd();
  const visionRulesPath = path.join(rootDir, ".agent", "knowledge", "active-vision-rules.md");
  const designRulesPath = path.join(rootDir, ".agent", "knowledge", "active-design-rules.md");
  
  let activeRules = "";
  if (fs.existsSync(visionRulesPath)) activeRules += fs.readFileSync(visionRulesPath, "utf-8") + "\n\n";
  if (fs.existsSync(designRulesPath)) activeRules += fs.readFileSync(designRulesPath, "utf-8") + "\n";

  if (activeRules) {
    prompt += `\n\n### DIRETRIZES ATIVAS (REGRAS DE OURO):\n${activeRules}\n`;
  }

  if (auditorCritique) prompt += `\n### ⚠️ FEEDBACK AUDITORIA:\n${auditorCritique}\n`;

  console.log("🤖 [Filipe] Iniciando análise de imagem (Fallback)...");

  const response = await claude.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error("Claude did not return a text response.");
  }

  const responseText = contentBlock.text;

  let jsonStr = "";
  const firstBrace = responseText.indexOf('{');
  const lastBrace = responseText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = responseText.slice(firstBrace, lastBrace + 1);
  }

  if (!jsonStr) throw new Error("Falha na extração de JSON da resposta do Claude.");

  const cleanedJson = jsonStr.replace(/\/\/.*$/gm, "").replace(/,\s*([\]\}])/g, "$1");
  return JSON.parse(cleanedJson) as ChartAnalysis;
}

/**
 * Uses Claude 3.5 Sonnet to perform a fidelity audit (Fallback for Gemini).
 */
export async function auditRenderFidelityWithClaude(
  originalImagePath: string,
  renderedStillPath: string
): Promise<any> {
  const claude = getClaudeInstance();
  const originalRaw = fs.readFileSync(originalImagePath);
  const renderedRaw = fs.readFileSync(renderedStillPath);
  const originalB64 = originalRaw.toString("base64");
  const renderedB64 = renderedRaw.toString("base64");

  const { buildAuditorPrompt } = await import("./prompts/auditor.js");
  const prompt = buildAuditorPrompt();

  console.log("⚖️ [Filipe] Iniciando auditoria de fidelidade (Fallback)...");

  const response = await claude.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "ESTA É A IMAGEM ORIGINAL DE REFERÊNCIA:" },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: originalB64,
            },
          },
          { type: "text", text: "ESTE É O RENDER GERADO PELO SISTEMA:" },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: renderedB64,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error("Claude did not return a text response.");
  }

  const responseText = contentBlock.text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error("Claude Auditor não retornou JSON válido");

  return JSON.parse(jsonMatch[0]);
}
