/**
 * Auto-updater — GiantAnimator
 *
 * Verifica version.json no GitHub (master branch) a cada inicialização.
 * Se a versão remota for diferente da local, baixa o zip da GitHub Release
 * correspondente, extrai sobre resources/app/ e sinaliza para o app reiniciar.
 *
 * Não requer configuração: o MANIFEST_URL está embutido aqui.
 * O .env pode sobrescrever via UPDATE_MANIFEST_URL (para ambientes alternativos).
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DEFAULT_MANIFEST_URL =
  'https://raw.githubusercontent.com/gian256-svg/GiantAnimator/master/version.json';

const VERSION_FILE = path.join(__dirname, '..', 'version.json');

// ── Helpers ───────────────────────────────────────────────────────

function readLocalVersion() {
  try {
    if (fs.existsSync(VERSION_FILE))
      return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8')).version ?? '0.0.0';
  } catch {}
  return '0.0.0';
}

function get(url, redirects = 8) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 15000 }, res => {
      if (redirects > 0 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return get(res.headers.location, redirects - 1).then(resolve).catch(reject);
      if (res.statusCode !== 200)
        return reject(new Error(`HTTP ${res.statusCode} em ${url}`));
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchJson(url) {
  const buf = await get(url);
  return JSON.parse(buf.toString('utf-8'));
}

async function downloadFile(url, dest) {
  const buf = await get(url);
  fs.writeFileSync(dest, buf);
}

// ── Lógica principal ──────────────────────────────────────────────

export async function checkAndApplyUpdate(onProgress) {
  const manifestUrl = process.env.UPDATE_MANIFEST_URL || DEFAULT_MANIFEST_URL;

  try {
    onProgress?.('Verificando atualizações...');
    const manifest = await fetchJson(manifestUrl);

    if (!manifest.version || !manifest.zipUrl) {
      console.warn('[Updater] Manifest inválido (faltam version/zipUrl).');
      return false;
    }

    const localVersion = readLocalVersion();
    console.log(`[Updater] Local: ${localVersion} | Remoto: ${manifest.version}`);

    if (manifest.version === localVersion) {
      console.log('[Updater] App já está na versão mais recente.');
      return false;
    }

    console.log(`[Updater] Nova versão disponível: ${manifest.version}`);
    onProgress?.(`Baixando atualização ${manifest.version}...`);

    const tmpZip = path.join(app.getPath('userData'), 'giant-update.zip');
    await downloadFile(manifest.zipUrl, tmpZip);

    onProgress?.('Aplicando atualização...');

    const appPath = app.getAppPath();
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -Path '${tmpZip}' -DestinationPath '${appPath}'"`,
      { timeout: 120000 }
    );

    try { fs.unlinkSync(tmpZip); } catch {}

    console.log(`[Updater] Versão ${manifest.version} instalada.`);
    onProgress?.('Atualização concluída. Reiniciando...');
    return true;

  } catch (err) {
    // Falha silenciosa — app inicia normalmente sem atualização
    console.warn('[Updater] Não foi possível verificar atualização:', err.message);
    return false;
  }
}
