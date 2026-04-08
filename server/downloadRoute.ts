import { Router } from "express";
import path from "path";
import fs from "fs";
import { PATHS } from "./paths.js";

const router = Router();

router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  // ✅ Normaliza o caminho para garantir compatibilidade com Windows
  const filePath = path.normalize(path.join(PATHS.output, filename));

  if (fs.existsSync(filePath)) {
    console.log(`📡 [DOWNLOAD] Servindo: ${filePath}`);
    res.download(filePath);
  } else {
    console.error(`❌ [DOWNLOAD] Não encontrado: ${filePath}`);
    res.status(404).json({ 
        error: "Arquivo não encontrado", 
        path: filePath,
        existsInNode: fs.existsSync(filePath),
        cwd: process.cwd()
    });
  }
});

export default router;
