import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKUP_ROOT  = path.resolve(PROJECT_ROOT, '../_backups/GiantAnimator');

function listBackups(): string[] {
  if (!fs.existsSync(BACKUP_ROOT)) {
    console.log('⚠️  Nenhum backup encontrado — iniciando com arquivos atuais.');
    return [];
  }
  return fs.readdirSync(BACKUP_ROOT)
    .filter(e => fs.statSync(path.join(BACKUP_ROOT, e)).isDirectory())
    .sort()
    .reverse();
}

function copyRecursive(src: string, dest: string) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.remotion') continue;
      fs.mkdirSync(d, { recursive: true });
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const backups = listBackups();

if (backups.length === 0) {
  console.log('▶️  Continuando sem restauração.');
  process.exit(0);
}

const latest = backups[0];
const srcBackup = path.join(BACKUP_ROOT, latest);

console.log(`\n♻️  Backup mais recente: ${latest}`);
console.log(`📂 Restaurando para:    ${PROJECT_ROOT}`);

copyRecursive(srcBackup, PROJECT_ROOT);

console.log(`✅ Restauração concluída!`);
console.log(`📋 Backups disponíveis (${backups.length} total):`);
backups.slice(0, 5).forEach((b, i) => {
  const marker = i === 0 ? ' ← restaurado' : '';
  console.log(`   [${i}] ${b}${marker}`);
});
if (backups.length > 5) {
  console.log(`   ... e mais ${backups.length - 5} backups antigos`);
}
