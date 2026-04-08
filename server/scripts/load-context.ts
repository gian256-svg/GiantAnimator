import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────
//  Caminhos
// ─────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const AGENT_DIR    = path.join(PROJECT_ROOT, ".agent");
const SKILLS_DIR   = path.join(AGENT_DIR, "skills");
const KNOWLEDGE_DIR = path.join(AGENT_DIR, "knowledge");
const BACKUP_DIR   = path.join(PROJECT_ROOT, "agent-backup");
const SYSTEM_PROMPT_FILE = path.join(BACKUP_DIR, "SYSTEM_PROMPT.md");
const CONTEXT_CACHE_FILE = path.join(BACKUP_DIR, "CONTEXT_CACHE.md");

// ─────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────
export interface LoadedContext {
  systemPrompt: string;
  skills: SkillFile[];
  knowledge: KnowledgeFile[];
  fullContext: string;        // tudo concatenado — pronto para injetar no Gemini
  loadedAt: string;
  stats: ContextStats;
}

interface SkillFile {
  name: string;
  path: string;
  content: string;
}

interface KnowledgeFile {
  name: string;
  path: string;
  content: string;
}

interface ContextStats {
  systemPromptChars: number;
  skillsLoaded: number;
  knowledgeFilesLoaded: number;
  totalChars: number;
  estimatedTokens: number;    // estimativa: ~4 chars por token
}

// ─────────────────────────────────────────────
//  Lê o System Prompt
// ─────────────────────────────────────────────
function readSystemPrompt(): string {
  if (!fs.existsSync(SYSTEM_PROMPT_FILE)) {
    console.warn("⚠️  [CONTEXT] SYSTEM_PROMPT.md não encontrado em agent-backup/");
    return "";
  }
  const content = fs.readFileSync(SYSTEM_PROMPT_FILE, "utf-8").trim();
  console.log(`✅ [CONTEXT] System prompt carregado (${content.length} chars)`);
  return content;
}

// ─────────────────────────────────────────────
//  Lê todas as Skills em .agent/skills/
// ─────────────────────────────────────────────
function readAllSkills(): SkillFile[] {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.warn("⚠️  [CONTEXT] Pasta .agent/skills/ não encontrada.");
    return [];
  }

  const skills: SkillFile[] = [];

  const skillFolders = fs.readdirSync(SKILLS_DIR).filter((entry) => {
    return fs.statSync(path.join(SKILLS_DIR, entry)).isDirectory();
  });

  for (const folder of skillFolders) {
    const skillMdPath = path.join(SKILLS_DIR, folder, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) {
      console.warn(`⚠️  [CONTEXT] Skill sem SKILL.md ignorada: ${folder}`);
      continue;
    }

    const content = fs.readFileSync(skillMdPath, "utf-8").trim();
    skills.push({ name: folder, path: skillMdPath, content });
    console.log(`📦 [CONTEXT] Skill carregada: ${folder} (${content.length} chars)`);
  }

  return skills;
}

// ─────────────────────────────────────────────
//  Lê todos os arquivos em .agent/knowledge/
// ─────────────────────────────────────────────
function readAllKnowledge(): KnowledgeFile[] {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.warn("⚠️  [CONTEXT] Pasta .agent/knowledge/ não encontrada.");
    return [];
  }

  const knowledgeFiles: KnowledgeFile[] = [];

  // Ordem de prioridade: TRAINING_LOG primeiro, depois os demais
  const PRIORITY_ORDER = [
    "TRAINING_LOG.md",
    "known-issues.md",
    "project-conventions.md",
  ];

  const allFiles = fs.readdirSync(KNOWLEDGE_DIR).filter((f) =>
    f.endsWith(".md")
  );

  // Ordena: prioritários primeiro, depois o restante alfabeticamente
  const sorted = [
    ...PRIORITY_ORDER.filter((f) => allFiles.includes(f)),
    ...allFiles
      .filter((f) => !PRIORITY_ORDER.includes(f))
      .sort(),
  ];

  for (const fileName of sorted) {
    const filePath = path.join(KNOWLEDGE_DIR, fileName);
    const content = fs.readFileSync(filePath, "utf-8").trim();

    if (!content || content.length < 10) {
      console.warn(`⚠️  [CONTEXT] Knowledge vazio ignorado: ${fileName}`);
      continue;
    }

    knowledgeFiles.push({ name: fileName, path: filePath, content });
    console.log(`🧠 [CONTEXT] Knowledge carregado: ${fileName} (${content.length} chars)`);
  }

  return knowledgeFiles;
}

// ─────────────────────────────────────────────
//  Monta o contexto completo formatado
// ─────────────────────────────────────────────
function buildFullContext(
  systemPrompt: string,
  skills: SkillFile[],
  knowledge: KnowledgeFile[]
): string {
  const separator = "\n\n" + "═".repeat(60) + "\n\n";
  const parts: string[] = [];

  // 1. System Prompt
  if (systemPrompt) {
    parts.push(
      `# ── SYSTEM PROMPT ──\n\n${systemPrompt}`
    );
  }

  // 2. Skills
  if (skills.length > 0) {
    const skillsBlock = skills
      .map((s) => `## SKILL: ${s.name}\n\n${s.content}`)
      .join("\n\n---\n\n");
    parts.push(`# ── AGENT SKILLS ──\n\n${skillsBlock}`);
  }

  // 3. Knowledge Base
  if (knowledge.length > 0) {
    const knowledgeBlock = knowledge
      .map((k) => `## KNOWLEDGE: ${k.name}\n\n${k.content}`)
      .join("\n\n---\n\n");
    parts.push(`# ── KNOWLEDGE BASE ──\n\n${knowledgeBlock}`);
  }

  return parts.join(separator);
}

// ─────────────────────────────────────────────
//  Salva cache do contexto (para debug e auditoria)
// ─────────────────────────────────────────────
function saveContextCache(context: string): void {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const header =
      `<!-- GiantAnimator Context Cache -->\n` +
      `<!-- Gerado em: ${new Date().toISOString()} -->\n` +
      `<!-- NÃO EDITE MANUALMENTE — gerado por load-context.ts -->\n\n`;

    fs.writeFileSync(CONTEXT_CACHE_FILE, header + context, "utf-8");
    console.log(`💾 [CONTEXT] Cache salvo em: agent-backup/CONTEXT_CACHE.md`);
  } catch (err: any) {
    console.warn(`⚠️  [CONTEXT] Não foi possível salvar cache: ${err.message}`);
  }
}

// ─────────────────────────────────────────────
//  Função principal — exportada para uso no agente
// ─────────────────────────────────────────────
export function loadFullContext(options?: {
  saveCache?: boolean;   // padrão: true
  verbose?: boolean;     // padrão: true
}): LoadedContext {
  const { saveCache = true, verbose = true } = options ?? {};

  if (verbose) {
    console.log("\n🚀 [CONTEXT] Carregando contexto completo do GiantAnimator...");
    console.log("─".repeat(55));
  }

  const systemPrompt = readSystemPrompt();
  const skills       = readAllSkills();
  const knowledge    = readAllKnowledge();
  const fullContext  = buildFullContext(systemPrompt, skills, knowledge);

  const stats: ContextStats = {
    systemPromptChars:    systemPrompt.length,
    skillsLoaded:         skills.length,
    knowledgeFilesLoaded: knowledge.length,
    totalChars:           fullContext.length,
    estimatedTokens:      Math.round(fullContext.length / 4),
  };

  if (saveCache) saveContextCache(fullContext);

  if (verbose) {
    console.log("─".repeat(55));
    console.log(`📊 [CONTEXT] Resumo:`);
    console.log(`   System Prompt : ${stats.systemPromptChars} chars`);
    console.log(`   Skills        : ${stats.skillsLoaded} carregadas`);
    console.log(`   Knowledge     : ${stats.knowledgeFilesLoaded} arquivos`);
    console.log(`   Total         : ${stats.totalChars} chars (~${stats.estimatedTokens} tokens)`);
    console.log("─".repeat(55) + "\n");
  }

  return {
    systemPrompt,
    skills,
    knowledge,
    fullContext,
    loadedAt: new Date().toISOString(),
    stats,
  };
}

// ─────────────────────────────────────────────
//  Retorna só o fullContext como string pura
//  Atalho para injetar diretamente no Gemini
// ─────────────────────────────────────────────
export function getContextString(): string {
  return loadFullContext({ saveCache: false, verbose: false }).fullContext;
}
