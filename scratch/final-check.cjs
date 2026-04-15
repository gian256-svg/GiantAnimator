
const XLSX = require('xlsx');
const fs = require('fs');

function detectDelimiter(content) {
  const lines = content.split('\n').slice(0, 5).filter(l => l.trim().length > 0);
  if (lines.length === 0) return ',';
  const delims = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let bestScore = -1;
  for (const delim of delims) {
    const counts = lines.map(l => l.split(delim).length - 1);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (avg > 0) {
      if (avg > bestScore) {
        bestScore = avg;
        bestDelimiter = delim;
      }
    }
  }
  return bestDelimiter;
}

try {
    const filePath = './input/nvidia_vs_sp500_retorno_anual.csv';
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf-8');
    const delimiter = detectDelimiter(content);
    console.log(`Delimiter: ${delimiter}`);
    
    const workbook = XLSX.read(content, { type: 'string', FS: delimiter });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    console.log('Result:', JSON.stringify(rows.slice(0, 2), null, 2));
    if (rows.length > 0) console.log('Final Success Check: OK');
} catch (e) {
    console.error('Final Error Check:', e.message);
}
