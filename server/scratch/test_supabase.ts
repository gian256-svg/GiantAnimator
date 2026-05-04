import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error("❌ Faltam variáveis no .env");
    return;
  }

  console.log(`📡 Testando conexão para: ${url}`);
  const db = createClient(url, key);

  const testRow = {
    id: 'test_connection',
    type: 'diagnostic',
    content: 'GiantAnimator Connection Test',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await db.from('knowledge').upsert(testRow);

  if (error) {
    console.error("❌ Erro no Supabase:", error.message);
    if (error.hint) console.error("💡 Hint:", error.hint);
    if (error.details) console.error("📝 Details:", error.details);
  } else {
    console.log("✅ Sucesso! O item 'test_connection' deve estar visível na tabela 'knowledge'.");
  }
}

test();
