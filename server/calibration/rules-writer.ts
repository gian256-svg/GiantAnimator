// server/calibration/rules-writer.ts
import fs   from "fs";
import path from "path";
import type { CalibrationResult, ChartType } from "./types.js";
import { COMPONENT_NAME_MAP, CHART_TYPE_LABELS } from "./constants.js";  // ✅ sem circular

const KNOWLEDGE_DIR = path.resolve(".agent/knowledge");

export function writeRulesFile(
  chartType: ChartType,
  result: CalibrationResult
): string {
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });

  const rulesPath = path.join(KNOWLEDGE_DIR, `${chartType}-rules.md`);
  const date      = new Date().toISOString().split("T")[0];
  const emoji     = result.score >= 8 ? "🟢" : result.score >= 5 ? "🟡" : "🔴";
  const status    = `${emoji} ${result.score >= 8 ? "Calibrado" : `Parcial (${result.score}/8)`}`;

  const passed = result.dimensions.filter((d) => d.passed);
  const failed = result.dimensions.filter((d) => !d.passed);

  const content = `# ${CHART_TYPE_LABELS[chartType]} — Calibration Rules
> Status: ${status}
> Atualizado: ${date} | Iteração: ${result.iteration} | Score: ${result.score}/8
> Componente: \`remotion-project/src/charts/${COMPONENT_NAME_MAP[chartType]}.tsx\`

---

## 📐 Regras Visuais
${passed
  .filter((d) => ["proporções", "cores", "grid"].includes(d.name))
  .map((d) => `- **${d.name}**: ${d.notes}`)
  .join("\n") || "- Pendente calibração"}

## 🎬 Regras de Animação
${passed
  .filter((d) => d.name === "animação")
  .map((d) => `- ${d.notes}`)
  .join("\n") || "- Pendente calibração"}

## 🏷️ Regras de Labels
${passed
  .filter((d) => ["labels", "legenda"].includes(d.name))
  .map((d) => `- **${d.name}**: ${d.notes}`)
  .join("\n") || "- Pendente calibração"}

## 🛡️ Edge Cases Resolvidos
${result.errors.length > 0
  ? result.errors.map((e) => `- ${e}`).join("\n")
  : "- Nenhum issue registrado"}

${failed.length > 0
  ? `## ❌ Dimensões Pendentes\n${failed.map((d) => `- **${d.name}**: ${d.notes}`).join("\n")}`
  : ""}

## ✅ Checklist
${result.dimensions.map((d) => `- [${d.passed ? "x" : " "}] ${d.name}`).join("\n")}
`;

  fs.writeFileSync(rulesPath, content, "utf-8");
  console.log(`📝 [${chartType}] Rules salvo`);
  return rulesPath;
}

export function updateCalibrationStatus(results: CalibrationResult[]): void {
  const statusPath = path.join(KNOWLEDGE_DIR, "calibration-status.md");
  const date       = new Date().toISOString().split("T")[0];

  const calibrated = results.filter((r) => r.score >= 8).length;
  const partial    = results.filter((r) => r.score > 0 && r.score < 8).length;
  const failed     = results.filter((r) => r.score === 0).length;

  const rows = results.map((r) => {
    const e = r.score >= 8 ? "🟢" : r.score > 0 ? "🟡" : "🔴";
    const label = (CHART_TYPE_LABELS[r.chartType] ?? r.chartType).padEnd(22);
    return `| ${label} | ${e} ${r.score}/8 | iter ${r.iteration} | ${r.timestamp.split("T")[0]} |`;
  });

  const content = `# GiantAnimator — Status de Calibração
> Atualizado: ${date} (automático)
> ✅ Calibrados: **${calibrated}** | 🟡 Parciais: **${partial}** | 🔴 Falhos: **${failed}**

---

## Tabela de Status

| Componente              | Score   | Iteração | Data       |
|-------------------------|---------|----------|------------|
${rows.join("\n")}

---

## 📋 8 Dimensões de Auditoria
1. **proporções**    — barW, padding, espaçamento
2. **cores**         — fidelidade hex vs referência
3. **grid**          — dashes, opacidade correta
4. **animação**      — tipo, duração, easing, spring config
5. **labels**        — formato k/M, posição, rotação
6. **legenda**       — só renderiza se visível no original
7. **edge-cases**    — Array.isArray, barH<30px, divisão por zero
8. **multi-dataset** — múltiplas séries com cores distintas
`;

  fs.writeFileSync(statusPath, content, "utf-8");
  console.log("📊 calibration-status.md atualizado");
}
