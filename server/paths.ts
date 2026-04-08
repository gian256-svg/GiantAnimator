import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Localiza o .env relativo ao próprio arquivo paths.ts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const ROOT = path.resolve(__dirname, '..');

export const PATHS = {
  root:     ROOT,
  input:    path.join(ROOT, 'input'),
  output:   path.join(ROOT, 'output'),
  remotion: path.join(ROOT, 'remotion-project'),
  server:   path.join(ROOT, 'server'),
  backup:   path.join(ROOT, 'agent-backup'),
  done:     path.join(ROOT, 'input', 'done'),
  error:    path.join(ROOT, 'input', 'error'),
};

console.log('📁 [PATHS] GiantAnimator ROOT:', PATHS.root);

