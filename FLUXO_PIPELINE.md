# 🌊 Fluxo de Operação — GiantAnimator
> Resumo executivo da pipeline de inteligência e renderização.

---

## 1. Entrada de Dados (Capture)
O sistema aceita dois tipos de gatilhos:
- **Visual**: Imagem de um gráfico (PNG/JPG) para reconstituição total.
- **Estrutural**: Planilhas (CSV/XLSX) para criação baseada em dados puros.

## 2. Motor de Visão Surgery-Grade (Extraction)
- **Resolução**: Digitalização UHD (3840px) para leitura de eixos e Direct Labels.
- **Protocolo Híbrido (Plano B)**: Integração de **OCR Local (Tesseract.js)**. Se o serviço de nuvem falhar (Erro 503), o sistema entra em modo de reconstituição via texto para garantir zero interrupção.
- **Persistência Extrema**: Algoritmo de 10 tentativas com backoff inteligente para vencer picos de demanda.
- **RAG-Lite**: Injeção de aprendizados históricos (`TRAINING_LOG`) para evitar erros passados.

## 3. Auditoria de Fidelidade Silenciosa (Audit) — **NOVO**
- **Loop de Feedback**: O sistema gera um frame de teste (`still`) antes de renderizar.
- **Conformidade**: Um Agente Auditor compara o render com o original.
- **Meta >95% (Hard-Gate)**: Se o Fidelidade Score for < 95, o sistema re-analisa e corrige os dados automaticamente. O render só prossegue se a precisão cirúrgica for garantida.

## 4. Renderização 4K UHD (Creation)
- **Framework**: Remotion v4 (Node.js/React).
- **Padrão de Qualidade**: 
  - Resolução Nativa: 3840 x 2160 pixels.
  - Margem Segura: 10% (Action Safe).
  - Animação: DNA Mango (Staggered springs, 8s reveal).

## 5. Entrega (Delivery)
- **Watcher**: Monitoramento em tempo real de drives locais ou de rede (Drive K:).
- **Tempo Médio**: ~85s para análise cirúrgica e renderização 4K completa.
- **Saída**: Vídeo H.264 pronto para apresentações e mídias sociais.

---
*Documentação para Reuniões e Report de Performance.*
