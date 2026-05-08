/**
 * Auto-updater — GiantAnimator
 *
 * Verifica version.json no GitHub (master branch) a cada inicialização.
 * Se a versão remota for diferente da local, baixa o zip da GitHub Release
 * correspondente, extrai sobre resources/app/ e sinaliza para o app reiniciar.
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

/**
 * Baixa um arquivo com progresso reportado via onProgress(msg, percent).
 * percent vai de startPct a endPct conforme o download avança.
 */
function downloadFileWithProgress(url, dest, onProgress, startPct = 30, endPct = 70, redirects = 8) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 60000 }, res => {
      // Segue redirect
      if (redirects > 0 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFileWithProgress(res.headers.location, dest, onProgress, startPct, endPct, redirects - 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} ao baixar atualização`));
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      const chunks = [];

      res.on('data', chunk => {
        chunks.push(chunk);
        received += chunk.length;
        if (total > 0) {
          const pct = Math.round(startPct + ((received / total) * (endPct - startPct)));
          const mb = (received / 1024 / 1024).toFixed(1);
          const totalMb = (total / 1024 / 1024).toFixed(1);
          onProgress?.(`Baixando atualização... ${mb} / ${totalMb} MB`, pct);
        } else {
          const mb = (received / 1024 / 1024).toFixed(1);
          onProgress?.(`Baixando atualização... ${mb} MB`, -1);
        }
      });

      res.on('end', () => {
        try {
          fs.writeFileSync(dest, Buffer.concat(chunks));
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout ao baixar atualização')); });
  });
}

// ── Lógica principal ──────────────────────────────────────────────

export async function checkAndApplyUpdate(onProgress) {
  const manifestUrl = process.env.UPDATE_MANIFEST_URL || DEFAULT_MANIFEST_URL;

  try {
    onProgress?.('Verificando atualizações...', -1);
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
    onProgress?.(`Atualização disponível: v${manifest.version}`, 20);

    const tmpZip = path.join(app.getPath('userData'), 'giant-update.zip');
    await downloadFileWithProgress(manifest.zipUrl, tmpZip, onProgress, 25, 70);

    onProgress?.('Aplicando atualização...', 80);

    const appPath = app.getAppPath();
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -Path '${tmpZip}' -DestinationPath '${appPath}'"`,
      { timeout: 120000 }
    );

    try { fs.unlinkSync(tmpZip); } catch {}

    console.log(`[Updater] Versão ${manifest.version} instalada.`);
    onProgress?.('Atualização concluída. Reiniciando...', 100);
    return true;

  } catch (err) {
    console.warn('[Updater] Não foi possível verificar atualização:', err.message);
    return false;
  }
}
