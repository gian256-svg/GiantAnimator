# ACTIVE SYSTEM RULES (Conventions & Infrastructure)

# Regras Globais — GiantAnimator

## Regra: TRAINING_LOG — Append Only
- NUNCA sobrescrever o TRAINING_LOG.md inteiro.
- SEMPRE usar append (adicionar ao final).
- Cada ciclo deve ter seu próprio bloco com header: ## [DATA] — CICLO N: NOME.
- O histórico completo deve ser preservado indefinidamente.

## Regra: SEGURANÇA_E_PRIVACIDADE — Confinamento
- O único caminho autorizado para acesso e alteração no drive K: é estritamente `K:\Shared`. 
- O acesso a qualquer outro diretório no drive K: ou fora da pasta do projeto (`GiantAnimator`) é expressamente proibido.
- Esta regra sobrepõe qualquer outra necessidade de exploração de arquivos.
## Regra: MINIMALISMO_E_REDUÇÃO_DE_RUÍDO
- O objetivo é a elegância 4K. Menos é mais.
- NUNCA adicione rótulos de dados (data labels) se eles não estiverem explicitamente visíveis na imagem de referência.
- Se a unidade de medida for longa, ela deve ser movida para uma nota de rodapé ou título, nunca repetida nos eixos ou barras.
- Na dúvida, siga estritamente o design da referência fornecida pelo usuário.

## Regra: INICIALIZAÇÃO_SÍNCRONA
- Sempre que a sessão iniciar ou o servidor for ligado, o Agente DEVE ler:
    1.  `TRAINING_LOG.md` (últimas seções)
    2.  `.agent/skills/*.md`
    3.  `.agent/knowledge/*.md`
    4.  `git status` e `git log -n 5` para sincronizar o contexto de trabalho.

## Regra: REDE_LOCAL_E_SHARING
- O servidor está configurado para rodar em: `http://10.120.5.21:3000/`.
- Este IP deve ser mantido e divulgado para acesso de outras máquinas na rede interna, permitindo o compartilhamento do sistema.
- Qualquer alteração na porta ou IP deve ser refletida aqui e no log.

## Regra: SINCRONIZAÇÃO_K_SHARED
- TODA e QUALQUER alteração feita nos arquivos locais (`GiantAnimator/*`) DEVE ser replicada imediatamente para `K:\Shared\GiantAnimator\`.
- O drive K: funciona como o espelho de produção e backup acessível para a equipe.
- O Agente é responsável por manter ambos os ambientes em sincronia absoluta.


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


# GiantAnimator Data Ingestion Rules (ISOLATED)

Este documento contém as regras exclusivas para o processamento de planilhas (CSV/XLSX). 
ESTAS REGRAS NUNCA DEVEM SER APLICADAS À ANÁLISE DE IMAGENS POR IA.

## 1. Identificação de Colunas
- **Colunas de Tempo**: Cabeçalhos que contenham "Ano", "Year", "Data", "Date", "Mês", "Month", "Trimestre", "Quarter" ou "Day" devem ser classificados como **labels/categorias**, nunca como valores numéricos.
- **Valores Numéricos**: Apenas colunas que contenham métricas (ex: $, %, R$, unidades, contagens) devem ser usadas como fonte de dados para eixos Y ou magnitude de barras.

## 2. Integridade dos Dados
- **Mapeamento Direto**: O sistema deve priorizar o mapeamento 1:1 dos dados da planilha. Jamais arredondar ou alterar valores originais.
- **Múltiplas Séries**: Se a planilha tiver mais de 1 coluna numérica válida, o sistema DEVE gerar um gráfico Multi-Series (LineChart com múltiplas linhas ou GroupedBarChart).

## 3. Precedência de Regras
- Quando em modo **"CRIAR POR DADOS"**, as regras deste documento sobrescrevem qualquer interpretação visual.
## 4. Regras de Design Premium 4K (Visual Excellence)
- **Centralização Vertical**: O gráfico deve estar centralizado na tela. O topo (`plotTop`) e a base (`plotBottom`) devem respeitar uma margem de segurança de pelo menos 15% da altura da tela para o header e 10% para o footer.
- **Respiro de Escala (Padding Y)**: A escala máxima do gráfico (`maxV`) deve ser sempre 15% maior que o maior valor do conjunto de dados. Isso evita o efeito de "linha colada no teto".
- **Safe Areas**: Nunca permitir que elementos de dados (pontos, barras ou labels) sobreponham o título ou legendas.
- **Grades Sutis**: Usar grades horizontais com opacidade baixa (0.1 ou 0.2) para manter a elegância sem poluir o visual.
