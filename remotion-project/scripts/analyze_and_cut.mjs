import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const videoPath = process.argv[2];

if (!videoPath) {
  console.error("Usage: node analyze_and_cut.mjs <path_to_video>");
  process.exit(1);
}

const absVideoPath = path.resolve(videoPath);
const dirName = path.dirname(absVideoPath);
const baseName = path.basename(absVideoPath, path.extname(absVideoPath));
const audioPath = path.join(dirName, `${baseName}.wav`);
const jsonPath = path.join(dirName, `${baseName}.json`);
const outputPath = path.join(dirName, `${baseName}_clean${path.extname(absVideoPath)}`);

console.log(`\n--- Step 1: Extract Audio ---`);
if (!fs.existsSync(audioPath)) {
  console.log(`Extracting audio to ${audioPath}...`);
  try {
      execSync(`ffmpeg -y -i "${absVideoPath}" -vn -c:a pcm_s16le -ar 16000 -ac 1 "${audioPath}"`, { stdio: 'inherit' });
  } catch(e) {
      console.error("Error extracting audio:", e.message);
      process.exit(1);
  }
} else {
  console.log(`Audio already extracted: ${audioPath}`);
}

console.log(`\n--- Step 2: Transcribe ---`);
if (!fs.existsSync(jsonPath)) {
  console.log(`Transcribing with Whisper (Output: ${jsonPath})...`);
  try {
      // whisper audio.wav --model tiny --output_format json --word_timestamps True --output_dir .
      execSync(`uvx --from openai-whisper whisper "${audioPath}" --model tiny --output_format json --word_timestamps True --output_dir "${dirName}"`, { stdio: 'inherit' });
  } catch(e) {
      console.error("Error transcribing:", e.message);
      process.exit(1);
  }
} else {
  console.log(`Transcript already exists: ${jsonPath}`);
}

console.log(`\n--- Step 3: Analyze and Find Clean Take ---`);
const transcriptData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

let words = [];
if (transcriptData.segments) {
    words = transcriptData.segments.flatMap(seg => seg.words || []);
}

if (words.length === 0) {
  console.warn("No word-level timestamps found. Falling back to segment-level analysis.");
  // fallback to segment analysis
  words = transcriptData.segments.map(seg => ({
      word: seg.text,
      start: seg.start,
      end: seg.end
  }));
}

if (words.length === 0) {
    console.error("No transcript data found. Aborting.");
    process.exit(1);
}

// Logic to find the "clean take"
const markers = ["take two", "take 2", "take 3", "start over", "try again", "scratch that"];
const getWordText = (w) => (w && w.word) ? w.word.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim() : "";

let cleanStartTime = words[0].start;
let cleanEndTime = words[words.length - 1].end;

let lastRetakeStart = -1;

for (let i = 0; i < words.length - 1; i++) {
  const w1 = getWordText(words[i]);
  const w2 = getWordText(words[i + 1]);
  const phrase2 = `${w1} ${w2}`;
  const w3 = (i < words.length - 2) ? getWordText(words[i + 2]) : "";
  const phrase3 = `${phrase2} ${w3}`;

  if (markers.some(m => phrase2.includes(m) || phrase3.includes(m))) {
    // Retake marker detected
    lastRetakeStart = i;
  }
}

// Detect long gaps
for (let i = 1; i < words.length; i++) {
  const gap = words[i].start - words[i - 1].end;
  if (gap > 2.0) {
     const remainingDuration = cleanEndTime - words[i].start;
     if (remainingDuration > 5.0) {
         // Gap followed by sufficient content -> consider it a retake point
         lastRetakeStart = Math.max(lastRetakeStart, i);
     }
  }
}

if (lastRetakeStart !== -1) {
   // Safely start at the identified word
   const startIdx = Math.min(lastRetakeStart + 1, words.length - 1);
   cleanStartTime = words[startIdx].start;
   
   // Add a 0.5s padding to the start to avoid audio clipping the first letter
   cleanStartTime = Math.max(0, cleanStartTime - 0.5);
   
   console.log(`Detected false start / retake. Cutting from ${cleanStartTime.toFixed(2)}s`);
} else {
   console.log(`No explicit retake markers found. Using full sequence.`);
}

// Add a 0.5s padding to the end as well
cleanEndTime = cleanEndTime + 0.5;

console.log(`Target window: ${cleanStartTime.toFixed(2)}s to ${cleanEndTime.toFixed(2)}s`);

console.log(`\n--- Step 4: Trim Video ---`);
const duration = cleanEndTime - cleanStartTime;
console.log(`Trimming to ${outputPath} (Duration: ${duration.toFixed(2)}s)...`);
try {
   // We'll use -c copy for speed and lossless processing
   execSync(`ffmpeg -y -ss ${cleanStartTime.toFixed(2)} -i "${absVideoPath}" -t ${duration.toFixed(2)} -c:v copy -c:a copy "${outputPath}"`, { stdio: 'inherit' });
} catch(e) {
   console.error("Error trimming video:", e.message);
   process.exit(1);
}

console.log(`\nDone! Clean take is at ${outputPath}`);
