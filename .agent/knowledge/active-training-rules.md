# Regras de Treinamento Autônomo (GiantAnimator)

Este documento define os protocolos para sessões de treinamento intensivo e autônomo do agente. Sempre que o modo "Intensive Training" for ativado, estas regras prevalecem.

## 1. OBJETIVOS DO TREINAMENTO
- **Soberania de Dados**: Popular o Supabase com o maior volume possível de amostras (input vs output) para futura criação de modelos locais.
- **Auto-Ajuste Cirúrgico**: Identificar falhas de posicionamento, cores ou rótulos e atualizar as "Regras de Ouro" imediatamente.
- **Stress-Test de Fallback**: Validar a transição entre provedores (Gemini, Groq, Ollama) sob carga.

## 2. PROTOCOLO DE EXECUÇÃO
1. **Busca de Referências**: Utilizar o navegador para buscar imagens de gráficos reais (Business Insider, Statista, Yahoo Finance) ou gerar dados sintéticos complexos.
2. **Processamento em Lote**: Processar 10 variações para cada componente registrado.
3. **Auditoria Obrigatória**: Todo render deve passar pelo Auditor (Tomé). 
   - **NOVA META: Score >= 95**.
   - Se Score < 95: Realizar análise de causa raiz (RCA).
   - Identificar se a falha foi na **Extração** (João/Tiago) ou no **Render** (André).
   - Injetar a crítica do Auditor de volta no Vision para uma 2ª tentativa de correção imediata.
4. **Atualização de Conhecimento**: Se uma falha for sistêmica, o agente deve editar o `TRAINING_LOG.md` e os arquivos em `.agent/knowledge/` antes do próximo teste.

## 3. COMPORTAMENTO AUTÔNOMO
- **Liberdade Total**: O agente pode criar arquivos temporários, scripts de teste e modificar o banco de dados.
- **Silêncio de Rádio**: Não solicitar confirmações para rotação de chaves ou mudanças de regras menores.
- **Registro de Sucesso**: Ao final de cada ciclo, sincronizar o `TRAINING_LOG.md` com o Supabase.

## 4. MATRIZ DE TESTES (TIPOS)
- BarChart (10x)
- LineChart (10x)
- PieChart (10x)
- AreaChart (10x)
- HorizontalBarChart (10x)
- RacingLineChart (10x)
- StackedBarChart (10x)
- MultiLineChart (10x)

---
*Documento gerado e mantido pelo Agente Antigravity conforme diretrizes de autonomia.*
