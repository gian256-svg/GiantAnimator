// server/calibration/calibration-agent.ts
import fs   from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import type { ChartType, CalibrationConfig, CalibrationResult } from "./types.js";
import { REFERENCE_CATALOG }                      from "./reference-scraper.js";
import { COMPONENT_NAME_MAP, GEMINI_MODEL }        from "./constants.js";
import {
  renderCalibrationStill,
  renderCalibrationVideo,
  invalidateBundleCache,
}                                                 from "./render-tester.js";
import { auditComponent }                         from "./visual-auditor.js";
import { writeRulesFile, updateCalibrationStatus } from "./rules-writer.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ai         = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const CHARTS_DIR = "c:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/remotion-project/src/charts";

const DEFAULT_CONFIG: CalibrationConfig = {
  targetScore:      8,
  maxIterations:    3,
  renderTimeout:    90_000,
  autoSaveRules:    true,
  notifyOnComplete: true,
};

// ─────────────────────────────────────────────────────────
// Carrega knowledge base do disco
// ─────────────────────────────────────────────────────────
function loadKnowledge(chartType: ChartType): string {
  const files = [
    ".agent/knowledge/remotion-charts.md",
    ".agent/knowledge/remotion-spring.md",
    ".agent/knowledge/highcharts-visual-rules.md",  // ✅ Regras de Ouro Highcharts
    `.agent/knowledge/${chartType}-rules.md`,
  ];
  return files
    .filter(fs.existsSync)
    .map((f) => fs.readFileSync(f, "utf-8"))
    .join("\n\n---\n\n");
}

async function generateComponent(
  chartType: ChartType,
  previousResult?: CalibrationResult
): Promise<string> {
  const ref           = REFERENCE_CATALOG[chartType];
  const knowledgeBase = loadKnowledge(chartType);

  const systemInstruction = `
Você é especialista em Remotion e animações SVG frame-a-frame para o projeto GiantAnimator.

## ⚠️ REGRA ABSOLUTA #1 — NUNCA VIOLAR:
Se houver um layout de referência, replique-o FIELMENTE.
Você NÃO improvisa design. NÃO "melhora" sem ser solicitado. Segue o original.

## Regras Técnicas Absolutas:
- TODO valor animado DEVE derivar de useCurrentFrame()
- NUNCA usar setTimeout, setInterval, CSS transitions ou requestAnimationFrame
- NUNCA usar Math.random() — gera frames não-determinísticos
- Array.isArray() em TODOS os .map()
- extrapolateRight: "clamp" em TODOS os interpolate()
- Proteção contra divisão por zero em TODOS os cálculos de escala
- Proteção contra NaN em TODOS os atributos SVG
- Altura mínima de barra positiva: 4px
- Import do tema: import { THEME } from "../theme"
- 🛑 PROIBIDO usar 'document' ou 'window'! O código roda em Node/Workery e não tem DOM. Use apenas lógica de SVG e React.
- 🛑 TODOS os 'SPRING_CONFIG_...' que você usar DEVEM estar definidos no topo do arquivo. Não invente nomes como SPRING_CONFIG_SUBTLE se não os definir.
- Proteção contra NaN em TODOS os atributos SVG (ex: isNaN(x) ? 0 : x)
- Altura mínima de barra positiva: 4px
- Import do tema: import { THEME } from "../theme"
- NUNCA usar libs externas (Chart.js, Recharts, etc.)

## Knowledge Base — Regras de Ouro:
${knowledgeBase}
`.trim();

  const fixBlock = previousResult
    ? `\n## ❌ ITERAÇÃO ${previousResult.iteration} REPROVADA — CORRIJA TUDO:\n\n` +
      `Fixes obrigatórios:\n${previousResult.errors.map((e) => `- ${e}`).join("\n")}\n\n` +
      `Dimensões reprovadas:\n${previousResult.dimensions
        .filter((d) => !d.passed)
        .map((d) => `- **${d.name}**: ${d.notes}`)
        .join("\n")}`
    : "";

  const userPrompt = `
Gere o componente TypeScript COMPLETO e COMPILÁVEL para: **${chartType}**

## Animações de Referência
${ref.animationNotes.map((n: string) => `- ${n}`).join("\n")}

## Visual de Referência
${ref.visualNotes.map((n: string) => `- ${n}`).join("\n")}

## Dados de Teste
\`\`\`json
${JSON.stringify(ref.sampleData, null, 2)}
\`\`\`

## Nome do componente: ${COMPONENT_NAME_MAP[chartType]}
${fixBlock}

Retorne APENAS o bloco \`\`\`tsx ... \`\`\` sem texto adicional.
`.trim();

  console.log(`🤖 [${chartType}] Gerando (${GEMINI_MODEL})...`);

  try {
    // ✅ systemInstruction como campo separado — não poluí o histórico de chat
    const response = await ai.models.generateContent({
      model:    GEMINI_MODEL,
      config:   {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const text      = response.text ?? "";
    const codeMatch = text.match(/```(?:tsx?|typescript)?\n([\s\S]*?)```/);
    const code      = codeMatch ? codeMatch[1] : text;

    if (code.trim().length < 200) {
      throw new Error("Código muito curto — provável erro de quota ou bloqueio de conteúdo");
    }
    return code;
  } catch (err) {
    throw new Error(`Geração falhou [${chartType}]: ${String(err)}`);
  }
}

function saveComponent(chartType: ChartType, code: string, iteration: number): string {
  fs.mkdirSync(CHARTS_DIR, { recursive: true });

  const fileName = `${COMPONENT_NAME_MAP[chartType]}.tsx`;
  const filePath = path.join(CHARTS_DIR, fileName);

  if (fs.existsSync(filePath) && iteration > 1) {
    const bak = filePath.replace(".tsx", `-iter${iteration - 1}.bak.tsx`);
    fs.copyFileSync(filePath, bak);
    console.log(`💾 Backup: ${path.basename(bak)}`);
  }

  fs.writeFileSync(filePath, code, "utf-8");
  console.log(`💾 [${chartType}] → ${fileName}`);
  return filePath;
}

export async function calibrate(
  chartType: ChartType,
  config: Partial<CalibrationConfig> = {}
): Promise<CalibrationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let lastResult: CalibrationResult | undefined;

  console.log(`\n${"═".repeat(58)}`);
  console.log(`🚀 CALIBRAÇÃO: ${chartType.toUpperCase()}`);
  console.log(`   Máx: ${cfg.maxIterations} iter | Alvo: ${cfg.targetScore}/8`);
  console.log(`${"═".repeat(58)}`);

  for (let iter = 1; iter <= cfg.maxIterations; iter++) {
    console.log(`\n🔄 [${chartType}] Iteração ${iter}/${cfg.maxIterations}`);
    try {
      const code          = await generateComponent(chartType, lastResult);
      const componentPath = saveComponent(chartType, code, iter);

      invalidateBundleCache(); // invalida APÓS salvar o novo .tsx

      const stillPath = await Promise.race([
        renderCalibrationStill(chartType, iter),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout de renderização (${cfg.renderTimeout}ms)`)), cfg.renderTimeout)
        ),
      ]);

      const result = await auditComponent(chartType, componentPath, stillPath, iter);

      if (cfg.autoSaveRules) writeRulesFile(chartType, result);
      lastResult = result;

      if (result.score >= cfg.targetScore) {
        console.log(`\n🏆 [${chartType}] CALIBRADO em iter ${iter}! Score ${result.score}/8`);
        await renderCalibrationVideo(chartType, iter);
        return { ...result, status: "calibrated" };
      }

      console.log(`⚠️  [${chartType}] Score ${result.score}/8 — próxima iteração...`);

    } catch (err) {
      const msg = String(err);
      console.error(`❌ [${chartType}] Erro iter ${iter}: ${msg}`);
      lastResult ??= {
        chartType, status: "failed", score: 0, dimensions: [],
        rulesPath: "", componentPath: "",
        timestamp: new Date().toISOString(), iteration: iter, errors: [],
      };
      lastResult.errors.push(msg);
    }
  }

  console.warn(`⚠️  [${chartType}] Esgotou ${cfg.maxIterations} iterações`);
  return { ...lastResult!, status: "failed" };
}

export async function calibrateAll(
  chartTypes: ChartType[],
  config: Partial<CalibrationConfig> = {}
): Promise<CalibrationResult[]> {
  const results: CalibrationResult[] = [];

  console.log(`\n${"═".repeat(58)}`);
  console.log(`🎯 LOTE: ${chartTypes.join(" → ")}`);
  console.log(`${"═".repeat(58)}`);

  for (let i = 0; i < chartTypes.length; i++) {
    const type = chartTypes[i];
    console.log(`\n📍 [${i + 1}/${chartTypes.length}] ${type}`);

    const result = await calibrate(type, config);
    results.push(result);
    updateCalibrationStatus(results);

    if (i < chartTypes.length - 1) {
      console.log("⏸️  Aguardando 3s (rate limit)...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const ok   = results.filter((r) => r.status === "calibrated").length;
  const fail = results.filter((r) => r.status === "failed").length;
  console.log(`\n${"═".repeat(58)}`);
  console.log(`🏁 LOTE CONCLUÍDO — ✅ ${ok} | ❌ ${fail} | Total ${results.length}`);
  console.log(`${"═".repeat(58)}\n`);
  return results;
}
