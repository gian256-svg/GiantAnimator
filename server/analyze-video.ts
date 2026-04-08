import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeVideoFrames(folderPath: string, isLineChart: boolean = false): Promise<any> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash'
  }); 
  
  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    .sort()
    .slice(0, 8); 

  const basePrompt = `Você está analisando frames sequenciais de um vídeo de gráfico animado.
Estes frames foram extraídos a cada 2 segundos.

Analise a SEQUÊNCIA COMPLETA e responda APENAS em JSON:

{
  "chartType": "bar | line | pie | area | scatter | mixed",
  "animationPatterns": {
    "entryAnimation": {
      "type": "grow | fade | slide | draw | pop",
      "direction": "bottom-up | left-right | center-out | top-down",
      "durationEstimateMs": 0,
      "easing": "linear | ease-in | ease-out | ease-in-out | spring | bounce"
    },
    "stagger": {
      "hasStagger": true,
      "delayBetweenElementsMs": 0,
      "staggerDirection": "left-to-right | right-to-left | random | simultaneous"
    },
    "dataLabels": {
      "appearsAfterBar": true,
      "animationType": "fade | pop | slide",
      "delayAfterBarMs": 0
    },
    "axisAnimation": {
      "axisDrawsFirst": true,
      "gridLinesAppear": "before | with | after",
      "durationMs": 0
    },
    "exitAnimation": {
      "hasExit": false,
      "type": "none | fade | shrink | slide"
    }
  },
  "qualityScore": 0,
  "observations": "..."
}`;

  const lineChartPrompt = `Você está analisando frames sequenciais de um gráfico de linha animado (LINE CHART).
Estes frames foram extraídos a cada 2 segundos.

Analise a SEQUÊNCIA COMPLETA e responda EM JSON com os seguintes campos:

{
  "lineMetrics": {
    "seriesCount": 0,
    "lineStyle": "smooth | angular",
    "hasArea": false,
    "hasDots": false,
    "dotStyle": "pop | fade | scale"
  },
  "animation": {
    "drawDirection": "left-to-right | bottom-up",
    "durationMs": 0,
    "easing": "linear | ease-in-out | spring",
    "staggerBetweenSeriesMs": 0,
    "dotsAppear": "during-draw | after-draw"
  },
  "labels": {
    "numberFormat": "abbreviated | full",
    "suffixPrefix": "found or null",
    "legendLocation": "inline | external"
  },
  "qualityScore": 0,
  "observations": "..."
}`;

  const parts: any[] = [
    { text: isLineChart ? lineChartPrompt : basePrompt }
  ];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const data = fs.readFileSync(filePath).toString("base64");
    const mimeType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
    parts.push({
      inlineData: {
        mimeType,
        data
      }
    });
  }

  const result = await model.generateContent(parts);
  const text = result.response.text();
  const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonStr);
}

if (require.main === module) {
  const folder = process.argv[2];
  const isLine = process.argv.includes('--line');
  
  if (!folder) {
    console.error("Uso: npx ts-node analyze-video.ts <pasta_de_frames> [--line]");
    process.exit(1);
  }
  
  analyzeVideoFrames(folder, isLine).then(res => {
    console.log(JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error("Erro:", err);
  });
}
