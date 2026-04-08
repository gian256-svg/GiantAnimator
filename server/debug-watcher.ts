/// <reference types="node" />
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { PATHS } from "./paths.js";

// ─── Configuração ─────────────────────────────────────────────────────────────
const INPUT_DIR = PATHS.input;

function toUnixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

console.log("=".repeat(60));
console.log("🔍 DIAGNÓSTICO DO WATCHER");
console.log("=".repeat(60));
console.log(`📁 Caminho centralizado (PATHS.input): ${INPUT_DIR}`);
console.log(`📁 Caminho convertido (unix):         ${toUnixPath(INPUT_DIR)}`);
console.log(`📂 Pasta existe?                      ${fs.existsSync(INPUT_DIR)}`);
console.log(`📄 Arquivos na pasta agora:           ${fs.readdirSync(INPUT_DIR).join(", ") || "(vazia)"}`);
console.log("=".repeat(60));

// ─── Teste 1: fs.watch nativo do Node ─────────────────────────────────────────
console.log("\n🧪 TESTE 1 — fs.watch nativo do Node.js");
try {
  fs.watch(INPUT_DIR, { recursive: false }, (event: string, filename: string | Buffer | null) => {
    console.log(`  ✅ fs.watch detectou: evento="${event}" arquivo="${filename}"`);
  });
  console.log("  fs.watch iniciado com sucesso");
} catch (err: any) {
  console.error(`  ❌ fs.watch falhou: ${err.message}`);
}

// ─── Teste 2: chokidar SEM polling ────────────────────────────────────────────
console.log("\n🧪 TESTE 2 — chokidar SEM polling (eventos nativos)");
const watcherNative = chokidar.watch(toUnixPath(INPUT_DIR), {
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 1000,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 500,
  },
});

watcherNative
  .on("ready", () => console.log("  ✅ chokidar nativo: pronto"))
  .on("add",   (f: string) => console.log(`  ✅ chokidar nativo DETECTOU: ${f}`))
  .on("error", (e: any) => console.error(`  ❌ chokidar nativo erro: ${e}`));

// ─── Teste 3: chokidar COM polling ────────────────────────────────────────────
console.log("\n🧪 TESTE 3 — chokidar COM polling (usePolling: true)");
const watcherPoll = chokidar.watch(toUnixPath(INPUT_DIR), {
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 500,
});

watcherPoll
  .on("ready", () => console.log("  ✅ chokidar polling: pronto"))
  .on("add",   (f: string) => console.log(`  ✅ chokidar polling DETECTOU: ${f}`))
  .on("error", (e: any) => console.error(`  ❌ chokidar polling erro: ${e}`));

// ─── Teste 4: leitura manual da pasta a cada 3s ───────────────────────────────
console.log("\n🧪 TESTE 4 — leitura manual da pasta a cada 3 segundos");
let arquivosConhecidos = new Set(fs.readdirSync(INPUT_DIR));
console.log(`  Arquivos conhecidos no início: [${[...arquivosConhecidos].join(", ") || "nenhum"}]`);

setInterval(() => {
  const agora = new Set(fs.readdirSync(INPUT_DIR));
  for (const arquivo of agora) {
    if (!arquivosConhecidos.has(arquivo)) {
      console.log(`  ✅ LEITURA MANUAL detectou novo arquivo: ${arquivo}`);
      arquivosConhecidos.add(arquivo);
    }
  }
}, 3000);

console.log(`\n⏳ Aguardando... Jogue um arquivo em ${INPUT_DIR} agora!\n`);
