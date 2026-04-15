import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Localiza o .env relativo ao próprio arquivo paths.ts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const IS_VERCEL = !!process.env.VERCEL;
const ROOT = path.resolve(__dirname, '..');

// No Vercel, apenas o /tmp é gravável.
const WRITABLE_BASE = IS_VERCEL ? '/tmp' : ROOT;

export const PATHS = {
  root:     ROOT,
  input:    path.join(WRITABLE_BASE, 'input'),
  inputTables: path.join(WRITABLE_BASE, 'input', 'tables'),
  output:   path.join(WRITABLE_BASE, 'output'),
  remotion: path.join(ROOT, 'remotion-project'),
  server:   path.join(ROOT, 'server'),
  backup:   path.join(WRITABLE_BASE, 'agent-backup'),
  done:     path.join(WRITABLE_BASE, 'input', 'done'),
  error:    path.join(WRITABLE_BASE, 'input', 'error'),
};

// Garantir que as pastas existam ao iniciar
import fs from 'fs';
[PATHS.input, PATHS.inputTables, PATHS.output, PATHS.done, PATHS.error].forEach(p => {
    try {
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    } catch (e) {
        console.warn(`⚠️ Erro ao criar pasta ${p}:`, e);
    }
});

console.log('📁 [PATHS] GiantAnimator ROOT:', PATHS.root);

