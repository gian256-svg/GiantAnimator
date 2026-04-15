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
