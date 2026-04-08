import { Router } from "express";
import path from "path";
import fs from "fs";
import { PATHS } from "./paths.js";

const router = Router();

// ✅ GET /status/:filename
router.get("/status/:filename", (req, res) => {
  const { filename } = req.params;
  const baseName = path.basename(filename, path.extname(filename));
  const mp4Name = `${baseName}.mp4`;
  const filePath = path.join(PATHS.output, mp4Name);

  if (fs.existsSync(filePath)) {
    console.log(`✅ [STATUS] ${filename}: Concluído`);
    res.json({ 
      status: "done", 
      filename: mp4Name,
      url: `/download/${mp4Name}` 
    });
  } else {
    res.json({ status: "processing" });
  }
});

export default router;
