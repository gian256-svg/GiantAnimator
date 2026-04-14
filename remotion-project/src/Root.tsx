import React from "react";
import { Composition } from "remotion";
import { PolarChart }         from "./components/PolarChart";
import { PolarChartPreview }   from "./previews/PolarChart.preview";
import { BoxPlotChart }        from "./components/BoxPlotChart";
import { BoxPlotChartPreview }  from "./previews/BoxPlotChart.preview";
import { NetworkChart }        from "./components/NetworkChart";
import { NetworkChartPreview }  from "./previews/NetworkChart.preview";
import { MekkoChart }          from "./components/MekkoChart";
import { MekkoChartPreview }   from "./previews/MekkoChart.preview";
import { GanttChartPreview }   from "./previews/GanttChart.preview";
import { BarChart }           from "./charts/BarChart";
import { BarChartPreview }    from "./previews/BarChart.preview";
import { SparklineChart }        from "./components/SparklineChart";
import { SparklineChartPreview }  from "./previews/SparklineChart.preview";
import { ComparativeBarChart }     from "./components/ComparativeBarChart";
import { ComparativeBarChartPreview } from "./previews/ComparativeBarChart.preview";
import { LineChart }          from "./charts/LineChart";
import { PieChart }           from "./charts/PieChart";
import { DonutChart }         from "./components/DonutChart";
import { PieChartPreview }      from "./previews/PieChart.preview";
import { DonutChartPreview }    from "./previews/DonutChart.preview";
import { MultiLineChart }     from "./components/MultiLineChart";
import { MultiLineChartPreview } from "./previews/MultiLineChart.preview";
import { BubbleChart }         from "./components/BubbleChart";
import { BubbleChartPreview }   from "./previews/BubbleChart.preview";
import { AreaChart }           from "./components/AreaChart";
import { AreaChartPreview }    from "./previews/AreaChart.preview";
import { HistogramChart }      from "./components/HistogramChart";
import { HistogramChartPreview } from "./previews/HistogramChart.preview";
import { HorizontalBarChart } from "./charts/HorizontalBarChart";
import { ScatterPlot }        from "./components/ScatterPlot";
import { ScatterPlotPreview } from "./previews/ScatterPlot.preview";
import { ParetoChart }          from "./components/ParetoChart";
import { ParetoChartPreview }   from "./previews/ParetoChart.preview";
import { WaterfallChart }     from "./components/WaterfallChart";
import { WaterfallChartPreview } from "./previews/WaterfallChart.preview";
import { CandlestickChart }   from "./components/CandlestickChart";
import { CandlestickChartPreview } from "./previews/CandlestickChart.preview";
import { GaugeChart }         from "./components/GaugeChart";
import { GaugeChartPreview }   from "./previews/GaugeChart.preview";
import { StackedBarChart }   from "./components/StackedBarChart";
import { GroupedBarChart }   from "./components/GroupedBarChart";
import { GroupedBarChartPreview } from "./previews/GroupedBarChart.preview";
import { StackedBarChartPreview } from "./previews/StackedBarChart.preview";
import { SankeyChart }         from "./components/SankeyChart";
import { SankeyChartPreview }   from "./previews/SankeyChart.preview";
import { HeatmapChart }        from "./components/HeatmapChart";
import { HeatmapChartPreview }  from "./previews/HeatmapChart.preview";
import { Heatmap }            from "./charts/Heatmap";
import { RadarChart }        from "./components/RadarChart";
import { RadarChartPreview }  from "./previews/RadarChart.preview";
import { FunnelChart }        from "./components/FunnelChart";
import { FunnelChartPreview }  from "./previews/FunnelChart.preview";
import { TreemapChart }        from "./components/TreemapChart";
import { TreemapChartPreview }  from "./previews/TreemapChart.preview";
import { BulletChart }         from "./components/BulletChart";
import { BulletChartPreview }   from "./previews/BulletChart.preview";
import { SunburstChart }        from "./components/SunburstChart";
import { SunburstChartPreview }  from "./previews/SunburstChart.preview";
import { ChordChart }          from "./components/ChordChart";
import { ChordChartPreview }   from "./previews/ChordChart.preview";
import { BarChartRace }       from "./BarChartRace";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition 
      id="BarChartRace" 
      component={BarChartRace as any} 
      durationInFrames={600} 
      fps={30} 
      width={3840} 
      height={2160} 
      defaultProps={{ 
        data: {
          labels: ["Apple", "Google", "Microsoft", "Amazon", "Meta"],
          periods: ["2018", "2019", "2020", "2021", "2022"],
          values: [
            [100, 120, 150, 180, 210],
            [90, 130, 140, 170, 200],
            [80, 110, 160, 190, 220],
            [70, 100, 130, 200, 250],
            [60, 80, 100, 120, 150]
          ]
        }
      }} 
    />
    <Composition id="BarChart" component={BarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
    <Composition id="ComparativeBarChart" component={ComparativeBarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="ComparativeBarChartPreview" component={ComparativeBarChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="LineChart" component={LineChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
    <Composition id="PieChart" component={PieChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
    <Composition id="PieChartPreview" component={PieChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="DonutChart" component={DonutChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
    <Composition id="DonutChartPreview" component={DonutChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="MultiLineChart" component={MultiLineChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ series: [{label: "A", data: [1], color: "#FF0000"}], labels: ["0"] }} />
    <Composition id="MultiLineChartPreview" component={MultiLineChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="BubbleChart" component={BubbleChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="BubbleChartPreview" component={BubbleChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="AreaChart" component={AreaChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="AreaChartPreview" component={AreaChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="HorizontalBarChart" component={HorizontalBarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 10 }] }} />
    <Composition id="BoxPlotChart" component={BoxPlotChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="BoxPlotChartPreview" component={BoxPlotChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="BulletChart" component={BulletChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="BulletChartPreview" component={BulletChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="TreemapChart" component={TreemapChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="TreemapChartPreview" component={TreemapChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="NetworkChart" component={NetworkChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="NetworkChartPreview" component={NetworkChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="PolarChart" component={PolarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="PolarChartPreview" component={PolarChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="RadarChart" component={RadarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="RadarChartPreview" component={RadarChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="GroupedBarChart" component={GroupedBarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="GroupedBarChartPreview" component={GroupedBarChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="GaugeChart" component={GaugeChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ value: 50 } as any} />
    <Composition id="GaugeChartPreview" component={GaugeChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="StackedBarChart" component={StackedBarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="StackedBarChartPreview" component={StackedBarChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="ScatterPlot" component={ScatterPlot as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="ScatterPlotPreview" component={ScatterPlotPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="ParetoChart" component={ParetoChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="ParetoChartPreview" component={ParetoChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="WaterfallChart" component={WaterfallChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="WaterfallChartPreview" component={WaterfallChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="CandlestickChart" component={CandlestickChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="CandlestickChartPreview" component={CandlestickChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="FunnelChart" component={FunnelChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="FunnelChartPreview" component={FunnelChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="SparklineChart" component={SparklineChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="SparklineChartPreview" component={SparklineChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="SankeyChart" component={SankeyChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="SankeyChartPreview" component={SankeyChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="HeatmapChart" component={HeatmapChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="HeatmapChartPreview" component={HeatmapChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="SunburstChart" component={SunburstChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="SunburstChartPreview" component={SunburstChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="ChordChart" component={ChordChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="ChordChartPreview" component={ChordChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="MekkoChart" component={MekkoChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="MekkoChartPreview" component={MekkoChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="HistogramChart" component={HistogramChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
    <Composition id="HistogramChartPreview" component={HistogramChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="BarChartPreview" component={BarChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="GanttChart" component={GanttChartPreview} durationInFrames={600} fps={30} width={3840} height={2160} />
    <Composition id="Heatmap" component={Heatmap as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
  </>
);
