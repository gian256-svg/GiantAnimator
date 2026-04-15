// server/agent.ts
import "dotenv/config";
import fs   from "fs";
import path from "path";
import { GoogleGenAI, type Chat } from "@google/genai";
import { type NormalizedTableData } from "./tableParserService.js";
import { componentRegistry } from "./componentRegistry.js";
import { GEMINI_MODEL } from "./calibration/constants.js";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─────────────────────────────────────────────────────────
// Carrega o system prompt base + knowledge base completo
// ─────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  const knowledgeFiles = [
    ".agent/knowledge/remotion-charts.md",
    ".agent/knowledge/remotion-spring.md",
    ".agent/knowledge/highcharts-visual-rules.md",  // ✅ Regras de Ouro
    "TRAINING_LOG.md",                              // ✅ APRENDIZADOS E UI/UX PRO MAX
    "agent-backup/SYSTEM_PROMPT.md",
  ];

  const knowledge = knowledgeFiles
    .filter(fs.existsSync)
    .map((f) => {
      const label = path.basename(f, ".md").toUpperCase();
      return `## [${label}]\n${fs.readFileSync(f, "utf-8")}`;
    })
    .join("\n\n---\n\n");

  return `
Você é o agente principal do GiantAnimator — um sistema de geração de animações
de gráficos usando Remotion, controlado por IA.

## ⚠️ REGRA ABSOLUTA #1 — NUNCA VIOLAR:
Sempre dar preferência ao layout original do gráfico.
Se o usuário enviou uma referência visual, replique-a fielmente.
NÃO improvise design. NÃO melhore sem ser solicitado.

## Suas responsabilidades:
1. Interpretar imagens de gráficos enviadas pelo usuário
2. Gerar componentes Remotion TypeScript fielmente baseados na referência
3. Coordenar o pipeline de calibração quando solicitado
4. Responder perguntas sobre o projeto GiantAnimator
5. Analisar e corrigir erros de compilação/renderização

## Regras de comportamento:
- Sempre confirmar antes de executar ações destrutivas
- Logar cada ação com timestamp no console
- Nunca derrubar o servidor — use try/catch em tudo
- Responder em português (Brasil)

${knowledge}
`.trim();
}

// ─────────────────────────────────────────────────────────
// Classe do Agente Principal
// ─────────────────────────────────────────────────────────
export class GiantAnimatorAgent {
  private chat:   Chat | null  = null;
  private ready:  boolean      = false;
  private systemPrompt: string = "";

  async initialize(): Promise<void> {
    console.log("🤖 [Agent] Inicializando GiantAnimator Agent...");
    const maskedKey = process.env.GEMINI_API_KEY ? `****${process.env.GEMINI_API_KEY.slice(-4)}` : "NÃO DEFINIDA";
    console.log(`🔑 Gemini API Key: ${maskedKey}${process.env.GEMINI_MOCK === "true" ? " (MODO MOCK ATIVADO)" : ""}`);
    
    try {
      this.systemPrompt = buildSystemPrompt();

      // ✅ API correta no SDK v1.48 — ai.chats.create()
      this.chat = ai.chats.create({
        model:   GEMINI_MODEL,
        config:  { systemInstruction: this.systemPrompt },
        history: [],
      });

      this.ready = true;
      console.log("✅ [Agent] Pronto — modelo:", GEMINI_MODEL);
    } catch (err) {
      console.error("❌ [Agent] Falha na inicialização:", err);
      this.ready = false;
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────
  // isReady — usado pelo index.ts antes de aceitar requests
  // ─────────────────────────────────────────────────────
  isReady(): boolean {
    return this.ready && this.chat !== null;
  }

  /**
   * sendWithRetry — Túnel resiliente para mensagens da IA.
   * Aguarda 10s, 20s, 30s em caso de cota excedida (429).
   */
  private async sendWithRetry(parts: any, retries: number = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        if (!this.chat) throw new Error("Chat não inicializado.");
        return await this.chat.sendMessage({ message: parts });
      } catch (err: any) {
        const isRetryable = 
          err?.status === 429 || 
          err?.message?.includes("429") || 
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.status === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("UNAVAILABLE");

        if (isRetryable && i < retries - 1) {
          const wait = (i + 1) * (err?.status === 503 ? 2000 : 10000);
          console.warn(`⏳ [GEMINI] Erro temporário (${err?.status || '503'}) — Tentativa ${i + 1}/${retries}. Aguardando ${wait / 1000}s...`);
          await new Promise((r) => setTimeout(r, wait));
        } else {
          throw err;
        }
      }
    }
    throw new Error(`Falha persistente após ${retries} tentativas.`);
  }

  // ─────────────────────────────────────────────────────
  // Mensagem de texto simples
  // ─────────────────────────────────────────────────────
  async sendMessage(userMessage: string): Promise<string> {
    if (!this.isReady() || !this.chat) {
      throw new Error("Agente não inicializado. Aguarde ou reinicie o servidor.");
    }

    try {
      const response = await this.sendWithRetry(userMessage);
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? (response as any).text ?? "";
      return text || "Sem resposta do modelo.";
    } catch (err) {
      const msg = `Erro no agente: ${String(err)}`;
      console.error(`❌ [Agent] ${msg}`);
      throw new Error(msg);
    }
  }

  // ─────────────────────────────────────────────────────
  // Análise de imagem (gráfico de referência)
  // ─────────────────────────────────────────────────────
  async analyzeChart(
    imagePath: string,
    userInstruction: string = "Analise este gráfico e gere o componente Remotion correspondente."
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error("Agente não inicializado.");
    }

    console.log(`🔍 [Agent] Analisando imagem: ${path.basename(imagePath)}`);

    // Upload via Files API
    const fileBuffer = fs.readFileSync(imagePath);
    const blob       = new Blob([fileBuffer], { type: "image/png" });

    let imagePart: object;
    try {
      const uploaded = await ai.files.upload({
        file:   blob,
        config: { mimeType: "image/png", displayName: path.basename(imagePath) },
      });

      // Aguarda processamento
      let file    = uploaded;
      let attempt = 0;
      while (file.state === "PROCESSING" && attempt < 15) {
        await new Promise((r) => setTimeout(r, 2000));
        file = await ai.files.get({ name: file.name! });
        attempt++;
      }

      imagePart = { fileData: { mimeType: "image/png", fileUri: file.uri! } };
      console.log(`✅ [Agent] Imagem processada: ${file.uri}`);
    } catch (uploadErr) {
      console.warn(`⚠️  [Agent] Upload falhou — fallback inlineData: ${uploadErr}`);
      imagePart = {
        inlineData: {
          mimeType: "image/png",
          data:     fileBuffer.toString("base64"),
        },
      };
    }

    try {
      const response = await this.sendWithRetry([
        { text: userInstruction },
        imagePart as any,
      ]);

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? (response as any).text ?? "";
      return text || "Sem resposta do modelo.";
    } catch (err) {
      throw new Error(`Análise de imagem falhou: ${String(err)}`);
    }
  }

  /**
   * analyzeTable — Analisa dados de planilha e recomenda o melhor gráfico.
   */
  async analyzeTable(parsedData: NormalizedTableData): Promise<any> {
    if (!this.isReady()) throw new Error("Agente não inicializado.");

    const prompt = `
Você é um especialista em visualização de dados 4K para o GiantAnimator.
Recebi uma planilha com os seguintes dados:

RESUMO DA TABELA:
- Total de linhas: ${parsedData.summary.totalRows}
- Total de colunas: ${parsedData.summary.totalCols}
- Colunas categóricas: ${parsedData.summary.categoricalColumns.join(', ')}
- Colunas numéricas: ${parsedData.summary.numericColumns.join(', ')}

AMOSTRA (primeiras 5 linhas):
${JSON.stringify(parsedData.summary.sample, null, 2)}

TODOS OS DADOS:
${JSON.stringify(parsedData.rows, null, 2)}

TIPOS DE GRÁFICO DISPONÍVEIS: ${componentRegistry.getTypes().join(', ')}

TAREFA:
Com base nos dados, escolha o tipo de gráfico mais adequado e gere a configuração completa.

REGRAS:
- Se houver 1 coluna categórica + 1 numérica -> prefira BarChart ou HorizontalBarChart
- Se houver 1 coluna de tempo/data + 1 numérica -> prefira LineChart
- Se os valores somam ~100% -> prefira PieChart ou DonutChart
- Se houver múltiplas séries numéricas -> prefira GroupedBarChart ou LineChart
- Cores seguem o padrão Mango/Lychee UHD + UI/UX Pro Max (Heuristic Palettes)
- Tipografia: Usar fontes Inter, Roboto ou OpenSans com pesos variados (400/600/700)
- Ícones: SE usar ícones, apenas nomes de ícones Lucide (ex: "TrendingUp") — NUNCA emojis
- Contraste: Garantir legibilidade máxima (High Contrast)
- Saída ESTRITAMENTE em JSON, sem markdown, sem texto extra

FORMATO DE SAÍDA OBRIGATÓRIO:
{
  "type": "NomeDoComponente",
  "title": "Título sugerido baseado nos dados",
  "subtitle": "Subtítulo opcional",
  "data": [{ "label": "...", "value": 0 }],
  "backgroundColor": "#0f1117",
  "textColor": "#ffffff",
  "mutedColor": "#a0a0b0",
  "elementColors": ["#7c6af7", "#34d399", "#fbbf24", "#f87171", "#60a5fa"],
  "scale": 1
}
`;

    try {
      const response = await this.sendWithRetry(prompt);
      const text = (response.candidates?.[0]?.content?.parts?.[0]?.text ?? (response as any).text ?? "").trim();
      const clean = (text || "{}").replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      throw new Error(`Falha na análise da tabela pelo Gemini: ${String(err)}`);
    }
  }

  // ─────────────────────────────────────────────────────
  // Reset do histórico de chat (nova sessão)
  // ─────────────────────────────────────────────────────
  async resetChat(): Promise<void> {
    console.log("🔄 [Agent] Resetando histórico de chat...");
    this.ready = false;
    await this.initialize();
  }

  // Expõe o histórico para debug/backup
  getHistory() {
    return this.chat?.getHistory() ?? [];
  }
}

// Singleton — uma instância por processo
export const agent = new GiantAnimatorAgent();
