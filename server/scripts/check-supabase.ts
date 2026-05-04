import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

if (!url || !key) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log(`\n🔌 Conectando em ${url}\n`);

  // Verifica jobs
  const { data: jobs, error: jobsErr, count: jobsCount } = await db
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  if (jobsErr) {
    console.error('❌ Tabela JOBS:', jobsErr.message);
  } else {
    console.log(`✅ Tabela JOBS: OK (${jobsCount ?? 0} registros)`);
  }

  // Verifica component_registry
  const { data: registry, error: regErr } = await db
    .from('component_registry')
    .select('id, description');

  if (regErr) {
    console.error('❌ Tabela COMPONENT_REGISTRY:', regErr.message);
  } else {
    console.log(`✅ Tabela COMPONENT_REGISTRY: OK (${registry?.length ?? 0} componentes)`);
    if (registry?.length) {
      registry.forEach(r => console.log(`   • ${r.id}: ${r.description}`));
    } else {
      console.log('   ⚠️  Vazia — o seed roda automaticamente ao iniciar o servidor.');
    }
  }

  console.log('\n✅ Verificação concluída.\n');
}

main().catch(console.error);
