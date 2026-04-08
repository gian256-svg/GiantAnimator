// server/calibration/visual-auditor.ts
import fs   from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import type { ChartType, AuditDimension, CalibrationResult } from "./types.js";
import { REFERENCE_CATALOG }        from "./reference-scraper.js";
import { GEMINI_MODEL_VISION }      from "./constants.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const AUDIT_DIMENSIONS = [
  "proporções",
  "cores",
  "grid",
  "animação",
  "labels",
  "legenda",
  "edge-cases",
  "multi-dataset",
] as const;

// ─────────────────────────────────────────────────────────
// Upload via Files API — v1.48 usa Blob/Buffer direto
// ─────────────────────────────────────────────────────────
async function uploadStill(stillPath: string): Promise<string> {
  console.log(`📤 [FileAPI] Enviando: ${path.basename(stillPath)}`);

  const fileBuffer = fs.readFileSync(stillPath);
  const blob       = new Blob([fileBuffer], { type: "image/png" });

  // ✅ Assinatura correta no SDK v1.48
  const uploaded = await ai.files.upload({
    file:   blob,
    config: {
      mimeType:    "image/png",
      displayName: path.basename(stillPath),
    },
  });

  // Aguarda estado ACTIVE (pode vir já ativo em arquivos pequenos)
  let file = uploaded;
  let attempts = 0;

  while (file.state === "PROCESSING" && attempts < 15) {
    await new Promise((r) => setTimeout(r, 2000));
    file = await ai.files.get({ name: file.name! });
    attempts++;
    process.stdout.write(`\r  ⏳ Aguardando FileAPI... (${attempts * 2}s)`);
  }

  if (file.state === "FAILED") {
    throw new Error(`FileAPI falhou no processamento: ${file.name}`);
  }

  console.log(`\n✅ [FileAPI] Pronto: ${file.uri}`);
  return file.uri!;
}

// ─────────────────────────────────────────────────────────
// Auditoria das 8 dimensões
// ─────────────────────────────────────────────────────────
export async function auditComponent(
  chartType: ChartType,
  componentPath: string,
  stillPath: string,
  iteration: number
): Promise<CalibrationResult> {
  const ref           = REFERENCE_CATALOG[chartType];
  const componentCode = fs.readFileSync(componentPath, "utf-8");

  // Tenta upload; fallback para inlineData
  let imagePart: object;
  try {
    const uri = await uploadStill(stillPath);
    imagePart = { fileData: { mimeType: "image/png", fileUri: uri } };
  } catch (uploadErr) {
    console.warn(`⚠️  FileAPI falhou — usando inlineData: ${uploadErr}`);
    imagePart = {
      inlineData: {
        mimeType: "image/png",
        data:     fs.readFileSync(stillPath).toString("base64"),
      },
    };
  }

  const prompt = `
Você é um auditor visual especializado em gráficos animados para Remotion.
Analise o componente TypeScript e o frame PNG renderizado.
Avalie CADA uma das 8 dimensões com score exato 0 ou 1.

## Tipo de Gráfico: ${chartType}

## ⚠️ REGRA #1 — Lei Suprema
O layout original do gráfico de referência SEMPRE tem prioridade.
Penalize componentes que "melhoraram" o design sem ser solicitado.

## Animações Esperadas
${ref.animationNotes.map((n: string) => `- ${n}`).join("\n")}

## Visual Esperado
${ref.visualNotes.map((n: string) => `- ${n}`).join("\n")}

## Código do Componente
\`\`\`tsx
${componentCode}
\`\`\`

## IMPORTANTE: Retorne SOMENTE este JSON, sem texto antes ou depois.

\`\`\`json
{
  "dimensions": [
    { "name": "proporções",    "passed": true, "score": 1, "notes": "..." },
    { "name": "cores",         "passed": true, "score": 1, "notes": "..." },
    { "name": "grid",          "passed": true, "score": 1, "notes": "..." },
    { "name": "animação",      "passed": true, "score": 1, "notes": "..." },
    { "name": "labels",        "passed": true, "score": 1, "notes": "..." },
    { "name": "legenda",       "passed": true, "score": 1, "notes": "..." },
    { "name": "edge-cases",    "passed": true, "score": 1, "notes": "..." },
    { "name": "multi-dataset", "passed": true, "score": 1, "notes": "..." }
  ],
  "overallNotes": "resumo",
  "suggestedFixes": ["fix 1", "fix 2"]
}
\`\`\`
`;

  console.log(`🔍 [${chartType}] Auditando iter ${iteration} (${GEMINI_MODEL_VISION})...`);

  const response = await ai.models.generateContent({
    model:    GEMINI_MODEL_VISION,
    config:   {
      thinkingConfig: { thinkingBudget: 5000 },
    },
    contents: [
      {
        role:  "user",
        parts: [{ text: prompt }, imagePart as any],
      },
    ],
  });

  const text = response.text ?? "";
  const usage = response.usageMetadata as any;
  const thinkingTokens = usage?.candidatesTokenDetails?.find((d: any) => d.modality === "THINKING")?.tokenCount ?? 0;

  // Parse com fallback potente + limpeza robusta
  let auditData: {
    dimensions:     AuditDimension[];
    overallNotes:   string;
    suggestedFixes: string[];
  };

  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/^\s*`{1,3}/gm, "")
      .trim();

    if (cleaned.startsWith("{")) {
       auditData = JSON.parse(cleaned);
    } else {
       const raw = cleaned.match(/\{[\s\S]*\}/);
       if (!raw) throw new Error("Sem JSON na resposta");
       auditData = JSON.parse(raw[0]);
    }
  } catch (parseErr) {
    console.warn(`⚠️  [${chartType}] Parse falhou — score 0 (fallback)`);
    console.warn("Resposta (300 chars):", text.slice(0, 300));
    auditData = {
      dimensions: AUDIT_DIMENSIONS.map((name) => ({
        name, passed: false, score: 0,
        notes: `Parse error: ${String(parseErr)}`,
      })),
      overallNotes:   "Erro no parse",
      suggestedFixes: [
        "Verificar se o componente compila sem erros TypeScript",
        "Verificar se a Composition ID está registrada no Root.tsx",
      ],
    };
  }

  const dimensions = auditData.dimensions ?? [];
  const totalScore = dimensions.reduce((sum, d) => sum + (d.score ?? 0), 0);

  const result: CalibrationResult = {
    chartType,
    status:        totalScore >= 8 ? "calibrated" : "auditing",
    score:         totalScore,
    dimensions,
    rulesPath:     path.resolve(`.agent/knowledge/${chartType}-rules.md`),
    componentPath,
    renderPath:    stillPath,
    timestamp:     new Date().toISOString(),
    iteration,
    errors:        auditData.suggestedFixes ?? [],
  };

  // ✅ Persiste o detalhe da última auditoria para o /calibrate/last-audit
  const lastAuditFile = path.resolve(__dirname, "../../server/calibration/last-audit.json");
  fs.writeFileSync(lastAuditFile, JSON.stringify({
    ...result,
    totalScore: result.score,
    thinkingTokens,
    overallNotes: auditData.overallNotes
  }, null, 2));

  // Log formatado
  const sep = "─".repeat(54);
  console.log(`\n${sep}`);
  console.log(`📊 [${chartType}] Score: ${totalScore}/8 ${totalScore >= 8 ? "✅ CALIBRADO" : "❌ REPROVADO"}`);
  dimensions.forEach((d) =>
    console.log(`   ${d.passed ? "✅" : "❌"} ${d.name.padEnd(16)} ${d.notes}`)
  );
  if (auditData.overallNotes) console.log(`   💬 ${auditData.overallNotes}`);
  console.log(`${sep}\n`);

  return result;
}
