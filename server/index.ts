// server/index.ts
import "dotenv/config";
import express        from "express";
import cors           from "cors";
import path           from "path";
import fs             from "fs";
import { agent }      from "./agent.js";
import { startWatcher } from "./watcherService.js";
import uploadService   from "./uploadService.js";
import downloadRoute   from "./downloadRoute.js";
import statusRoute     from "./statusRoute.js";
import { PATHS }       from "./paths.js";

// Novos serviços (Fase C)
import { addClient, broadcast } from "./sseService.js";
import { getHistory, getJobById } from "./historyService.js";
import { renderChart } from "./renderService.js";

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ─────────────────────────────────────────────────────────
// Middleware global
// ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

// ✅ Rotas
app.use(uploadService);
app.use(downloadRoute);
app.use(statusRoute);

// ─────────────────────────────────────────────────────────
// ✅ SSE, History, Rerender
// ─────────────────────────────────────────────────────────

app.get("/events", (req, res) => {
  addClient(res);
});

app.get("/history", (_req, res) => {
  res.json(getHistory());
});

app.post("/render", async (req, res) => {
  const { compositionId, inputProps } = req.body;

  if (!compositionId || !inputProps) {
    return res.status(400).json({ error: "compositionId e inputProps são obrigatórios" });
  }

  try {
    console.log(`🎬 [API] Render direto solicitado: ${compositionId}`);
    broadcast({ type: "processing", filename: `api-render-${compositionId}` });

    const start = Date.now();
    const outputPath = await renderChart(compositionId, inputProps);
    const outputFilename = path.basename(outputPath);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    broadcast({ 
      type: "done", 
      filename: outputFilename, 
      outputFile: outputFilename, 
      duration: parseFloat(duration) 
    });

    res.json({ success: true, outputFile: outputFilename, duration });

  } catch (err: any) {
    console.error("❌ [API] Erro no /render:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/rerender", async (req, res) => {

  const { jobId, props } = req.body;

  if (!jobId || !props) {
    return res.status(400).json({ error: "jobId e props são obrigatórios" });
  }

  const job = getJobById(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job não encontrado no histórico" });
  }

  try {
    console.log(`🔄 [API] Re-renderizando ${job.filename} com novas props...`);
    broadcast({ type: "processing", filename: job.filename });

    const start = Date.now();
    const outputPath = await renderChart(job.props.componentId || "BarChart", props);
    const outputFilename = path.basename(outputPath);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    broadcast({ 
      type: "done", 
      filename: outputFilename, 
      outputFile: outputFilename, 
      duration: parseFloat(duration) 
    });

    res.json({ success: true, outputFile: outputFilename, duration });

  } catch (err: any) {
    console.error("❌ [API] Erro no /rerender:", err);
    broadcast({ type: "error", filename: job.filename, message: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("🚀 GiantAnimator Server iniciando...");

  agent.initialize().catch((err) => {
    console.error("❌ Falha crítica ao inicializar agente:", err);
  });

  // Garantir diretórios
  [PATHS.input, PATHS.output, PATHS.done, PATHS.error].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  startWatcher(PATHS.input);

  app.listen(PORT, () => {
    console.log(`\n✅ Servidor rodando: http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("💥 Erro fatal no startup:", err);
  process.exit(1);
});
