import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Localiza o .env relativo ao próprio arquivo paths.ts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const IS_VERCEL = !!process.env.VERCEL;
const ROOT = path.resolve(__dirname, '..');

// No Vercel, apenas o /tmp é gravável.
const WRITABLE_BASE = IS_VERCEL ? '/tmp' : ROOT;

// Determinar a base para arquivos (input/output) - Agora estritamente LOCAL
const SHARED_BASE = WRITABLE_BASE;

export const PATHS = {
  root:     ROOT,
  input:    path.join(SHARED_BASE, 'input'),
  inputTables: path.join(SHARED_BASE, 'input', 'tables'),
  output:   path.join(SHARED_BASE, 'output'),
  remotion: path.join(ROOT, 'remotion-project'),
  server:   path.join(ROOT, 'server'),
  backup:   path.join(WRITABLE_BASE, 'agent-backup'),
  done:     path.join(SHARED_BASE, 'input', 'done'),
  error:    path.join(SHARED_BASE, 'input', 'error'),
};

// Garantir que as pastas existam ao iniciar
[PATHS.input, PATHS.inputTables, PATHS.output, PATHS.done, PATHS.error].forEach(p => {
    try {
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    } catch (e) {
        console.warn(`⚠️ Erro ao criar pasta ${p}:`, e);
    }
});

console.log('📁 [PATHS] GiantAnimator ROOT:', PATHS.root);
console.log('📡 [PATHS] SHARED BASE:', SHARED_BASE);

