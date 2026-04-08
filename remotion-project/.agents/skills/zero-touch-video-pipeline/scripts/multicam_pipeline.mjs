import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const camA = process.argv[2];
const camB = process.argv[3];

if (!camA || !camB) {
  console.error("Usage: node multicam_pipeline.mjs <cam_a> <cam_b>");
  process.exit(1);
}

// ─── Load .env ────────────────────────────────────────────────────────────────
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
     fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
       const match = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
       if (match) process.env[match[1]] = match[2].trim();
     });
  }
} catch (e) {}

// ─── spawnSync wrapper: streams stdout + stderr so ETA and progress show live ─
function run(cmd, args = [], opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',   // ← key fix: pipe all fd's directly to the terminal
    shell: true,
    ...opts
  });
  if (result.status !== 0) {
    console.error(`\n❌ Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const absA = path.resolve(camA);
const absB = path.resolve(camB);
const dirName = path.dirname(absA);
const baseName = "multicam_project";
const audioPath   = path.join(dirName, `${baseName}_analysis.wav`);
const jsonPath    = path.join(dirName, `${baseName}_analysis.json`);
const cleanSrcWav = path.join(dirName, `${baseName}_clean_src.wav`);
const concatPath  = path.join(dirName, `${baseName}_concat.txt`);

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const auphonicOutPath    = path.join(publicDir, 'audio.aac');
const outputPath         = path.join(publicDir, 'video.mp4');
const propsPath          = path.join(publicDir, 'props.json');
const outDir             = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const finalRemotionOutput = path.join(outDir, `Final_${baseName}.mp4`);

// ─── Verify FFmpeg ────────────────────────────────────────────────────────────
console.log(`\n🎬 --- Multicam Zero-Touch Pipeline --- 🎬`);
console.log(`Camera A: ${absA}\nCamera B: ${absB}\n`);

const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { shell: true, stdio: 'ignore' });
if (ffmpegCheck.status !== 0) {
  console.error("❌ FFmpeg not found! Por favor instale: winget install Gyan.FFmpeg");
  process.exit(1);
}

// ─── Step 1: Extract Audio ────────────────────────────────────────────────────
console.log(`\n--- Step 1: Extrair Audio para Analise ---`);
if (!fs.existsSync(audioPath)) {
  run('ffmpeg', ['-y', '-i', `"${absA}"`, '-vn', '-c:a', 'pcm_s16le', '-ar', '16000', '-ac', '1', `"${audioPath}"`]);
} else { console.log(`Já existe: ${audioPath}`); }

// ─── Step 2: Transcribe ───────────────────────────────────────────────────────
console.log(`\n--- Step 2: Transcrever (Whisper) ---`);
if (!fs.existsSync(jsonPath)) {
  run('uvx', ['--from', 'openai-whisper', 'whisper', `"${audioPath}"`, '--model', 'tiny', '--output_format', 'json', '--word_timestamps', 'True', '--output_dir', `"${dirName}"`]);
} else { console.log(`Já existe: ${jsonPath}`); }

// ─── Step 3: Find Clean Take ──────────────────────────────────────────────────
console.log(`\n--- Step 3: Identificar "Clean Take" ---`);
const transcriptData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let words = transcriptData.segments ? transcriptData.segments.flatMap(s => s.words || []) : [];
if (words.length === 0) { console.error("Nenhum timestamp!"); process.exit(1); }

let lastRetakeStart = -1;
const markers = ["take two", "take 2", "take 3", "start over", "scratch that", "de novo", "outra vez", "mais uma", "errei"];
const getWordText = w => w.word ? w.word.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim() : "";

for (let i = 0; i < words.length - 1; i++) {
  const phrase = `${getWordText(words[i])} ${getWordText(words[i + 1])}`;
  if (markers.some(m => phrase.includes(m))) lastRetakeStart = i;
}
for (let i = 1; i < words.length; i++) {
  if (words[i].start - words[i-1].end > 2.0 && (words[words.length-1].end - words[i].start > 5.0))
     lastRetakeStart = Math.max(lastRetakeStart, i);
}

const startIdx  = Math.min(Math.max(lastRetakeStart + 1, 0), words.length - 1);
const cleanWords = words.slice(startIdx);
console.log(`Clean take: ${cleanWords.length} palavra(s) a partir de ${cleanWords[0].start.toFixed(2)}s`);

// ─── Step 4: Multicam Cuts ────────────────────────────────────────────────────
console.log(`\n--- Step 4: Gerar Multicam ---`);
const cuts = [];
let currentCam = 'A';
const currentBlockStart = Math.max(0, cleanWords[0].start - 0.5);
let lastCutTime = currentBlockStart;

for (let i = 0; i < cleanWords.length - 1; i++) {
   const w = cleanWords[i]; const nextW = cleanWords[i+1];
   const gap = nextW.start - w.end;
   if ((w.end - lastCutTime) >= 4.0 && (/[.?!]/.test(w.word) || gap > 0.4)) {
       const cutTime = w.end + gap / 2;
       cuts.push({ cam: currentCam, in: lastCutTime, out: cutTime });
       currentCam = currentCam === 'A' ? 'B' : 'A';
       lastCutTime = cutTime;
   }
}
cuts.push({ cam: currentCam, in: lastCutTime, out: cleanWords[cleanWords.length-1].end + 0.5 });
console.log(`${cuts.length} cortes de câmera gerados.`);

// ─── Build concat list & captions JSON ───────────────────────────────────────
let concatContent = "";
for (const cut of cuts) {
    const file = cut.cam === 'A' ? absA : absB;
    concatContent += `file '${file.replace(/\\/g, '/').replace(/'/g, "\\'")}'\n`;
    concatContent += `inpoint ${cut.in.toFixed(3)}\n`;
    concatContent += `outpoint ${cut.out.toFixed(3)}\n`;
}
fs.writeFileSync(concatPath, concatContent);

const propsData = {
   videoSrc: "video.mp4",
   audioSrc: "audio.aac",
   captions: cleanWords.map(w => ({
      word: w.word,
      start: +(w.start - currentBlockStart).toFixed(3),
      end:   +(w.end   - currentBlockStart).toFixed(3)
   }))
};
fs.writeFileSync(propsPath, JSON.stringify(propsData, null, 2));
console.log(`Captions salvas em: ${propsPath}`);

// ─── Step 5: Auphonic ─────────────────────────────────────────────────────────
console.log(`\n--- Step 5: Auphonic API ---`);
const apiKey = process.env.AUPHONIC_API_KEY;

if (!fs.existsSync(auphonicOutPath) && apiKey) {
    if (!fs.existsSync(cleanSrcWav)) {
       const dur = cuts[cuts.length-1].out - cuts[0].in;
       run('ffmpeg', ['-y', '-ss', cuts[0].in.toFixed(3), '-i', `"${absA}"`, '-t', dur.toFixed(3), '-vn', '-c:a', 'pcm_s16le', '-ar', '48000', `"${cleanSrcWav}"`]);
    }
    console.log("Enviando audio para Auphonic (16 LUFS, denoise)...");
    try {
        const formData = new FormData();
        formData.append('input_file', new Blob([fs.readFileSync(cleanSrcWav)], { type: 'audio/wav' }), 'clean_src.wav');
        formData.append('action', 'start');
        formData.append('algorithms', JSON.stringify({ leveler: true, normloudness: true, loudnesstarget: -16, denoise: true, denoisemethod: "dynamic" }));
        formData.append('output_files', JSON.stringify([{ format: "aac", bitrate: 192 }]));

        const uploadRes = await fetch("https://auphonic.com/api/productions.json", {
            method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}` }, body: formData
        });
        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const uuid = (await uploadRes.json()).data.uuid;
        console.log(`Auphonic job criado: ${uuid}. Aguardando...`);

        let status = 0; let resultUrl = null;
        while (status !== 3) {
            await new Promise(r => setTimeout(r, 5000));
            process.stdout.write(".");
            const statData = await (await fetch(`https://auphonic.com/api/productions/${uuid}.json`, { headers: { 'Authorization': `Bearer ${apiKey}` }})).json();
            status = statData.data.status;
            if (status === 3) { resultUrl = statData.data.output_files[0].download_url; console.log(" ✅ Done!"); }
            else if ([4, 5, 10].includes(status)) throw new Error(`Auphonic status ${status}`);
        }
        fs.writeFileSync(auphonicOutPath, Buffer.from(await (await fetch(resultUrl, { headers: { 'Authorization': `Bearer ${apiKey}` }})).arrayBuffer()));
        console.log(`Audio processado salvo em: ${auphonicOutPath}`);
    } catch(err) { console.error("⚠ Auphonic error:", err.message); }
} else if (!apiKey) {
    console.warn("⚠ AUPHONIC_API_KEY não encontrada. Etapa Auphonic pulada.");
}

// --- FALLBACK AUDIO ---
if (!fs.existsSync(auphonicOutPath)) {
    console.log("⚠️ Gerando audio final via FFmpeg (Fallback local, já que Auphonic falhou)...");
    const dur = cuts[cuts.length-1].out - cuts[0].in;
    run('ffmpeg', ['-y', '-ss', cuts[0].in.toFixed(3), '-i', `"${absA}"`, '-t', dur.toFixed(3), '-c:a', 'aac', '-b:a', '192k', `"${auphonicOutPath}"`]);
}

// ─── Step 6: Render muted proxy to public/video.mp4 ──────────────────────────
console.log(`\n--- Step 6: Renderizando proxy para public/video.mp4 ---`);
run('ffmpeg', [
  '-y', '-f', 'concat', '-safe', '0', '-i', `"${concatPath}"`,
  '-vf', '"scale=\'min(1920,iw)\':-2"',
  '-c:v', 'libx264', '-crf', '26', '-preset', 'fast', '-an',
  `"${outputPath}"`
]);
console.log(`\n✅ Proxy salvo em: ${outputPath}`);

// ─── Step 7: Remotion final render → out/ ──────────────────────────────────
console.log(`\n--- Step 7: Remotion Render → ${finalRemotionOutput} ---`);
run('npx', [
  'remotion', 'render', 'CaptionEngine',
  `"${finalRemotionOutput}"`,
  `--props="${propsPath}"`,
  '--codec', 'h264'
], { cwd: process.cwd() });

console.log(`\n✅ OBRA-PRIMA ZERO TOUCH CONCLUÍDA!`);
console.log(`Salvo na pasta: ${finalRemotionOutput}`);
