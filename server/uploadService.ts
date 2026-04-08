import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PATHS } from "./paths.js";

const router = Router();

if (!fs.existsSync(PATHS.input)) {
  fs.mkdirSync(PATHS.input, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATHS.input);
  },
  filename: (req, file, cb) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const ext = path.extname(file.originalname) || ".png";
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${name}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
       cb(null, true);
    } else {
       cb(new Error("MimeType não permitido") as any, false);
    }
  }
});

// ✅ Rota POST /upload
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    console.log(`📥 [API] Arquivo recebido em ${PATHS.input}: ${req.file.filename}`);
    
    // ✅ Retorna o filename real para o frontend mapear no SSE
    res.json({ 
      ok: true, 
      filename: req.file.filename 
    });

  } catch (err) {
    console.error("❌ [API] Erro no upload:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
