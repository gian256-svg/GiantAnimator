# Convenções do Projeto — GiantAnimator

---

## TypeScript
- Sempre `--transpile-only` no ts-node
- Interfaces para todos os props de componentes Remotion
- `path.resolve()` e `path.join()` para caminhos — nunca string concatenation
- `dotenv/config` sempre no topo do arquivo principal

## Logs no Console
- Usar emojis para categorizar: 📥 entrada, ✅ sucesso, ❌ erro, ⚠️ aviso, 🔄 processo, 📦 arquivo, 🌐 rede
- Sempre incluir timestamp em logs de processamento: `[${new Date().toISOString()}]`

## Estrutura de Arquivos Novos
- Novas funcionalidades do servidor → módulo separado em `server/`
- Novos tipos de gráfico → componente separado em `remotion-project/src/`
- Nunca modificar `remotion.config.ts` sem confirmar com usuário

## Git
- Mensagens de commit em português
- Nunca push direto na main sem revisar
- `.env` sempre no `.gitignore`
- `agent-backup/history/` pode ser ignorado no `.gitignore`

## Variáveis de Ambiente
- Arquivo `.env` sempre em `server/.env`
- Chave `GEMINI_API_KEY` nunca no repositório
- Documentar variáveis necessárias no README
