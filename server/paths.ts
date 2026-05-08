import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In packaged Electron: __dirname = server/dist/, .env is at app/.env (2 up)
// In dev: __dirname = server/, .env is at server/.env (same dir)
const envCandidates = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const p of envCandidates) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break; }
}

const IS_VERCEL   = !!process.env.VERCEL;
const IS_ELECTRON = process.env.ELECTRON_RUN_AS_NODE === '1' || !!process.env.GIANT_WRITABLE_DIR;
// In packaged: __dirname = server/dist/ → ROOT must go 2 up to app/
// In dev:      __dirname = server/     → ROOT goes 1 up to project root
const isPackagedDist = __dirname.replace(/\\/g, '/').endsWith('/server/dist');
const ROOT = isPackagedDist
  ? path.resolve(__dirname, '../..')
  : path.resolve(__dirname, '..');

// Vercel → /tmp | Electron → userData (AppData/Roaming/…) | Local → ROOT
const WRITABLE_BASE = IS_VERCEL
  ? '/tmp'
  : IS_ELECTRON
    ? process.env.GIANT_WRITABLE_DIR!
    : ROOT;

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
  cache:    path.join(SHARED_BASE, 'cache'),
};

// Garantir que as pastas existam ao iniciar
[PATHS.input, PATHS.inputTables, PATHS.output, PATHS.done, PATHS.error, PATHS.cache,
 path.join(PATHS.input, 'jobs'), path.join(PATHS.input, 'uploads')].forEach(p => {
    try {
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    } catch (e) {
        console.warn(`⚠️ Erro ao criar pasta ${p}:`, e);
    }
});

console.log('📁 [PATHS] GiantAnimator ROOT:', PATHS.root);
console.log('📡 [PATHS] SHARED BASE:', SHARED_BASE);

