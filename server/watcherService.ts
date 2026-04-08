import chokidar from "chokidar";
import path from "path";
import { processImage } from "./pipeline.js";
import fs from "fs";
import { broadcast } from "./sseService.js";
import { addJob } from "./historyService.js";
import { PATHS } from "./paths.js";

/**
 * WatcherService — Observador de pasta de input.
 */
export function startWatcher(inputPath: string) {
  const normalizedPath = path.normalize(inputPath);
  const queue: string[] = [];
  let isProcessing = false;
  let isReady = false;

  // Garantir pastas
  [PATHS.input, PATHS.done, PATHS.error, PATHS.output].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const watcher = chokidar.watch(normalizedPath, {
    ignored: [
      "**/done/**",
      "**/error/**",
      "**/.*"
    ],
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    interval: 500,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 200
    }
  });

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    while (queue.length > 0) {
      const filePath = queue.shift()!;
      const fileName = path.basename(filePath);

      console.log(`⏳ [QUEUE] Processando: ${fileName} (${queue.length} restantes)`);
      broadcast({ type: 'processing', filename: fileName });

      try {
        const result = await processImageWithRetry(filePath);
        
        const job = addJob({
          filename: fileName,
          outputFile: result.outputFile,
          status: 'done',
          duration: result.duration,
          props: { ...result.props, componentId: result.componentId } // Salvando componente para rerender
        });

        broadcast({ 
          type: 'done', 
          filename: fileName, 
          outputFile: result.outputFile, 
          duration: result.duration,
          jobId: job.id 
        });

      } catch (error: any) {
        console.error(`❌ [QUEUE] Falhou: ${fileName}`);
        await moveToError(filePath);
        broadcast({ type: 'error', filename: fileName, message: error.message });
      }

      if (queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    isProcessing = false;
  };

  const processImageWithRetry = async (filePath: string, attempt = 1): Promise<any> => {
    try {
      return await processImage(filePath);
    } catch (error: any) {
      const is429 = error?.message?.includes("429");
      if (is429 && attempt <= 5) {
        const delay = [5000, 10000, 20000, 30000, 60000][attempt - 1] || 60000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return processImageWithRetry(filePath, attempt + 1);
      }
      throw error;
    }
  };

  watcher.on("ready", () => {
    isReady = true;
    console.log(`👁️  WATCHER PRONTO — Observando: ${inputPath}`);
  });

  watcher.on("add", (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return;
    if (queue.includes(filePath)) return;
    
    console.log(`📥 [WATCHER] Detectado: ${path.basename(filePath)}`);
    queue.push(filePath);
    if (isReady) processQueue();
  });

  async function moveToError(filePath: string) {
    const fileName = path.basename(filePath);
    const destPath = path.join(PATHS.error, `${Date.now()}_${fileName}`);
    try {
      fs.renameSync(filePath, destPath);
    } catch (err) {}
  }
}
