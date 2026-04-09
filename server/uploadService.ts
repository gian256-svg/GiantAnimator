import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PATHS } from "./paths.js";

const router = Router();

if (!fs.existsSync(PATHS.input)) {
  fs.mkdirSync(PATHS.input, { recursive: true });
}

const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const ALLOWED_TABLE_TYPES = /xlsx|xls|csv|ods/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isTable = ALLOWED_TABLE_TYPES.test(ext);
    cb(null, isTable ? PATHS.inputTables : PATHS.input);
  },
  filename: (req, file, cb) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const ext = path.extname(file.originalname) || ".png";
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${timestamp}_${name}${ext}`);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = ALLOWED_IMAGE_TYPES.test(ext) || file.mimetype.startsWith('image/');
    const isTable = ALLOWED_TABLE_TYPES.test(ext);

    if (isImage || isTable) {
       cb(null, true);
    } else {
       cb(new Error(`Formato não suportado: .${ext}`) as any, false);
    }
  }
});

// ✅ Rota POST /upload (Imagens)
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    console.log(`📥 [API] Imagem recebida: ${req.file.filename}`);
    res.json({ ok: true, filename: req.file.filename });
  } catch (err) {
    console.error("❌ [API] Erro no upload de imagem:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
