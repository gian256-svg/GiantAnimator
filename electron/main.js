import { app, BrowserWindow, dialog, shell, Menu } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT = 3742;
let mainWindow    = null;
let splashWindow  = null;
let serverProcess = null;

// ── Splash screen ─────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width:           420,
    height:          260,
    frame:           false,
    transparent:     false,
    resizable:       false,
    center:          true,
    show:            false,
    backgroundColor: '#070B12',
    title:           'GiantAnimator',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPath = path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath);
  splashWindow.once('ready-to-show', () => splashWindow.show());
  splashWindow.on('closed', () => { splashWindow = null; });
}

function splashUpdate(msg, progress) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  const safe = msg.replace(/'/g, "\\'");
  const progressArg = progress !== undefined ? String(progress) : 'undefined';
  splashWindow.webContents.executeJavaScript(
    `window.updateSplash('${safe}', ${progressArg})`
  ).catch(() => {});
}

function splashClose() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
}

// ── Aguarda o servidor responder no /health ───────────────────────
function waitForServer(timeout = 90000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function attempt() {
      http.get(`http://localhost:${PORT}/health`, res => {
        if (res.statusCode === 200) { resolve(); return; }
        retry();
      }).on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeout) {
        reject(new Error('Servidor não iniciou em 90 segundos.'));
        return;
      }
      setTimeout(attempt, 800);
    }
    setTimeout(attempt, 2000);
  });
}

// ── Inicia o servidor Express ─────────────────────────────────────
function spawnServer() {
  const isPackaged = app.isPackaged;
  const appPath    = app.getAppPath();
  const userData   = app.getPath('userData');

  const bundlePath = isPackaged
    ? path.join(process.resourcesPath, 'remotion-bundle')
    : path.join(appPath, 'dist', 'remotion-bundle');

  const env = {
    ...process.env,
    PORT:                  String(PORT),
    GIANT_WRITABLE_DIR:    userData,
    REMOTION_BUNDLE_PATH:  bundlePath,
    ELECTRON_RUN:          '1',
    NODE_ENV:              isPackaged ? 'production' : 'development',
  };

  let cmd, args, cwd;

  if (isPackaged) {
    env.ELECTRON_RUN_AS_NODE = '1';
    cmd  = process.execPath;
    args = [path.join(appPath, 'server', 'dist', 'index.js')];
    cwd  = appPath;
  } else {
    cmd  = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    args = ['tsx', 'server/index.ts'];
    cwd  = path.join(__dirname, '..');
  }

  const logPath = path.join(app.getPath('userData'), 'server.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  logStream.write(`\n\n=== GiantAnimator started ${new Date().toISOString()} ===\n`);

  serverProcess = spawn(cmd, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProcess.stdout?.on('data', d => { logStream.write(`[OUT] ${d}`); process.stdout.write(`[Server] ${d}`); });
  serverProcess.stderr?.on('data', d => { logStream.write(`[ERR] ${d}`); process.stderr.write(`[Server] ${d}`); });
  serverProcess.on('exit', (code, signal) => {
    const msg = `[Server] Processo encerrado (código ${code}, sinal ${signal})`;
    logStream.write(msg + '\n');
    console.log(msg);
  });
}

// ── Cria a janela principal ───────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width:    1440,
    height:   900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#070B12',
    title: 'GiantAnimator',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    splashClose();
    mainWindow.show();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Ciclo de vida do app ──────────────────────────────────────────
app.whenReady().then(async () => {
  // Splash aparece imediatamente — antes de qualquer coisa
  createSplash();

  // Mostra versão local na splash
  try {
    const versionFile = path.join(__dirname, '..', 'version.json');
    if (fs.existsSync(versionFile)) {
      const { version } = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
      if (version && splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.executeJavaScript(
          `window.setVersion('${version}')`
        ).catch(() => {});
      }
    }
  } catch {}

  // Verificação/download de atualização com progresso na splash
  try {
    const { checkAndApplyUpdate } = await import('./updater.js');

    splashUpdate('Verificando atualizações...', -1);
    const updated = await checkAndApplyUpdate((msg, pct) => {
      console.log('[Updater]', msg);
      splashUpdate(msg, pct);
    });

    if (updated) {
      app.relaunch();
      app.exit(0);
      return;
    }
  } catch (err) {
    console.warn('[Updater] Erro no módulo de atualização:', err.message);
  }

  // Inicia o servidor e aguarda
  splashUpdate('Iniciando servidor...', -1);
  spawnServer();

  try {
    await waitForServer();
    splashUpdate('Carregando interface...', 95);
    await createWindow();
    // splashClose() é chamado dentro de mainWindow.once('ready-to-show')
  } catch (err) {
    splashClose();
    dialog.showErrorBox('GiantAnimator — Erro de inicialização', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
