import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import { agent } from "./agent.js";
const analyzeChart = agent.analyzeChart.bind(agent);
// import { analyzeAnimationFrames } from './agent.js'; // ⚠️ Método removido/refatorado

async function main() {
  const baseDir = path.resolve(__dirname, '../knowledge-base/frames');
  const dirs = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  
  const targets = dirs.filter(d => d !== 'linechart_bloomberg_00001').slice(0, 5);
  console.log('📌 Testando agent.ts:', targets);

  for (const dirName of targets) {
    try {
      const dirPath = path.join(baseDir, dirName);
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));
      console.log(`🔍 Processando ${dirName} (${files.length} frames)...`);
      
      const result = await analyzeChart(dirPath);
      console.log(`✅ Resultado de ${dirName}:`, JSON.stringify(result, null, 2));
    } catch(err: any) {
      console.error(`❌ Erro em ${dirName}:`, err.message);
    }
  }
}

main().catch(console.error);
