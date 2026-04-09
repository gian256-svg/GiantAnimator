export interface ComponentEntry {
  id: string;
  aliases: string[];
  description: string;
  propsSchema: string;
  exampleProps: object;
}

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  {
    id: "BarChart",
    aliases: ["bar chart", "barra", "colunas", "barras verticais", "gráfico de colunas"],
    description: "Gráfico de barras verticais para comparar categorias.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Vendas por Região",
      data: [{ label: "Norte", value: 100 }, { label: "Sul", value: 150 }],
      backgroundColor: "#0F172A",
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "LineChart",
    aliases: ["line chart", "linha", "tendência", "gráfico de linha"],
    description: "Gráfico de linha para mostrar tendências ao longo do tempo.",
    propsSchema: "data: { label: string, value: number }[], title?: string, color?: string, backgroundColor?: string, textColor?: string, gridColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Crescimento Mensal",
      data: [{ label: "Jan", value: 10 }, { label: "Fev", value: 25 }],
      backgroundColor: "#0F172A",
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "PieChart",
    aliases: ["pie chart", "pizza", "gráfico de setores", "circular"],
    description: "Gráfico de pizza para proporções de um todo.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[], sliceColors?: string[]",
    exampleProps: {
      title: "Market Share",
      data: [{ label: "A", value: 40 }, { label: "B", value: 60 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "DonutChart",
    aliases: ["donut chart", "rosca", "gráfico de rosca"],
    description: "Gráfico de rosca (pizza com furo central).",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[], sliceColors?: string[]",
    exampleProps: {
      title: "Distribuição de Gastos",
      data: [{ label: "RH", value: 5000 }, { label: "TI", value: 3000 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "AreaChart",
    aliases: ["area chart", "área", "gráfico de área"],
    description: "Gráfico de linha com preenchimento abaixo da linha.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Volume de Tráfego",
      data: [{ label: "Seg", value: 100 }, { label: "Ter", value: 120 }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "HorizontalBarChart",
    aliases: ["horizontal bar chart", "barra horizontal", "barras deitadas"],
    description: "Gráfico de barras horizontais.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Ranking de Atletas",
      data: [{ label: "João", value: 95 }, { label: "Maria", value: 98 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "StackedBarChart",
    aliases: ["stacked bar chart", "barras empilhadas", "colunas empilhadas"],
    description: "Gráfico de barras onde os segmentos são empilhados.",
    propsSchema: "categories: string[], series: { label: string, values: number[], color?: string }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Vendas por Produto e Loja",
      categories: ["Loja A", "Loja B"],
      series: [{ label: "Prod 1", values: [10, 20] }, { label: "Prod 2", values: [15, 25] }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "GroupedBarChart",
    aliases: ["grouped bar chart", "barras agrupadas", "colunas agrupadas"],
    description: "Gráfico de barras lado a lado por categoria.",
    propsSchema: "data: { label: string, series: { label: string, value: number }[] }[], seriesLabels: string[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Comparativo Trimestral",
      seriesLabels: ["2023", "2024"],
      data: [{ label: "Q1", series: [{ label: "2023", value: 100 }, { label: "2024", value: 120 }] }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "BubbleChart",
    aliases: ["bubble chart", "bolhas", "gráfico de bolhas"],
    description: "Gráfico de dispersão onde o tamanho da bolha indica um terceiro valor.",
    propsSchema: "data: { x: number, y: number, size: number, label: string, color?: string }[], title?: string, xLabel?: string, yLabel?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Análise de Projetos",
      data: [{ x: 10, y: 20, size: 5, label: "Projeto Alpha" }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "ScatterPlot",
    aliases: ["scatter plot", "dispersão", "gráfico de pontos"],
    description: "Gráfico de pontos para correlação entre X e Y.",
    propsSchema: "data: { x: number, y: number, label?: string, color?: string }[], title?: string, xLabel?: string, yLabel?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Estudo de Preços",
      data: [{ x: 100, y: 15 }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "WaterfallChart",
    aliases: ["waterfall chart", "cascata", "fluxo de caixa"],
    description: "Gráfico de cascata para mostrar alterações acumuladas.",
    propsSchema: "data: { label: string, value: number, isTotal?: boolean }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "P&L Anual",
      data: [{ label: "Receita", value: 1000 }, { label: "Custo", value: -400 }, { label: "EBITDA", value: 600, isTotal: true }],
      seriesColors: ["#3B82F6", "#EF4444", "#10B981"]
    }
  },
  {
    id: "CandlestickChart",
    aliases: ["candlestick chart", "velas", "ohlc", "financeiro"],
    description: "Gráfico financeiro de velas (Abertura, Máxima, Mínima, Fechamento).",
    propsSchema: "data: { date: string, open: number, high: number, low: number, close: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, positiveColor?: string, negativeColor?: string",
    exampleProps: {
      title: "Ações PETR4",
      data: [{ date: "2023-10-01", open: 30, high: 32, low: 29, close: 31 }],
      seriesColors: ["#10B981", "#EF4444"]
    }
  },
  {
    id: "RadarChart",
    aliases: ["radar chart", "spider chart", "teia de aranha", "radar"],
    description: "Gráfico de radar para comparação de múltiplas variáveis.",
    propsSchema: "axes: string[], series: { label: string, values: number[], color?: string }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Perfil do Candidato",
      axes: ["Habilidade", "Velocidade", "Força"],
      series: [{ label: "Candidato A", values: [0.8, 0.6, 0.9] }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "TreemapChart",
    aliases: ["treemap chart", "mapa de árvore", "hierárquico"],
    description: "Gráfico de áreas retangulares aninhadas por valor.",
    propsSchema: "data: { label: string, value: number, color?: string }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Distribuição de Arquivos",
      data: [{ label: "Imagens", value: 500 }, { label: "Vídeos", value: 1200 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "HeatmapChart",
    aliases: ["heatmap chart", "mapa de calor"],
    description: "Grid de cores representando densidade ou valor.",
    propsSchema: "xLabels: string[], yLabels: string[], data: { x: number, y: number, value: number }[], title?: string, backgroundColor?: string, textColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Atividade Semanal",
      xLabels: ["Seg", "Ter"],
      yLabels: ["Manhã", "Tarde"],
      data: [{ x: 0, y: 0, value: 10 }, { x: 1, y: 1, value: 5 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "SankeyChart",
    aliases: ["sankey chart", "fluxo", "diagrama de sankey"],
    description: "Diagrama de fluxo entre estágios.",
    propsSchema: "nodes: { id: string, label: string, column: number }[], links: { source: string, target: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Fluxo de Energia",
      nodes: [{ id: "A", label: "Geração", column: 0 }, { id: "B", label: "Consumo", column: 1 }],
      links: [{ source: "A", target: "B", value: 100 }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "FunnelChart",
    aliases: ["funnel chart", "funil", "conversão"],
    description: "Gráfico de funil para estágios de um processo ou vendas.",
    propsSchema: "data: { label: string, value: number, color?: string }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Funil de Vendas",
      data: [{ label: "Leads", value: 1000 }, { label: "MQL", value: 400 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "GaugeChart",
    aliases: ["gauge chart", "velocímetro", "indicador"],
    description: "Gráfico de medidor ou velocímetro para uma única métrica.",
    propsSchema: "value: number, title?: string, min?: number, max?: number, label?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Satisfação do Cliente",
      value: 85,
      min: 0,
      max: 100,
      label: "Ótimo",
      seriesColors: ["#10B981", "#FBBF24", "#EF4444"]
    }
  },
  {
    id: "ParetoChart",
    aliases: ["pareto chart", "pareto", "80-20"],
    description: "Gráfico de Pareto combinando barras decrescentes e linha de percentual acumulado.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Causas de Defeito",
      data: [{ label: "Furo", value: 80 }, { label: "Risco", value: 15 }],
      seriesColors: ["#3B82F6", "#F59E0B"]
    }
  },
  {
    id: "SparklineChart",
    aliases: ["sparkline chart", "sparkline", "mini gráfico"],
    description: "Mini gráfico compacto de linha ou barra para tendências rápidas.",
    propsSchema: "data: number[], title?: string, color?: string, type?: 'line' | 'bar' | 'area', backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Tendência CPU",
      data: [10, 20, 15, 30, 25],
      type: "line",
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "ComparativeBarChart",
    aliases: ["comparative bar chart", "pirâmide etária", "barras espelhadas"],
    description: "Gráfico de barras horizontais espelhadas para comparação entre dois grupos.",
    propsSchema: "data: { label: string, leftValue: number, rightValue: number }[], leftLabel: string, rightLabel: string, title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Distribuição por Gênero",
      leftLabel: "Homens",
      rightLabel: "Mulheres",
      data: [{ label: "20-30 anos", leftValue: 45, rightValue: 50 }],
      seriesColors: ["#3B82F6", "#EC4899"]
    }
  },
  {
    id: "MultiLineChart",
    aliases: ["multi-line chart", "múltiplas linhas", "comparativo temporal"],
    description: "Gráfico com múltiplas séries de linhas.",
    propsSchema: "labels: string[], series: { label: string, data: number[], color?: string }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Vendas por Categoria",
      labels: ["Jan", "Fev"],
      series: [{ label: "Eletrônicos", data: [100, 150] }, { label: "Móveis", data: [80, 90] }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "HistogramChart",
    aliases: ["histogram chart", "histograma", "distribuição de frequência"],
    description: "Gráfico de distribuição de frequências (bins).",
    propsSchema: "rawData: number[], binCount?: number, title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Distribuição de Idades",
      data: [25, 26, 25, 30, 45, 50, 25, 26],
      binCount: 5,
      seriesColors: ["#3B82F6", "#F59E0B"]
    }
  },
  {
    id: "BoxPlotChart",
    aliases: ["box plot chart", "boxplot", "estatística"],
    description: "Gráfico estatístico mostrando quartis, mediana e outliers.",
    propsSchema: "data: { label: string, min: number, q1: number, median: number, q3: number, max: number, outliers?: number[] }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Análise de Salários",
      data: [{ label: "TI", min: 3000, q1: 5000, median: 7000, q3: 10000, max: 15000 }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "NetworkChart",
    aliases: ["network chart", "grafo", "rede", "conexões"],
    description: "Gráfico de rede/grafo com nós e arestas.",
    propsSchema: "nodes: { id: string, label: string, x: number, y: number, weight?: number }[], edges: { source: string, target: string, directed?: boolean }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Mapa de Infraestrutura",
      nodes: [{ id: "srv1", label: "Server 1", x: 100, y: 100 }, { id: "srv2", label: "Server 2", x: 300, y: 300 }],
      edges: [{ source: "srv1", target: "srv2" }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "MekkoChart",
    aliases: ["mekko chart", "marimekko", "market share 2d"],
    description: "Gráfico de MariMekko (largura e altura variáveis).",
    propsSchema: "data: { label: string, totalValue: number, segments: { label: string, value: number, color?: string }[] }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Market Share por Região",
      data: [{ label: "Norte", totalValue: 1000, segments: [{ label: "Prod A", value: 600 }, { label: "Prod B", value: 400 }] }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "SunburstChart",
    aliases: ["sunburst chart", "hierarquia radial", "treemap circular"],
    description: "Gráfico hierárquico radial (anéis concêntricos).",
    propsSchema: "data: { label: string, value?: number, color?: string, children?: any[] }, title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[], sliceColors?: string[]",
    exampleProps: {
      title: "Gastos Corporativos",
      data: { label: "Empresa", children: [{ label: "TI", value: 5000 }, { label: "HR", value: 3000 }] },
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "ChordChart",
    aliases: ["chord chart", "diagrama de cordas", "fluxo radial"],
    description: "Gráfico de cordas para fluxos entre entidades em círculo.",
    propsSchema: "entities: { id: string, label: string, color?: string }[], flows: { source: string, target: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Migração entre Regiões",
      entities: [{ id: "RS", label: "Sul" }, { id: "SP", label: "Sudeste" }],
      flows: [{ source: "RS", target: "SP", value: 500 }],
      seriesColors: ["#3B82F6", "#EC4899"]
    }
  },
  {
    id: "GanttChart",
    aliases: ["gantt chart", "cronograma", "roadmap", "gestão de projetos"],
    description: "Cronograma de tarefas ao longo do tempo.",
    propsSchema: "tasks: { id: string, label: string, start: number, duration: number, color?: string, dependencies?: string[] }[], title?: string, totalDays?: number, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "Sprint 25",
      tasks: [{ id: "t1", label: "Dev", start: 0, duration: 5 }, { id: "t2", label: "QA", start: 5, duration: 3, dependencies: ["t1"] }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  },
  {
    id: "BulletChart",
    aliases: ["bullet chart", "bullet", "performance", "metas"],
    description: "Gráfico de barras compacto para performance vs metas.",
    propsSchema: "metrics: { label: string, value: number, target: number, ranges: number[], units?: string }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: {
      title: "KPIs de Vendas",
      metrics: [{ label: "Receita", value: 270, target: 250, ranges: [150, 225, 300], units: "k" }],
      seriesColors: ["#3B82F6"]
    }
  },
  {
    id: "PolarChart",
    aliases: ["polar chart", "rose chart", "coxcomb"],
    description: "Gráfico polar (Rose Chart) onde o valor define o raio.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, gridColor?: string, axisColor?: string, seriesColors?: string[], sliceColors?: string[]",
    exampleProps: {
      title: "Sazonalidade",
      data: [{ label: "Jan", value: 100 }, { label: "Fev", value: 150 }],
      seriesColors: ["#3B82F6", "#10B981"]
    }
  }
];

export const componentRegistry = {
  getTypes(): string[] {
    return COMPONENT_REGISTRY.map(c => c.id);
  },
  getEntry(id: string): ComponentEntry | undefined {
    return COMPONENT_REGISTRY.find(c => c.id === id);
  },
  getAll(): ComponentEntry[] {
    return COMPONENT_REGISTRY;
  }
};
