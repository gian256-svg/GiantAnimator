import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { syncPipelineJob } from '../supabaseService.js';

async function resync() {
  const jobsDir = path.join(process.cwd(), '..', 'input', 'jobs');
  if (!fs.existsSync(jobsDir)) {
    console.error("❌ Pasta input/jobs não encontrada.");
    return;
  }

  const files = fs.readdirSync(jobsDir).filter(f => f.endsWith('.json'));
  console.log(`🔄 [RE-SYNC] Iniciando sincronização de ${files.length} jobs encontrados no disco...`);

  let success = 0;
  let fail = 0;

  for (const file of files) {
    try {
      const job = JSON.parse(fs.readFileSync(path.join(jobsDir, file), 'utf-8'));
      // Sincroniza cada job individualmente
      await syncPipelineJob(job);
      success++;
      if (success % 20 === 0) console.log(`  > ${success}/${files.length} jobs sincronizados...`);
    } catch (e) {
      fail++;
    }
  }

  console.log(`\n✅ [RE-SYNC] Concluído! Sucessos: ${success}, Falhas: ${fail}`);
}

resync();
