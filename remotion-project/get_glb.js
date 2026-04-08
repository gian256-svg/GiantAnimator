const https = require('https');
const fs = require('fs');

const url = "https://www.meshy.ai/pt-BR/3d-models/SunChariot-Carved-Chair-v2-019d0fb0-2f40-7e62-bcb5-44efb31d130e";

https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            // log the matches
            const regex = /https?:\/\/[^\s"'<>]+\.glb/g;
            const matches = rawData.match(regex);
            if (matches) {
                console.log("Found GLB links:");
                Array.from(new Set(matches)).forEach(m => console.log(m));
            } else {
                console.log("No .glb files found in HTML. Saving html to debug.html");
                fs.writeFileSync('debug.html', rawData);
            }
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
