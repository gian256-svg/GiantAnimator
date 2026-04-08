---
name: training
description: Como registrar novos aprendizados, corrigir comportamentos e adicionar conhecimento permanente ao agente. Usar quando o usuário ensinar algo novo, corrigir um erro recorrente ou pedir para "lembrar" de algo.
metadata:
  author: gianluca
  version: "2.0"
---

# Training Skill — Como Aprender e Lembrar

## Quando usar esta skill
- Usuário diz "lembra disso", "sempre faça assim", "nunca faça aquilo"
- Usuário corrige um erro que já aconteceu antes
- Usuário ensina uma nova convenção ou preferência
- Usuário resolve um problema e quer que o agente saiba a solução

## Como registrar via API (servidor rodando)

### Novo aprendizado geral
```bash
curl -X POST http://localhost:3000/knowledge/training \
  -H "Content-Type: application/json" \
  -d '{
    "category": "CONVENÇÃO",
    "learned": "O que foi aprendido",
    "context": "Por que é importante",
    "applyWhen": "Quando aplicar esse conhecimento"
  }'
```

### Problema conhecido e solução
```bash
curl -X POST http://localhost:3000/knowledge/issue \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nome do problema",
    "symptom": "O que acontece",
    "cause": "Por que acontece",
    "solution": "Como resolver"
  }'
```

### Convenção de código
```bash
curl -X POST http://localhost:3000/knowledge/convention \
  -H "Content-Type: application/json" \
  -d '{
    "section": "TypeScript",
    "rule": "Sempre usar path.resolve() para caminhos"
  }'
```

### Ver resumo do knowledge base
```bash
curl http://localhost:3000/knowledge/summary
```

## Regra Principal
Sempre que aprender algo novo e relevante, PROATIVAMENTE perguntar: "Quer que eu registre isso no knowledge base para não esquecer?" E se confirmado, usar a API acima para persistir.
