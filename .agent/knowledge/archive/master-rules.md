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
