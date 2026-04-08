import * as fs from "fs";
import * as path from "path";

// ─── Caminhos ─────────────────────────────────────────────────────────────────
const BACKUP_DIR = path.resolve(__dirname, "../../agent-backup");
const HISTORY_DIR = path.join(BACKUP_DIR, "history");
const MAIN_BACKUP = path.join(BACKUP_DIR, "SYSTEM_PROMPT.md");

// ─── Garante que as pastas existem ───────────────────────────────────────────
function ensureDirs() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

// ─── Gera timestamp legível ───────────────────────────────────────────────────
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return `${date}_${time}`;
}

// ─── Conteúdo do backup ───────────────────────────────────────────────────────
function gerarConteudoBackup(): string {
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return [
    `# 🎬 GiantAnimator — Backup do Agente`,
    `> Gerado automaticamente em: ${agora}`,
    ``,
    `---`,
    ``,
    `## 🧠 Identidade do Agente`,
    ``,
    `- **Nome do projeto:** GiantAnimator`,
    `- **Modelo Gemini atual:** \`gemini-1.5-pro\` (atualizado de \`gemini-1.5-pro-vision\` — sufixo obsoleto)`,
    `- **Função:** Analisar imagens de gráficos e extrair dados estruturados (ChartData)`,
    ``,
    `---`,
    ``,
    `## 🗂️ Estrutura do Projeto`,
    ``,
    `\`\`\``,
    `GiantAnimator/`,
    `├── server/`,
    `│   ├── index.ts           ← Servidor principal Node.js + TypeScript`,
    `│   ├── agent.ts           ← Agente Gemini (analyzeChartImage)`,
    `│   ├── save-prompt.ts     ← Este script de backup automático`,
    `│   └── debug-watcher.ts  ← Script de diagnóstico do watcher`,
    `├── remotion-project/`,
    `│   └── src/               ← Componentes de animação Remotion`,
    `├── agent-backup/`,
    `│   ├── SYSTEM_PROMPT.md   ← Backup principal (atualizado a cada 5min)`,
    `│   └── history/           ← Histórico com timestamps`,
    `└── shared/`,
    `    └── input/             ← Pasta monitorada para imagens de entrada`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 📦 Estado Atual do agent.ts`,
    ``,
    `\`\`\`typescript`,
    `import { GoogleGenerativeAI } from "@google/generative-ai";`,
    `import * as fs from "fs";`,
    ``,
    `const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);`,
    ``,
    `export interface ChartData {`,
    `  type: "bar" | "line" | "pie";`,
    `  title: string;`,
    `  labels: string[];`,
    `  values: number[];`,
    `  colors?: string[];`,
    `  unit?: string;`,
    `}`,
    ``,
    `export async function analyzeChartImage(imagePath: string): Promise<ChartData> {`,
    `  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });`,
    ``,
    `  const imageData = fs.readFileSync(imagePath);`,
    `  const base64Image = imageData.toString("base64");`,
    `  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";`,
    ``,
    `  const prompt = \`...\\n\`;`,
    ``,
    `  const result = await model.generateContent([`,
    `    prompt,`,
    `    {`,
    `      inlineData: {`,
    `        mimeType,`,
    `        data: base64Image,`,
    `      },`,
    `    },`,
    `  ]);`,
    ``,
    `  const text = result.response.text().trim();`,
    `  `,
    `  try {`,
    `    return JSON.parse(text) as ChartData;`,
    `  } catch {`,
    `    const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);`,
    `    if (jsonMatch) return JSON.parse(jsonMatch[0]);`,
    `    throw new Error("Agente não conseguiu extrair dados do gráfico");`,
    `  }`,
    `}`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 🐛 Bugs Corrigidos`,
    ``,
    `| Data | Bug | Solução |`,
    `|------|-----|---------|`,
    `| 2026-03-31 | \`gemini-1.5-pro-vision\` retornava 404 | Atualizado para \`gemini-1.5-pro\` |`,
    `| 2026-03-31 | Watcher não detectava arquivos | Diagnosticado — ambiente Windows OK, bug era no modelo |`,
    ``,
    `---`,
    ``,
    `## 🔑 Variáveis de Ambiente Necessárias`,
    ``,
    `\`\`\`env`,
    `GEMINI_API_KEY=sua_chave_aqui   # Obter em: aistudio.google.com/app/apikey`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 🚀 Como Retomar o Projeto`,
    ``,
    `\`\`\`bash`,
    `# 1. Instalar dependências`,
    `cd server && npm install`,
    ``,
    `# 2. Criar o .env com a nova API Key`,
    `echo "GEMINI_API_KEY=sua_chave" > .env`,
    ``,
    `# 3. Rodar o servidor`,
    `npx ts-node index.ts`,
    ``,
    `# 4. Jogar uma imagem em shared/input/ e observar o terminal`,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## 📋 Próximos Passos Pendentes`,
    ``,
    `- [ ] Resolver problema da API Key expirada (gerar nova em aistudio.google.com)`,
    `- [ ] Testar pipeline completo com nova chave`,
    `- [ ] Implementar componentes Remotion para renderizar os gráficos animados`,
    `- [ ] Conectar saída do agente com o Remotion`
  ].join("\n");
}

// ─── Função principal de backup ───────────────────────────────────────────────
export function salvarBackup() {
  try {
    ensureDirs();

    const conteudo = gerarConteudoBackup();
    const timestamp = getTimestamp();

    // Salva o backup principal (sempre substituído)
    fs.writeFileSync(MAIN_BACKUP, conteudo, "utf-8");

    // Salva cópia no histórico com timestamp
    const historicoPath = path.join(HISTORY_DIR, `${timestamp}.md`);
    fs.writeFileSync(historicoPath, conteudo, "utf-8");

    console.log(`💾 [${new Date().toLocaleTimeString("pt-BR")}] Backup salvo → agent-backup/SYSTEM_PROMPT.md`);
    console.log(`📚 Histórico salvo → agent-backup/history/${timestamp}.md`);
  } catch (err: any) {
    console.error(`❌ Erro ao salvar backup: ${err.message}`);
  }
}

// ─── Iniciar loop de backup a cada 5 minutos ──────────────────────────────────
export function iniciarBackupAutomatico() {
  console.log("💾 Sistema de backup automático iniciado (intervalo: 5 minutos)");

  // Executa imediatamente ao iniciar
  salvarBackup();

  // Depois a cada 5 minutos
  setInterval(salvarBackup, 5 * 60 * 1000);
}

// ─── Rodar standalone (npx ts-node save-prompt.ts) ───────────────────────────
if (require.main === module) {
  iniciarBackupAutomatico();
}
