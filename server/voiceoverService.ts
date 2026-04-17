import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PATHS } from './paths.js';

/**
 * Serviço de Integração ElevenLabs para narração de gráficos
 */
export async function generateVoiceover(text: string, apiKey: string, jobId: string): Promise<string | null> {
    if (!apiKey || !text) return null;

    console.log(`🎙️ [ElevenLabs] Gerando áudio para Job: ${jobId}`);
    
    try {
        const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - Pro Voice
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

        const response = await axios({
            method: 'post',
            url: url,
            data: {
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            },
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        const outputDir = path.join(PATHS.cache, 'audio');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const fileName = `voiceover_${jobId}.mp3`;
        const filePath = path.join(outputDir, fileName);
        
        fs.writeFileSync(filePath, response.data);
        console.log(`✅ [ElevenLabs] Áudio salvo em: ${filePath}`);
        
        return filePath;
    } catch (err: any) {
        console.error('❌ [ElevenLabs] Erro ao gerar áudio:', err.response?.data?.toString() || err.message);
        return null;
    }
}
