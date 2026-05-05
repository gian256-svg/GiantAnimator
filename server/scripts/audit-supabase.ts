import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function check() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    console.error("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_KEY não definidos no .env");
    return;
  }

  const supabase = createClient(url, key);
  
  // 1. Contagem no Supabase
  const { count, error } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error("❌ Erro ao consultar Supabase:", error.message);
    return;
  }

  // 2. Contagem Local
  const jobsDir = path.join(process.cwd(), '..', 'input', 'jobs');
  const localFiles = fs.existsSync(jobsDir) ? fs.readdirSync(jobsDir).filter(f => f.endsWith('.json')).length : 0;

  console.log("\n📊 --- AUDITORIA DE DADOS REAL ---");
  console.log(`☁️  Supabase (Total de Linhas): ${count}`);
  console.log(`💻  Local (input/jobs/*.json): ${localFiles}`);
  
  if (count < localFiles * 0.8) {
    console.warn("⚠️  ALERTA: Discrepância detectada! O Supabase tem muito menos dados que o local.");
  } else {
    console.log("✅  Sincronização saudável. Os dados estão sendo inseridos.");
  }
}

check();
