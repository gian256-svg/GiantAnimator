import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const GENERIC_LABEL_RE = /^(item|series|série|category|label|data|valor|coluna|linha|group|grupo|serie|product|produto|option|opção|opcao|element|elemento|type|tipo|class|classe|value|measure|metric|brand|marca|canal|channel|region|região|segment|segmento|driver|player|team|equipe|company|empresa|country|país|pais|sector|setor|variable|variavel|variável|sample|amostra|entry|entrada|row|linha|col|column|tag)\s*\d+$/i;

async function purge() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return console.error("❌ Credenciais Supabase ausentes.");

  const supabase = createClient(url, key);
  const jobsDir = path.join(process.cwd(), '..', 'input', 'jobs');

  console.log("🧹 [PURGE] Iniciando varredura por falsos positivos (Labels Genéricos)...");

  const files = fs.readdirSync(jobsDir).filter(f => f.endsWith('.json'));
  let purgedCount = 0;

  for (const file of files) {
    const filePath = path.join(jobsDir, file);
    let raw = fs.readFileSync(filePath, 'utf-8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // Remove BOM
    let job;
    try {
      job = JSON.parse(raw);
    } catch (e) {
      console.warn(`⚠️ [PURGE] Pulando arquivo corrompido: ${file}`);
      continue;
    }

    if (job.status === 'done' || job.status === 'awaiting_review') {
      const props = job.analysis?.props || job.props || {};
      const labels = [
        ...(props.labels || []),
        ...(props.categories || []),
        ...(Array.isArray(props.data) ? props.data.map((d: any) => d.label) : [])
      ];

      const hasGeneric = labels.some(l => GENERIC_LABEL_RE.test(String(l).trim()));

      if (hasGeneric) {
        console.warn(`🚨 [PURGE] Job ${job.id} contaminado (${labels.find(l => GENERIC_LABEL_RE.test(String(l).trim()))}). Rebaixando para erro...`);
        
        job.status = 'error';
        job.error = "FALSO POSITIVO: Contém labels genéricos alucinados (Product/Option/Item N).";
        
        // Atualiza local
        fs.writeFileSync(filePath, JSON.stringify(job, null, 2));

        // Atualiza Supabase
        await supabase.from('jobs').update({ 
          status: 'error', 
          error: job.error 
        }).eq('id', job.id);

        purgedCount++;
      }
    }
  }

  console.log(`\n✅ [PURGE] Concluído! ${purgedCount} jobs infectados foram removidos/rebaixados.`);
}

purge();
