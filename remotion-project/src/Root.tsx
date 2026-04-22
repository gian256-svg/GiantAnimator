import React from "react";
import { Composition } from "remotion";

// Core Charts
import { BarChart }           from "./charts/BarChart";
import { LineChart }          from "./charts/LineChart";
import { PieChart }           from "./charts/PieChart";
import { HorizontalBarChart } from "./charts/HorizontalBarChart";
import { ComparativeBarChart } from "./components/ComparativeBarChart";
import { DonutChart }         from "./components/DonutChart";
import { MultiLineChart }     from "./components/MultiLineChart";
import { HeatmapChart }       from "./components/HeatmapChart";
import { RadarChart }         from "./components/RadarChart";
import { FunnelChart }        from "./components/FunnelChart";
import { TreemapChart }       from "./components/TreemapChart";
import { SunburstChart }      from "./components/SunburstChart";
import { WaterfallChart }     from "./components/WaterfallChart";
import { GaugeChart }         from "./components/GaugeChart";
import { GanttChart }         from "./components/GanttChart";

// Scenes
import { ReasonScene }        from "./reason-scene/ReasonScene";
import { SocialPromoBoard }   from "./promo-board/SocialPromoBoard";
import { DUOPromoBoard }      from "./promo-board/DUOPromoBoard";
import { LivroPromoBoard }    from "./promo-board/LivroPromoBoard";

// Legacy / Others
import { BarChartRace }       from "./BarChartRace";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="BarChart" component={BarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="LineChart" component={LineChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="PieChart" component={PieChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="HorizontalBarChart" component={HorizontalBarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="ComparativeBarChart" component={ComparativeBarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
      <Composition id="DonutChart" component={DonutChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="MultiLineChart" component={MultiLineChart as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ series: [{label: "A", data: [1], color: "#FF0000"}], labels: ["0"] }} />
      
      <Composition id="BarChartRace" component={BarChartRace as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="ReasonScene" component={ReasonScene} durationInFrames={360} fps={30} width={3840} height={2160} />
      <Composition id="SocialPromoBoard" component={SocialPromoBoard as any} durationInFrames={300} fps={30} width={3840} height={2160} />
      <Composition id="DUOPromoBoard" component={DUOPromoBoard as any} durationInFrames={300} fps={30} width={3840} height={2160} />
      <Composition id="LivroPromoBoard" component={LivroPromoBoard as any} durationInFrames={300} fps={30} width={3840} height={2160} />
      
      {/* Additional High Fidelity Charts */}
      <Composition id="HeatmapChart" component={HeatmapChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="RadarChart" component={RadarChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="FunnelChart" component={FunnelChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="TreemapChart" component={TreemapChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="SunburstChart" component={SunburstChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="WaterfallChart" component={WaterfallChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="GaugeChart" component={GaugeChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="GanttChart" component={GanttChart as any} durationInFrames={600} fps={30} width={3840} height={2160} />
    </>
  );
};
