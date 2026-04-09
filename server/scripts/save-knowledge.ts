import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadFullContext } from "./load-context.js";
import { agentEvents } from "../events.js";
import { agent } from "../agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
//  Caminhos
// ─────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const KNOWLEDGE_DIR = path.join(PROJECT_ROOT, ".agent", "knowledge");
const TRAINING_LOG = path.join(KNOWLEDGE_DIR, "TRAINING_LOG.md");
const KNOWN_ISSUES = path.join(KNOWLEDGE_DIR, "known-issues.md");
const CONVENTIONS = path.join(KNOWLEDGE_DIR, "project-conventions.md");

// ─────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────
export type KnowledgeCategory =
  | "INFRAESTRUTURA"
  | "DETECÇÃO DE ARQUIVOS"
  | "INICIALIZAÇÃO"
  | "ESTRUTURA DE PASTAS"
  | "RENDERIZAÇÃO"
  | "COMPONENTE REMOTION"
  | "CONFIGURAÇÃO"
  | "CORREÇÃO DE BUG"
  | "CONVENÇÃO"
  | "OUTRO";

export interface TrainingEntry {
  category: KnowledgeCategory;
  learned: string;       // O que foi aprendido
  context: string;       // Por que é importante
  applyWhen: string;     // Quando aplicar
}

export interface KnownIssue {
  title: string;
  symptom: string;
  cause: string;
  solution: string;
}

export interface Convention {
  section: string;       // Ex: "TypeScript", "Git", "Logs"
  rule: string;          // A regra em si
}

// ─────────────────────────────────────────────
//  Garante que as pastas existem
// ─────────────────────────────────────────────
function ensureKnowledgeDir(): void {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    console.log(`📁 [KNOWLEDGE] Pasta criada: ${KNOWLEDGE_DIR}`);
  }
}

// ─────────────────────────────────────────────
//  Formata data no padrão do projeto
// ─────────────────────────────────────────────
function formatDate(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─────────────────────────────────────────────
//  Verifica se entrada já existe (evita duplicatas)
// ─────────────────────────────────────────────
function isDuplicate(filePath: string, content: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const existing = fs.readFileSync(filePath, "utf-8");
  // Normaliza espaços e compara trechos-chave
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  return normalize(existing).includes(normalize(content.slice(0, 80)));
}

// ─────────────────────────────────────────────
//  Salva entrada no TRAINING_LOG.md
// ─────────────────────────────────────────────
export function saveTrainingEntry(entry: TrainingEntry): void {
  ensureKnowledgeDir();

  // Cria arquivo com cabeçalho se não existir
  if (!fs.existsSync(TRAINING_LOG)) {
    const header = `# Training Log — GiantAnimator\n\nHistórico de aprendizados do agente. Atualizado automaticamente.\n\n---\n\n`;
    fs.writeFileSync(TRAINING_LOG, header, "utf-8");
    console.log(`📝 [KNOWLEDGE] TRAINING_LOG.md criado.`);
  }

  const block = `## [${formatDate()}] — ${entry.category}
**Aprendi:** ${entry.learned}
**Contexto:** ${entry.context}
**Aplicar quando:** ${entry.applyWhen}

---

`;

  // Evita duplicatas
  if (isDuplicate(TRAINING_LOG, entry.learned)) {
    console.log(`⚠️  [KNOWLEDGE] Entrada duplicada ignorada: "${entry.learned.slice(0, 60)}..."`);
    return;
  }

  fs.appendFileSync(TRAINING_LOG, block, "utf-8");
  console.log(`✅ [KNOWLEDGE] Aprendizado registrado: [${entry.category}] ${entry.learned.slice(0, 60)}...`);
}

// ─────────────────────────────────────────────
//  Salva problema conhecido no known-issues.md
// ─────────────────────────────────────────────
export function saveKnownIssue(issue: KnownIssue): void {
  ensureKnowledgeDir();

  if (!fs.existsSync(KNOWN_ISSUES)) {
    const header = `# Problemas Conhecidos e Soluções — GiantAnimator\n\n---\n\n`;
    fs.writeFileSync(KNOWN_ISSUES, header, "utf-8");
    console.log(`📝 [KNOWLEDGE] known-issues.md criado.`);
  }

  const block = `## ❌ Problema: ${issue.title}
**Sintoma:** ${issue.symptom}
**Causa:** ${issue.cause}
**Solução:** ${issue.solution}

---

`;

  if (isDuplicate(KNOWN_ISSUES, issue.title)) {
    console.log(`⚠️  [KNOWLEDGE] Issue duplicada ignorada: "${issue.title}"`);
    return;
  }

  fs.appendFileSync(KNOWN_ISSUES, block, "utf-8");
  console.log(`✅ [KNOWLEDGE] Issue registrada: "${issue.title}"`);
}

// ─────────────────────────────────────────────
//  Salva convenção no project-conventions.md
// ─────────────────────────────────────────────
export function saveConvention(convention: Convention): void {
  ensureKnowledgeDir();

  if (!fs.existsSync(CONVENTIONS)) {
    const header = `# Convenções do Projeto — GiantAnimator\n\n---\n\n`;
    fs.writeFileSync(CONVENTIONS, header, "utf-8");
    console.log(`📝 [KNOWLEDGE] project-conventions.md criado.`);
  }

  const block = `## ${convention.section}\n- ${convention.rule}\n\n`;

  if (isDuplicate(CONVENTIONS, convention.rule)) {
    console.log(`⚠️  [KNOWLEDGE] Convenção duplicada ignorada: "${convention.rule.slice(0, 60)}"`);
    return;
  }

  fs.appendFileSync(CONVENTIONS, block, "utf-8");
  console.log(`✅ [KNOWLEDGE] Convenção registrada: [${convention.section}] ${convention.rule.slice(0, 60)}...`);
}

// ─────────────────────────────────────────────
//  Lê e retorna todo o knowledge base como string
//  (usado pelo agente para carregar contexto)
// ─────────────────────────────────────────────
export function loadKnowledgeBase(): string {
  ensureKnowledgeDir();

  const files = [
    { label: "TRAINING LOG", path: TRAINING_LOG },
    { label: "KNOWN ISSUES", path: KNOWN_ISSUES },
    { label: "CONVENTIONS",  path: CONVENTIONS  },
  ];

  const sections: string[] = [];

  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const content = fs.readFileSync(file.path, "utf-8").trim();
      sections.push(`\n\n# ═══ ${file.label} ═══\n\n${content}`);
    } else {
      sections.push(`\n\n# ═══ ${file.label} ═══\n\n(vazio)`);
    }
  }

  console.log(`📚 [KNOWLEDGE] Knowledge base carregado (${sections.length} seções).`);
  return sections.join("\n");
}

// ─────────────────────────────────────────────
//  Lista um resumo do que está salvo
// ─────────────────────────────────────────────
export function listKnowledgeSummary(): void {
  ensureKnowledgeDir();

  console.log("\n📚 [KNOWLEDGE] Resumo do Knowledge Base:");
  console.log("─────────────────────────────────────────");

  const files = [
    { label: "Training Log",   path: TRAINING_LOG },
    { label: "Known Issues",   path: KNOWN_ISSUES },
    { label: "Conventions",    path: CONVENTIONS  },
  ];

  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const content = fs.readFileSync(file.path, "utf-8");
      const entries = (content.match(/^## /gm) || []).length;
      const size = (fs.statSync(file.path).size / 1024).toFixed(1);
      console.log(`  ✅ ${file.label.padEnd(16)} → ${entries} entradas  (${size} KB)`);
    } else {
      console.log(`  ⬜ ${file.label.padEnd(16)} → (não criado ainda)`);
    }
  }

  console.log("─────────────────────────────────────────\n");
}

// ─────────────────────────────────────────────
//  Endpoint Express — expõe o knowledge via API
//  (importar no server/index.ts)
// ─────────────────────────────────────────────
import { Router, Request, Response } from "express";

export const knowledgeRouter = Router();

// GET /knowledge — retorna todo o knowledge base
knowledgeRouter.get("/", (_req: Request, res: Response) => {
  const kb = loadKnowledgeBase();
  res.status(200).json({ status: "ok", content: kb });
});

// GET /knowledge/summary — resumo das entradas
knowledgeRouter.get("/summary", (_req: Request, res: Response) => {
  const summary: Record<string, { entries: number; sizeKB: string }> = {};

  for (const [key, filePath] of Object.entries({
    trainingLog: TRAINING_LOG,
    knownIssues: KNOWN_ISSUES,
    conventions:  CONVENTIONS,
  })) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      summary[key] = {
        entries: (content.match(/^## /gm) || []).length,
        sizeKB: (fs.statSync(filePath).size / 1024).toFixed(1),
      };
    } else {
      summary[key] = { entries: 0, sizeKB: "0.0" };
    }
  }

  res.status(200).json({ status: "ok", summary });
});

// POST /knowledge/training — salva novo aprendizado
knowledgeRouter.post("/training", (req: Request, res: Response) => {
  const { category, learned, context, applyWhen } = req.body as TrainingEntry;

  if (!category || !learned || !context || !applyWhen) {
    res.status(400).json({ status: "error", message: "Campos obrigatórios: category, learned, context, applyWhen" });
    return;
  }

  try {
    saveTrainingEntry({ category, learned, context, applyWhen });
    res.status(201).json({ status: "ok", message: "Aprendizado registrado com sucesso." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /knowledge/issue — salva problema conhecido
knowledgeRouter.post("/issue", (req: Request, res: Response) => {
  const { title, symptom, cause, solution } = req.body as KnownIssue;

  if (!title || !symptom || !cause || !solution) {
    res.status(400).json({ status: "error", message: "Campos obrigatórios: title, symptom, cause, solution" });
    return;
  }

  try {
    saveKnownIssue({ title, symptom, cause, solution });
    res.status(201).json({ status: "ok", message: "Issue registrada com sucesso." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /knowledge/convention — salva convenção
knowledgeRouter.post("/convention", (req: Request, res: Response) => {
  const { section, rule } = req.body as Convention;

  if (!section || !rule) {
    res.status(400).json({ status: "error", message: "Campos obrigatórios: section, rule" });
    return;
  }

  try {
    saveConvention({ section, rule });
    res.status(201).json({ status: "ok", message: "Convenção registrada com sucesso." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /knowledge/reload — desacoplado via evento (evita circular import)
knowledgeRouter.post("/reload", (_req: Request, res: Response) => {
  try {
    agentEvents.emit("reload-requested");
    res.status(200).json({
      status: "ok",
      message: "Reload solicitado. Agente será reiniciado em instantes.",
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
