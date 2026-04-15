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
