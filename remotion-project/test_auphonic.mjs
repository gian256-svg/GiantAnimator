import fs from 'fs';

const apiKey = "BbSPr9U6msK9238MSkSNWDU5vBxVqT6y";
const fileBuffer = Buffer.from("test audio content dummy");
const blob = new Blob([fileBuffer], { type: 'audio/wav' });

const formData = new FormData();
formData.append('input_file', blob, 'test.wav');
formData.append('action', 'start');
formData.append('algorithms', JSON.stringify({ leveler: true, normloudness: true, loudnesstarget: -16, denoise: true, denoisemethod: "dynamic" }));
formData.append('output_files', JSON.stringify([{ format: "aac", bitrate: 192 }]));

async function test() {
    try {
        const res = await fetch("https://auphonic.com/api/productions.json", {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
