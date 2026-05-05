import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SERVER_URL = 'http://localhost:3000';
const INPUT_DIR = path.join(process.cwd(), 'input', 'training');

if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });

const TRAINING_DATA: Record<string, string[]> = {
  "LineChart": [
    "https://cdn.statcdn.com/CMS/GettingStartedCMS/32ae80c589f097ca4fcf8b8ef9b5906a.png",
    "https://www.investopedia.com/thmb/OzhMb4W_efag08s_Wdfbc8cNdQ8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/dotdash_INV_Final_Line_Chart_Jan_2021-01-d2dc4eb9a59c43468e48c03e15501ebe.jpg",
    "https://howtotrade.com/wp-content/uploads/2022/09/Line-Charts-in-Stocks.jpg",
    "https://myforexvps.com/wp-content/uploads/2024/07/banner_1-1.png",
    "https://www.statista.com/chart/static/daily/28744.png",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/s/t/stock_price_trends_line_chart_ppt_slide_01.jpg",
    "https://i.insider.com/61bb6d6d84944d0018a38a0b?width=700&format=jpeg&auto=webp",
    "https://i.insider.com/59416174a7092120008b495f?width=700&format=jpeg&auto=webp",
    "https://i.insider.com/5c585c5c1656f500a44f2d71?width=700&format=jpeg&auto=webp",
    "https://www.fidelity.com/bin-public/060_www_fidelity_com/images/Viewpoints/active-investor/chart-analysis-1.png"
  ],
  "PieChart": [
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/b/u/budget_allocation_for_different_services_pie_chart_example_of_ppt_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/a/n/annual_digital_marketing_budget_allocation_pie_chart_slide01.jpg",
    "https://www.slidekit.com/wp-content/uploads/2021/11/3D-Budget-Allocation-Pie-Chart-Slide-for-PowerPoint-Google-Slides.jpg",
    "https://powerslides.com/wp-content/uploads/2022/03/Budget-Pie-Chart-1.png",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/m/a/market_share_pie_chart_powerpoint_presentation_slide01.jpg",
    "https://cdn.statcdn.com/Infographic/normal/3542.jpeg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/g/l/global_market_statistics_pie_chart_with_percentage_powerpoint_slides_Slide01.jpg",
    "https://www.everviz.com/wp-content/uploads/2021/04/market-share-pie-chart.png",
    "https://capitaloneshopping.com/research/wp-content/uploads/2023/10/credit-card-market-share-statistics.png",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/m/a/market_share_analysis_pie_chart_powerpoint_slides_Slide01.jpg"
  ],
  "AreaChart": [
    "https://chartexpo.com/blog/wp-content/uploads/2022/02/Area-Chart.png",
    "https://community.atlassian.com/t5/image/serverpage/image-id/202458i23D6946658097C7C/image-size/large?v=v2&px=999",
    "https://www.domo.com/learn/charts/stacked-area-chart/_jcr_content/root/container/section/container_2/image.coreimg.png/1638302064115/stacked-area-chart-example.png",
    "https://cdn.statcdn.com/Infographic/normal/28114.jpeg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/q/u/quarterly_electronics_sales_overview_structured_sales_growth_area_chart_slide01.jpg",
    "https://i.stack.imgur.com/5z6vL.png",
    "https://visme.co/blog/wp-content/uploads/2018/06/area-chart-thumbnail.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/p/r/project_revenue_growth_area_chart_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/c/u/cumulative_growth_area_chart_ppt_presentation_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/s/a/sales_growth_analysis_area_chart_slide01.jpg"
  ],
  "HorizontalBarChart": [
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/c/o/competency_rating_of_employees_horizontal_bar_chart_sample_ppt_presentation_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/m/a/market_drivers_and_market_growth_factors_horizontal_bar_chart_ppt_icon_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/h/o/horizontal_bar_graph_with_percentages_slide01.jpg",
    "https://cdn.statcdn.com/Infographic/normal/5055.jpeg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/t/o/top_5_horizontal_bar_chart_examples_with_templates_and_samples_slide01.jpg",
    "https://media.geeksforgeeks.org/wp-content/uploads/20220831154543/HorizontalBarGraph-660x315.png",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/g/r/growth_drivers_and_barriers_horizontal_bar_chart_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/h/o/horizontal_bar_chart_for_comparison_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/i/n/increasing_efficiency_drivers_with_horizontal_bar_chart_slide01.jpg",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/e/m/employee_productivity_horizontal_bar_chart_slide01.jpg"
  ],
  "StackedBarChart": [
    "https://cdn.statcdn.com/Infographic/normal/14081.jpeg",
    "https://www.smashingmagazine.com/wp-content/uploads/2017/02/01-stacked-bar-chart-large-opt.png",
    "https://analysisfunction.civilservice.gov.uk/wp-content/uploads/2021/04/stacked-bar-chart-example.png",
    "https://think.design/wp-content/uploads/2020/03/stacked-bar-chart-composition.png",
    "https://think.design/wp-content/uploads/2020/03/stacked-bar-chart-comparison.png",
    "https://think.design/wp-content/uploads/2020/03/stacked-bar-chart-distribution.png",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/s/t/stacked_bar_chart_powerpoint_presentation_slide01.jpg",
    "https://www.venngage.com/blog/wp-content/uploads/2019/08/Stacked-Bar-Chart-Template-1.png",
    "https://chartexpo.com/blog/wp-content/uploads/2022/10/Stacked-Bar-Diagram.png",
    "https://www.slideteam.net/media/catalog/product/cache/1280x720/p/r/project_allocation_stacked_bar_chart_slide01.jpg"
  ]
};

async function downloadImage(url: string, dest: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return dest;
  } catch (e: any) {
    throw new Error(`Erro no download (${url}): ${e.message}`);
  }
}

async function runTraining() {
  console.log("🚀 [GLOBAL TRAINING] Iniciando Sessão de Treinamento Intensivo (Todos os Tipos)...");
  
  for (const [category, urls] of Object.entries(TRAINING_DATA)) {
    console.log(`\n📂 [LOTE] Iniciando categoria: ${category}`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const filename = `training_${category}_${i + 1}.png`;
      const filepath = path.join(INPUT_DIR, filename);

      try {
        console.log(`\n📥 [${category}] [${i+1}/${urls.length}] Baixando: ${url}`);
        await downloadImage(url, filepath);

        console.log(`📤 Enviando para o pipeline: ${filename}`);
        const fileBuffer = fs.readFileSync(filepath);
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        formData.append('file', blob, filename);
        formData.append('chartTheme', 'dark');
        formData.append('includeCallouts', 'true');
        formData.append('enableAuditor', 'true');

        const uploadRes = await fetch(`${SERVER_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadData: any = await uploadRes.json();
        const jobId = uploadData.jobId;
        console.log(`⏳ Job ID: ${jobId}. Aguardando conclusão...`);

        // Polling para verificar progresso
        let done = false;
        while (!done) {
          await new Promise(r => setTimeout(r, 5000));
          const progRes = await fetch(`${SERVER_URL}/progress/${jobId}`);
          if (!progRes.ok) {
              console.error(`❌ Erro ao consultar progresso do Job ${jobId}`);
              break;
          }
          const job: any = await progRes.json();
          
          if (job.status === 'awaiting_review' || job.status === 'done') {
            console.log(`✅ [${category}] Job ${jobId} finalizado com status: ${job.status}`);
            done = true;
          } else if (job.status === 'error') {
            console.error(`❌ [${category}] Erro no Job ${jobId}: ${job.error}`);
            done = true;
          } else {
            // console.log(`... [${job.status}] ${job.stage} (${job.progress}%)`);
          }
        }

      } catch (err: any) {
        console.error(`❌ Falha no item ${category} #${i+1}:`, err.message);
      }
    }
  }

  console.log("\n🏁 [GLOBAL TRAINING] Sessão completa concluída.");
}

runTraining();

