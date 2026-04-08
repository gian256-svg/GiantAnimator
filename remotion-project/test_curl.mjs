import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const apiKey = "BbSPr9U6msK9238MSkSNWDU5vBxVqT6y";
const testWav = "test.wav";
fs.writeFileSync(testWav, Buffer.from("dummy audio content"));

const jsonArgs = `{"leveler":true,"normloudness":true,"loudnesstarget":-16,"denoise":true,"denoisemethod":"dynamic"}`;
const outJson = `[{"format":"aac","bitrate":192}]`;

const curlCmd = `curl -s -X POST https://auphonic.com/api/productions.json ^
 -H "Authorization: Bearer ${apiKey}" ^
 -F "action=start" ^
 -F "algorithms=${jsonArgs.replace(/"/g, '\\"')}" ^
 -F "output_files=${outJson.replace(/"/g, '\\"')}" ^
 -F "input_file=@${testWav}"`;

fs.writeFileSync("test_curl.bat", curlCmd);

const proc = spawnSync('cmd.exe', ['/c', 'test_curl.bat'], { encoding: 'utf8' });
console.log(proc.stdout);
console.log(proc.stderr);
