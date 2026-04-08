import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });
import { analyzeAnimationFrames } from './agent';

async function main() {
  const baseDir = path.resolve(__dirname, '../knowledge-base/frames');
  const dirs = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  
  const targets = dirs.filter(d => d !== 'linechart_bloomberg_00001').slice(0, 5);
  console.log('📌 Testando agent.ts:', targets);

  for (const dirName of targets) {
    const dirPath = path.join(baseDir, dirName);
    const files = fs.readdirSync(dirPath).filter(f=>f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'))
      .map(f => path.join(dirPath, f));
      
    if (files.length === 0) continue;

    console.log(`\n🚀 Extracao via agent.ts do folder: ${dirName}`);
    try {
      const parsed = await analyzeAnimationFrames(files);
      console.log(`✅ Resultado:`, parsed);
    } catch(err: any) {
      console.error(`❌ Erro em ${dirName}:`, err.message);
    }
  }
}

main().catch(console.error);
