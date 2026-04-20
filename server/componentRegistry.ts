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
    aliases: ["vertical bar", "colunas", "barras verticais"],
    description: "Gráfico de colunas verticais (Vertical).",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[], bgStyle?: 'none'|'mesh'|'grid', showValueLabels?: boolean",
    exampleProps: { title: "Vendas", data: [{ label: "A", value: 10 }], bgStyle: "mesh" }
  },
  {
    id: "LineChart",
    aliases: ["line chart", "linha", "tendência"],
    description: "Gráfico de linha simples ou múltipla.",
    propsSchema: "labels: string[], series: { label: string, data: number[] }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[], bgStyle?: 'none'|'mesh'|'grid', showValueLabels?: boolean",
    exampleProps: { title: "Tendência", labels: ["Jan", "Fev"], series: [{ label: "Q1", data: [10, 20] }], bgStyle: "mesh" }
  },
  {
    id: "PieChart",
    aliases: ["pie chart", "pizza", "circular"],
    description: "Gráfico de pizza para proporções.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: { title: "Market Share", data: [{ label: "A", value: 40 }] }
  },
  {
    id: "DonutChart",
    aliases: ["donut chart", "rosca"],
    description: "Gráfico de rosca.",
    propsSchema: "data: { label: string, value: number }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: { title: "Distribuição", data: [{ label: "A", value: 40 }] }
  },
  {
    id: "AreaChart",
    aliases: ["area chart", "área"],
    description: "Gráfico de área simples ou com múltiplas séries.",
    propsSchema: "labels: string[], series: { label: string, data: number[] }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: { title: "Tráfego", labels: ["Jan", "Fev"], series: [{ label: "A", data: [10, 20] }] }
  },
  {
    id: "HorizontalBarChart",
    aliases: ["horizontal bar", "barra horizontal", "horizontal grouped"],
    description: "Gráfico de barras orientadas horizontalmente (Simples ou Agrupado).",
    propsSchema: "data?: { label: string, value: number }[], labels?: string[], series?: { label: string, data: number[] }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: { title: "Ranking", series: [{ label: "S1", data: [100, 80] }], labels: ["A", "B"] }
  },
  {
    id: "StackedBarChart",
    aliases: ["stacked bar chart", "barras empilhadas"],
    description: "Gráfico de barras empilhadas.",
    propsSchema: "categories: string[], series: { label: string, values: number[] }[], title?: string, backgroundColor?: string, textColor?: string, seriesColors?: string[]",
    exampleProps: { title: "Empilhado", categories: ["Q1", "Q2"], series: [{ label: "Loja", values: [10, 20] }] }
  },
  {
    id: "ScatterPlot",
    aliases: ["scatter plot", "dispersão"],
    description: "Gráfico de dispersão X / Y.",
    propsSchema: "title: string, series: { label: string, data: {x: number, y: number}[] }[], xLabel?: string, yLabel?: string, seriesColors?: string[]",
    exampleProps: { title: "Dispersão", series: [{ label: "Grupo 1", data: [{x: 10, y: 20}] }] }
  },
  {
    id: "BubbleChart",
    aliases: ["bubble chart", "bolhas"],
    description: "Gráfico de bolhas (X, Y, Raio).",
    propsSchema: "title: string, series: { label: string, data: {x: number, y: number, r: number}[] }[], xLabel?: string, yLabel?: string, seriesColors?: string[]",
    exampleProps: { title: "Bolhas", series: [{ label: "Market", data: [{x: 10, y: 20, r: 5}] }] }
  },
  {
    id: "WaterfallChart",
    aliases: ["waterfall chart", "cascata"],
    description: "Gráfico de cascata.",
    propsSchema: "data: { label: string, value: number, isTotal?: boolean }[], title?: string, seriesColors?: string[]",
    exampleProps: { title: "P&L", data: [{ label: "A", value: 10 }] }
  },
  {
    id: "RadarChart",
    aliases: ["radar chart", "teia"],
    description: "Gráfico de radar.",
    propsSchema: "axes: string[], series: { label: string, values: number[] }[], title?: string",
    exampleProps: { title: "Radar", axes: ["A", "B"], series: [{ label: "P1", values: [0.8, 0.5] }] }
  },
  {
    id: "SankeyChart",
    aliases: ["sankey chart", "fluxo"],
    description: "Diagrama de fluxo.",
    propsSchema: "nodes: { id: string, label: string }[], links: { source: string, target: string, value: number }[], title?: string",
    exampleProps: { title: "Sankey", nodes: [{ id: "A", label: "Start" }], links: [{ source: "A", target: "B", value: 10 }] }
  }
];

export const componentRegistry = {
  getTypes(): string[] { return COMPONENT_REGISTRY.map(c => c.id); },
  getEntry(id: string): ComponentEntry | undefined { return COMPONENT_REGISTRY.find(c => c.id === id); },
  getAll(): ComponentEntry[] { return COMPONENT_REGISTRY; }
};
