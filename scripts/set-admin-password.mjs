// Roda com: node scripts/set-admin-password.mjs SUA_SENHA
import { pbkdf2Sync, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: './server/.env' });
config(); // fallback para .env na raiz

const password = process.argv[2];
if (!password || password.length < 6) {
  console.error('Uso: node scripts/set-admin-password.mjs SUA_SENHA (mínimo 6 chars)');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar no .env');
  process.exit(1);
}

const salt = randomBytes(32).toString('hex');
const hash = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex');

const db = createClient(url, key, { auth: { persistSession: false } });
const { error } = await db
  .from('users')
  .update({ password_hash: hash, salt })
  .eq('email', 'gianluca.palmisciano@timeprimo.com');

if (error) {
  console.error('Erro:', error.message);
  process.exit(1);
}

console.log('✅ Senha do admin definida com sucesso! Agora faça login na app.');
