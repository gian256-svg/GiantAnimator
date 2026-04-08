import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKUP_ROOT  = path.resolve(PROJECT_ROOT, '../_backups/GiantAnimator');
const MAX_BACKUPS  = 10;
const INTERVAL_MS  = 5 * 60 * 1000;

function getTimestamp(): string {
  return new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
}

export function runBackup() {
  const ts = getTimestamp();
  const dest = path.join(BACKUP_ROOT, ts);

  try {
    fs.mkdirSync(dest, { recursive: true });

    const foldersToBackup = ['server', 'remotion-project/src'];
    for (const folder of foldersToBackup) {
      const src = path.join(PROJECT_ROOT, folder);
      if (!fs.existsSync(src)) continue;
      const destFolder = path.join(dest, folder);
      fs.mkdirSync(destFolder, { recursive: true });
      copyRecursive(src, destFolder);
    }

    const rootFiles = ['.gitignore', 'package.json', 'tsconfig.json'];
    for (const file of rootFiles) {
      const srcFile = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(dest, file));
      }
    }

    console.log(`\n💾 [BACKUP ${ts}] Backup local salvo em: ${dest}`);

    try {
      execSync(`git -C "${PROJECT_ROOT}" add .`, { stdio: 'pipe' });
      const status = execSync(`git -C "${PROJECT_ROOT}" status --porcelain`, { encoding: 'utf8' });
      if (status.trim().length > 0) {
        execSync(`git -C "${PROJECT_ROOT}" commit -m "auto-backup: ${ts}"`, { stdio: 'pipe' });
        console.log(`📦 [GIT ${ts}] Commit realizado`);
      } else {
        console.log(`📦 [GIT ${ts}] Sem mudanças — commit ignorado`);
      }
    } catch (gitErr: any) {
      console.warn(`⚠️  [GIT] Falha no commit:`, gitErr.message);
    }
    pruneOldBackups();
  } catch (err: any) {
    console.error(`❌ [BACKUP] Erro:`, err.message);
  }
}

function copyRecursive(src: string, dest: string) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.remotion' || entry.name === '.git') continue;
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_ROOT)) return;
  const entries = fs.readdirSync(BACKUP_ROOT)
    .filter(e => fs.statSync(path.join(BACKUP_ROOT, e)).isDirectory())
    .sort();
  while (entries.length > MAX_BACKUPS) {
    const oldest = entries.shift()!;
    fs.rmSync(path.join(BACKUP_ROOT, oldest), { recursive: true, force: true });
    console.log(`🗑️ [BACKUP] Removido backup antigo: ${oldest}`);
  }
}

// Inicialização imediata ao invokar
console.log(`\n💾 [BACKUP] Sistema iniciado — intervalo: 5 minutos`);
console.log(`💾 [BACKUP] Destino: ${BACKUP_ROOT}`);
runBackup();
setInterval(runBackup, INTERVAL_MS);
