/// <reference types="node" />
import "dotenv/config";
import path from "path";
import fs from "fs";
import { agent } from "./agent.js";
const analyzeChart = agent.analyzeChart.bind(agent);
import { PATHS } from "./paths.js";

// ─── Pega o primeiro arquivo de imagem que tiver em GiantAnimator/input ──────────────
const INPUT_DIR = PATHS.input;

if (!fs.existsSync(INPUT_DIR)) {
  fs.mkdirSync(INPUT_DIR, { recursive: true });
}

const arquivos = fs.readdirSync(INPUT_DIR).filter((f) =>
  [".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(f).toLowerCase())
);

if (arquivos.length === 0) {
  console.error(`❌ Nenhuma imagem encontrada em ${INPUT_DIR}`);
  console.error(`   Caminho verificado: ${INPUT_DIR}`);
  console.log("   👉 Jogue uma imagem lá para testar o agente.");
  process.exit(1);
}

const imagePath = path.join(INPUT_DIR, arquivos[0]);
console.log("=".repeat(60));
console.log("🔍 DIAGNÓSTICO DO AGENTE GEMINI");
console.log("=".repeat(60));
console.log(`📁 Imagem:       ${imagePath}`);
console.log(`🔑 API Key:      ${process.env.GEMINI_API_KEY ? "✅ carregada (" + process.env.GEMINI_API_KEY.slice(0, 8) + "...)" : "❌ NÃO ENCONTRADA"}`);
console.log(`📦 Tamanho:      ${(fs.statSync(imagePath).size / 1024).toFixed(1)} KB`);
console.log("=".repeat(60));

// ─── Teste com cada modelo disponível ────────────────────────────────────────
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELOS = [
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash-latest",
  "gemini-pro-vision"
];

async function testarModelo(modelo: string, imagePath: string) {
  console.log(`\n🧪 Testando modelo: ${modelo}`);
  try {
    const model = genAI.getGenerativeModel({ model: modelo });

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString("base64");
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType =
      ext === ".png" ? "image/png" :
      ext === ".webp" ? "image/webp" :
      "image/jpeg";

    const result = await model.generateContent([
      "Descreva brevemente o que você vê nesta imagem em 1 frase.",
      { inlineData: { mimeType, data: base64Image } },
    ]);

    const text = result.response.text().trim();
    console.log(`  ✅ Sucesso! Resposta: "${text.slice(0, 120)}..."`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Falhou: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("\n❌ GEMINI_API_KEY não está no .env!");
    console.error("   Crie o arquivo server/.env com: GEMINI_API_KEY=sua_chave\n");
    process.exit(1);
  }

  // Testa todos os modelos para descobrir qual funciona
  let modeloFuncionando: string | null = null;
  for (const modelo of MODELOS) {
    const ok = await testarModelo(modelo, imagePath);
    if (ok && !modeloFuncionando) modeloFuncionando = modelo;
  }

  console.log("\n" + "=".repeat(60));
  if (modeloFuncionando) {
    console.log(`✅ Modelo funcionando: ${modeloFuncionando}`);
    console.log(`   👉 Use este no agent.ts!`);
  } else {
    console.log("❌ Nenhum modelo funcionou — verifique a API Key e cotas");
  }
  console.log("=".repeat(60));

  // ─── Teste completo do pipeline com o agente real ──────────────────────────
  console.log("\n🚀 Testando pipeline completo (analyzeChart)...");
  try {
    const chartData = await analyzeChart(imagePath);
    console.log("✅ ChartData extraído com sucesso:");
    console.log(JSON.stringify(chartData, null, 2));
  } catch (err: any) {
    console.error("❌ Erro no analyzeChart:", err.message);
    console.error("\n📋 Detalhes completos do erro:");
    console.error(err);
  }
}

main();
