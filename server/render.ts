// server/render.ts
import fs      from "fs";
import path    from "path";
import chokidar from "chokidar";
import { agent } from "./agent.js";                          // ✅ path correto
import { invalidateBundleCache } from "./calibration/render-tester.js"; // ✅ path correto

const INPUT_DIR  = path.normalize("C:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/shared/input");
const OUTPUT_DIR = path.normalize("C:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/shared/output");

// Extensões de imagem aceitas
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const DATA_EXTS  = new Set([".json"]);

// ─────────────────────────────────────────────────────────
// Processa uma imagem recebida em shared/input
// ─────────────────────────────────────────────────────────
async function processInputImage(filePath: string): Promise<void> {
  const ext  = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);

  if (!IMAGE_EXTS.has(ext) && !DATA_EXTS.has(ext)) {
    console.log(`⏭️  [Render] Ignorando (formato não suportado): ${name}`);
    return;
  }

  // Espera o arquivo terminar de ser escrito (evita leitura parcial)
  await new Promise((r) => setTimeout(r, 500));

  if (!fs.existsSync(filePath)) return; // arquivo pode ter sido removido

  try {
    let result: string;
    let chartType: string = "unknown";

    if (DATA_EXTS.has(ext)) {
      console.log(`📊 [Render] Novo arquivo de dados detectado: ${name}`);
      const data = fs.readFileSync(filePath, "utf-8");
      
      const instruction = `
Gere um componente Remotion TypeScript completo baseado nestes dados JSON abaixo.
Siga as Regras de Ouro do GiantAnimator (Spring configs no topo, sem window/document).
Dados:
${data}
`.trim();

      result = await agent.sendMessage(instruction);
      chartType = JSON.parse(data).type || "chart";
    } else {
      console.log(`🖼️  [Render] Nova imagem detectada: ${name}`);
      const instruction = `
Analise este gráfico de referência e gere um componente Remotion TypeScript completo.
REGRA #1: Replique o layout FIELMENTE — cores, proporções, tipografia, grid.
Não invente melhorias. Siga o original.
`.trim();
      result = await agent.analyzeChart(filePath, instruction);
      chartType = "extracted-chart";
    }

    // Extrai código TSX do markdown
    const codeMatch = result.match(/```(?:tsx?|typescript)?\n([\s\S]*?)```/);
    const code      = codeMatch ? codeMatch[1] : result;

    if (code.trim().length > 200) {
      // Salva o componente gerado em remotion-project/src/charts/
      // Tenta inferir nome do componente ou usa um timestamp
      const componentName = `Generated${Date.now()}`;
      const chartsDir     = path.resolve("remotion-project/src/charts");
      fs.mkdirSync(chartsDir, { recursive: true });
      
      // Se for JSON e tiver um tipo conhecido, tenta mapear para o arquivo certo
      // Para o teste, vamos apenas LOGAR se funcionaria, mas o usuário quer AUTOMATION
      // Então vamos salvar como "GeneratedTest.tsx" para o teste
      const targetFile = path.join(chartsDir, `${componentName}.tsx`);
      fs.writeFileSync(targetFile, code, "utf-8");
      console.log(`💾 [Render] Componente salvo: charts/${componentName}.tsx`);
    }

    // Salva o log completo em shared/output
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputFile = path.join(
      OUTPUT_DIR,
      `${path.basename(filePath, ext)}-${Date.now()}.md`
    );
    fs.writeFileSync(outputFile, result, "utf-8");
    console.log(`✅ [Render] Resultado salvo em output: ${path.basename(outputFile)}`);

    // Move arquivo processado para subpasta "done"
    const doneDir = path.join(INPUT_DIR, "done");
    fs.mkdirSync(doneDir, { recursive: true });
    fs.renameSync(filePath, path.join(doneDir, name));
    console.log(`📦 [Render] Arquivo movido para: done/${name}`);

  } catch (err) {
    console.error(`❌ [Render] Erro ao processar ${name}:`, err);
  }
}

// ─────────────────────────────────────────────────────────
// Watcher — monitora shared/input continuamente
// ─────────────────────────────────────────────────────────
export function startRenderWatcher(): void {
  fs.mkdirSync(INPUT_DIR,  { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`👁️  [Render] Monitorando: ${INPUT_DIR}`);

  const watcher = chokidar.watch(INPUT_DIR, {
    ignored:        /(^|[/\\])\../,   // ignora arquivos ocultos
    persistent:     true,
    ignoreInitial:  false,             // processa arquivos já presentes ao subir
    usePolling:     true,              // ✅ Necessário em Windows para paths externos
    interval:       1000,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval:       100,
    },
  });

  watcher.on("add", (filePath) => {
    console.log(`🔍 [Watcher] Novo arquivo visto (Chokidar): ${filePath}`);
    const currentDir = path.normalize(path.dirname(filePath)).toLowerCase();
    const targetDir  = path.normalize(INPUT_DIR).toLowerCase();
    if (currentDir !== targetDir) return;
    processInputImage(filePath).catch((err) => console.error("❌ [Render] error:", err));
  });

  // Camada 2: Polling manual (Fallback para Windows/Network drives)
  setInterval(() => {
    if (!fs.existsSync(INPUT_DIR)) return;
    const files = fs.readdirSync(INPUT_DIR);
    for (const file of files) {
      const fullPath = path.join(INPUT_DIR, file);
      if (fs.statSync(fullPath).isFile()) {
        processInputImage(fullPath).catch(() => {});
      }
    }
  }, 5000);

  watcher.on("error", (err) => console.error("❌ [Render] Watcher error:", err));
}
