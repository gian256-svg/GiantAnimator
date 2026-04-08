import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ELEVENLABS_API_KEY = "sk_61346a09b793d54f20731ed61812d64e0bb366abaafe1624";
const VOICE_ID = "ukupJ4zdf9bo1Py6MiO6"; // Beto

// Read scenes
const scenesRaw = fs.readFileSync(path.join(__dirname, 'src', 'mastercard_reels', 'data', 'scenes.json'), 'utf8');
const scenesData = JSON.parse(scenesRaw);

async function fetchAudioForScene(scene) {
  const publicDir = path.join(__dirname, 'src', 'mastercard_reels', 'assets');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const destPath = path.join(publicDir, `${scene.id}.mp3`);
  
  console.log(`Fetching TTS for scene ${scene.id}...`);
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: scene.narration,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_enhancement: 0.85
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`ElevenLabs Error for ${scene.id}:`, errText);
      return;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    console.log(`Saved ${scene.id}.mp3 successfully.`);
  } catch (error) {
    console.error(`Fetch failed for ${scene.id}:`, error);
  }
}

async function runAll() {
  for (const scene of scenesData.scenes) {
    await fetchAudioForScene(scene);
    await new Promise(r => setTimeout(r, 1000));
  }
}

runAll();
