# GiantAnimator 🎬

Pipeline inteligente de geração de **animações de gráficos em 4K UHD**, controlado por agente de IA (Gemini).

Envie uma imagem ou planilha — o agente analisa os dados, escolhe o melhor gráfico e renderiza um vídeo animado em MP4.

---

## 🧠 Como Funciona

### Via Imagem
1. Faça upload de um print/screenshot de gráfico pela interface web.
2. **Motor Híbrido**: O **Gemini Vision** analisa a imagem; se a API falhar (503), o **OCR Local (Tesseract)** assume a extração de dados.
3. **Auditoria de Fidelidade**: O sistema gera um frame de teste e um agente independente valida se a precisão é **>95%**.
4. O **Remotion** renderiza a animação em 4K UHD.
5. O vídeo MP4 fica disponível para download.

### Via Planilha
1. Faça upload de um arquivo `.xlsx`, `.csv` ou `.ods`
2. O **Gemini** lê os dados tabulares e decide o tipo de gráfico ideal
3. O **Remotion** renderiza a animação em 4K
4. O vídeo MP4 fica disponível para download

---

## 🚀 Setup

```bash
# 1. Instalar dependências
npm install
cd remotion-project && npm install && cd ..

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env e adicionar GEMINI_API_KEY

# 3. Build do servidor
npm run build

# 4. Iniciar
npm start
```
Acesse: `http://localhost:3000`

## 📂 Estrutura de Pastas

```
GiantAnimator/
├── server/                     # Backend Node.js + TypeScript
│   ├── index.ts                # Entry point + rotas
│   ├── agent.ts                # Agente Gemini (analyzeImage + analyzeTable)
│   ├── renderService.ts        # Orquestrador do Remotion
│   ├── tableParserService.ts   # Parser de xlsx/csv/ods
│   ├── componentRegistry.ts    # Catálogo de componentes disponíveis
│   ├── sseService.ts           # Eventos em tempo real (SSE)
│   ├── paths.ts                # Fonte de verdade de todos os caminhos
│   ├── public/                 # Frontend (HTML + CSS + JS)
│   ├── scripts/                # Utilitários: save-knowledge, load-context
│   └── calibration/            # Scraper de referências visuais
├── remotion-project/           # Componentes de animação (Remotion)
│   └── src/
│       ├── BarChart.tsx
│       ├── LineChart.tsx
│       ├── PieChart.tsx
│       └── ...
├── .agent/
│   └── knowledge/
│       └── TRAINING_LOG.md     # Base de conhecimento do agente
├── input/
│   ├── images/                 # Imagens de entrada
│   └── tables/                 # Planilhas de entrada
└── output/                     # Vídeos gerados
```

## 🛠️ Stack

| Camada | Tecnologia |
| :--- | :--- |
| **Runtime** | Node.js + TypeScript (ESM) |
| **Framework** | Express |
| **IA** | Google Gemini 2.5 Flash |
| **Resiliência** | OCR Local (Tesseract.js) |
| **Auditoria** | Silent Auditor Loop (>95% Score) |
| **Renderização** | Remotion 4.x |
| **Parsers** | xlsx, csv-parse, ods |
| **Frontend** | HTML + CSS + JS (Vanilla) |
| **Eventos** | Server-Sent Events (SSE) |

## 📊 Tipos de Gráfico Suportados
- **BarChart** — barras verticais
- **HorizontalBarChart** — barras horizontais
- **LineChart** — linhas / séries temporais
- **PieChart** — pizza
- **DonutChart** — rosca
- **GroupedBarChart** — barras agrupadas

## 🧩 Variáveis de Ambiente (`.env`)
```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3000
```

## 📘 Base de Conhecimento
O agente mantém um log de aprendizados em `.agent/knowledge/TRAINING_LOG.md`. Toda nova convenção, bug corrigido ou padrão descoberto é registrado lá.

## ⚠️ Regras Importantes
1. Nunca commitar o `.env`
2. Todo novo tipo de gráfico deve ser registrado no `componentRegistry.ts`
3. Imports `.ts` sempre com extensão `.js` (ESM/NodeNext)
4. Codec do Remotion: sempre **h264**
