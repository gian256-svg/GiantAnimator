const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'knowledge-base', 'reports');
const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('analysis_linechart_') && f.endsWith('.json'));

let totalSeriesCount = 0;
let hasAreaCount = 0;
let hasDotsCount = 0;
let drawDirection = {};
let durations = [];
let maxScore = 0;

for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(reportsDir, file), 'utf16le');
    if (!raw.trim()) continue;
    const data = JSON.parse(raw);
    
    if (data.lineMetrics) {
       totalSeriesCount += data.lineMetrics.seriesCount || 0;
       if (data.lineMetrics.hasArea) hasAreaCount++;
       if (data.lineMetrics.hasDots) hasDotsCount++;
    }
    
    if (data.animation) {
       let dir = data.animation.drawDirection || 'unknown';
       drawDirection[dir] = (drawDirection[dir] || 0) + 1;
       if (data.animation.durationMs) durations.push(data.animation.durationMs);
    }
  } catch(e) { /* ignore invalid json */ }
}

const avgDuration = durations.length ? durations.reduce((a,b)=>a+b)/durations.length : 1500;

const summary = \
## Análise de \ vídeos de Line Charts:
- Área observada em: \ vídeos
- Dots observados em: \ vídeos
- Durações das animações (média): \ms
- Direção de desenho predominante: \
\;

console.log(summary);
