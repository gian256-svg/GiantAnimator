# GiantAnimator — Animation Knowledge Base
<!-- AUTO-GENERATED — NÃO EDITE MANUALMENTE -->
<!-- Última atualização: 2026-04-02 -->
<!-- Versão: 8.0 | Calibration Rules v4.0 (PIE CHART GOLD RULES) -->

---

# CALIBRATION RULES v4.0 — PRIME DIRECTIVE
**Prioridade absoluta: fidelidade visual ao gráfico original (Fidelidade > Performance).**

---

## 🥧 PIE CHART GOLD RULES (v4.0) ← NOVA 🚨
### 1. RAIO PROPORCIONAL (ANTI-CORTE)
- O raio do gráfico NUNCA deve ser fixo.
- **Cálculo:** `maxRadius = Min(chartWidth, chartHeight) * 0.38`.
- **Se houver callouts (labels externos):** Reduzir para `* 0.32`.
- Validar se título + gráfico + legenda cabem na `safeHeight`. Caso contrário, reduzir o raio em 10% recursivamente.

### 2. ESTRATÉGIA DE LABELS
- **Fatias > 8%:** Label INSIDE (Category Name + %). Fonte bold branca ou contrastante.
- **Fatias < 8%:** Label OUTSIDE com Callout Line (Linha fina conectando o centro da fatia ao texto externo).
- **Callouts:** Alinhados à esquerda ou direita dependendo do hemisfério do gráfico. Nunca sobrepor labels.

### 3. POSICIONAMENTO E ORDEM
- O Pie/Donut deve estar centralizado na Safe Area (não deslocado).
- Título/Subtítulo sempre ACIMA. Legenda sempre ABAIXO (salvo se a referência mostrar o contrário).
- Ordem das fatias: Sentido horário começando do topo (12h), seguindo a importância/valores da imagem de referência.

---

## RULE 15 — WHITE SPACE OPTIMIZATION (v3.3)
- **Boost Factor:** Fontes aumentadas em **30%** (1.30x).
- **Hook useChartDimensions:** Deve ser usado em TODOS os gráficos para garantir margens de 5%.

---

## RULE 16 — ANIMATION SPEED GLOBAL (v3.3)
- **Duração da entrada:** 80 frames (~2.6s a 30fps).
- **Easing:** `Easing.bezier(0.25, 0.1, 0.25, 1.0)`.
- **Delay Multi-Séries:** +15 frames para cada dataset.

---

## RULE 1 — CORES (CRÍTICO)
- NUNCA usar paletas padrão se houver imagem de referência.
- Extrair HEX exato para fatias/barras/linhas.

---

## CHECKLIST PIE CHART
- [ ] Gráfico não corta na base (Raio <= 0.38).
- [ ] Fatias pequenas têm callout lines.
- [ ] Fatias grandes têm texto interno bold.
- [ ] Cores seguem a referência.
- [ ] Ordem segue sentido horário.
