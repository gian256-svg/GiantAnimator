import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function checkSupabaseStatus() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('❌ Credenciais do Supabase não encontradas no .env');
    return;
  }

  const supabase = createClient(url, key);

  console.log('📡 Conectando ao Supabase...');

  // 1. Check jobs
  const { count: jobCount, error: jobError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });
  
  if (jobError) console.error('❌ Erro ao contar jobs:', jobError.message);
  else console.log(`📦 Jobs registrados: ${jobCount}`);

  // 2. Check components
  const { count: compCount, error: compError } = await supabase
    .from('component_registry')
    .select('*', { count: 'exact', head: true });
  
  if (compError) console.error('❌ Erro ao contar componentes:', compError.message);
  else console.log(`🧩 Componentes no registry: ${compCount}`);

  // 3. Check knowledge
  const { count: knowCount, error: knowError } = await supabase
    .from('knowledge')
    .select('*', { count: 'exact', head: true });
  
  if (knowError) console.error('❌ Erro ao contar knowledge:', knowError.message);
  else console.log(`📖 Itens de conhecimento (rules/logs): ${knowCount}`);

  // 4. Check learnings
  const { count: learnCount, error: learnError } = await supabase
    .from('learnings')
    .select('*', { count: 'exact', head: true });
  
  if (learnError) console.error('❌ Erro ao contar learnings:', learnError.message);
  else console.log(`💡 Aprendizados registrados: ${learnCount}`);

  // 5. Get recent jobs
  const { data: recentJobs, error: recentError } = await supabase
    .from('jobs')
    .select('id, filename, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!recentError && recentJobs && recentJobs.length > 0) {
    console.log('\n🕒 Últimos 5 Jobs:');
    recentJobs.forEach(j => {
      console.log(`- [${j.created_at}] ${j.filename || j.id} -> ${j.status}`);
    });
  }
}

checkSupabaseStatus();
