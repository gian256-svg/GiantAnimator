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
let serverProcess = null;

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

  // Remotion bundle pré-compilado (criado em build time por scripts/prebundle.mjs)
  const bundlePath = isPackaged
    ? path.join(process.resourcesPath, 'remotion-bundle')
    : path.join(appPath, 'dist', 'remotion-bundle');

  const env = {
    ...process.env,
    PORT:                  String(PORT),
    GIANT_WRITABLE_DIR:    userData,                 // diretório gravável no sistema do usuário
    REMOTION_BUNDLE_PATH:  bundlePath,
    ELECTRON_RUN:          '1',
    NODE_ENV:              isPackaged ? 'production' : 'development',
  };

  let cmd, args, cwd;

  if (isPackaged) {
    // Produção — usa o JS compilado; Electron actua como Node via ELECTRON_RUN_AS_NODE
    env.ELECTRON_RUN_AS_NODE = '1';
    cmd  = process.execPath;
    args = [path.join(appPath, 'server', 'dist', 'index.js')];
    cwd  = appPath;
  } else {
    // Desenvolvimento — usa tsx directamente
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

  // Remove barra de menu nativa (a UI já tem seus próprios controles)
  Menu.setApplicationMenu(null);

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  // Links externos abrem no browser padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Ciclo de vida do app ──────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    const { checkAndApplyUpdate } = await import('./updater.js');
    const updated = await checkAndApplyUpdate(msg => console.log('[Updater]', msg));
    if (updated) {
      app.relaunch();
      app.exit(0);
      return;
    }
  } catch (err) {
    console.warn('[Updater] Erro no módulo de atualização:', err.message);
  }

  spawnServer();
  try {
    await waitForServer();
    await createWindow();
  } catch (err) {
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
