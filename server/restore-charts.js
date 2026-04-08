import fs from 'fs';
import path from 'path';

const charts = [
  'BarChart', 'LineChart', 'PieChart', 'MultiLineChart', 'AreaChart',
  'HorizontalBarChart', 'ScatterPlot', 'WaterfallChart', 'CandlestickChart', 'Heatmap'
];

const chartsDir = 'c:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/remotion-project/src/charts';

if (!fs.existsSync(chartsDir)) fs.mkdirSync(chartsDir, { recursive: true });

charts.forEach(name => {
  const filePath = path.join(chartsDir, `${name}.tsx`);
  if (!fs.existsSync(filePath)) {
    const content = `import React from "react";\nexport const ${name}: React.FC<any> = () => <svg width={1280} height={720} viewBox="0 0 1280 720" style={{background: "#000"}} />;\n`;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created minimal component: ${name}`);
  }
});
