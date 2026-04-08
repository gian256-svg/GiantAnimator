# GiantAnimator 📈🎬

Sistema de geração automática de animações de gráficos usando **Remotion** + **Gemini AI**.
Transforme prints estáticos de gráficos em vídeos animados profissionais (.mp4) em segundos.

## 🚀 Como funciona

1. **Upload:** Coloque uma imagem de gráfico (`.png`, `.jpg`, `.webp`) na pasta `shared/input/` (ou use a UI).
2. **Análise IA:** O servidor detecta o arquivo, redimensiona para otimização e envia ao **Gemini 2.1 Flash**.
3. **Extração:** O Gemini extrai os dados (labels, valores), o tipo de gráfico e cores.
4. **Renderização:** O **Remotion** utiliza os dados extraídos para gerar uma animação fluida.
5. **Output:** O vídeo final aparece em `shared/output/` e a imagem original é movida para `shared/done/`.

## 🛠️ Setup Inicial

### Requisitos
- Node.js 18+
- ffmpeg (para o Remotion renderizar MP4)

### Instalação
```bash
# Entre na pasta do servidor
cd server
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env e adicione sua GEMINI_API_KEY
```

### Execução
```bash
npm run dev
```

## ⚙️ Variáveis de Ambiente (.env)

| Variável | Descrição | Padrão |
|---|---|---|
| `GEMINI_API_KEY` | Sua chave da Google AI Studio | (obrigatório) |
| `GEMINI_MOCK` | Se `true`, pula a API e usa dados fixos para teste | `false` |
| `PORT` | Porta do servidor Express | `3000` |

## 📂 Estrutura de Pastas

| Pasta | Descrição |
|---|---|
| `shared/input/` | Imagens aguardando processamento. |
| `shared/output/` | Vídeos MP4 gerados prontos para uso. |
| `shared/input/done/` | Imagens processadas com sucesso. |
| `shared/input/error/` | Imagens que falharam após 5 tentativas (ex: API offline). |
| `server/cache/` | Cache MD5 das análises da IA para economizar cota. |

## 📊 Tipos de Gráfico Suportados
- ✅ **BarChart** (Barras verticais/horizontais)
- ⏳ **LineChart** (Em breve)
- ⏳ **PieChart** (Em breve)

---
*GiantAnimator — Desenvolvido para editores de vídeo e criadores de conteúdo.*
