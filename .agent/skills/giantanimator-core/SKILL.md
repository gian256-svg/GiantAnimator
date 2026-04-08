---
name: giantanimator-core
description: Conhecimento central do projeto GiantAnimator. Usar SEMPRE em qualquer tarefa relacionada ao projeto — estrutura, convenções, fluxo de trabalho, regras de código e arquitetura geral.
metadata:
  author: gianluca
  version: "1.0"
---

# GiantAnimator — Core Skill

## O que é este projeto
GiantAnimator é um sistema de geração automática de animações de gráficos (charts) usando Remotion, controlado por um agente de IA (Gemini) via servidor Node.js/TypeScript.

## Estrutura do Projeto
GiantAnimator/
├── INICIAR.bat ← entrada principal, inicia tudo
├── server/ ← servidor Node.js + TypeScript
│   ├── index.ts ← entry point do servidor
│   ├── render.ts ← lógica de renderização Remotion
│   ├── scripts/backup.ts ← backup automático do system prompt
│   └── package.json
├── remotion-project/ ← componentes de animação React/Remotion
│   └── src/
├── .agent/ ← skills e knowledge base do agente
│   ├── skills/
│   └── knowledge/
└── ../shared/ ← pasta FORA do projeto (irmã)
    ├── input/ ← imagens a processar chegam aqui
    ├── output/ ← vídeos gerados saem aqui
    └── processed/ ← imagens já processadas vão aqui

## Regras Invioláveis
1. **Sempre TypeScript** — nunca JavaScript puro
2. **Nunca sobrescrever** arquivos sem confirmar antes
3. **Nunca commitar** `.env` ou chaves de API
4. **Sempre usar** `--transpile-only` no ts-node
5. **Erros nunca derrubam** o servidor — try/catch em tudo
6. **Logs com emojis** para facilitar leitura no console
7. **Commits em português** com mensagens descritivas

## Fluxo de Funcionamento
1. `INICIAR.bat` verifica ambiente → instala deps → inicia servidor → health check
2. Servidor monitora `../shared/input/` com chokidar + fs.watch + polling (3 camadas)
3. Arquivo detectado → entra na fila → espera estabilizar → render Remotion → move para processed
4. Vídeo `.mp4` gerado em `../shared/output/`

## Porta e Endpoints
- Porta padrão: `3000`
- `GET /health` → status do servidor, arquivos no input, estado da fila
- `GET /status` → estado da fila de processamento

## Convenções de Código
- Caminhos sempre com `path.resolve()` ou `path.join()` — nunca concatenação de string
- Variáveis de ambiente via `dotenv/config` no topo do arquivo
- Interfaces TypeScript para todos os props de componentes Remotion
- Cores e fontes centralizadas em arquivo de tema no remotion-project
