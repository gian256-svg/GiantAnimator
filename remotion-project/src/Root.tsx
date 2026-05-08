import React from "react";
import { Composition } from "remotion";
import { ZoomWrapper, ZoomPoint } from "./components/ZoomWrapper";

function withZoom<P extends object>(Component: React.FC<P>): React.FC<P & { zoomPoints?: ZoomPoint[]; zoomStartFrame?: number }> {
  return ({ zoomPoints, zoomStartFrame, ...props }) => (
    <ZoomWrapper zoomPoints={zoomPoints} zoomStartFrame={zoomStartFrame}>
      <Component {...(props as P)} />
    </ZoomWrapper>
  );
}

// Core Charts
import { BarChart }           from "./charts/BarChart";
import { LineChart }          from "./charts/LineChart";
import { PieChart }           from "./charts/PieChart";
import { HorizontalBarChart } from "./charts/HorizontalBarChart";
import { ComparativeBarChart } from "./components/ComparativeBarChart";
import { DonutChart }         from "./components/DonutChart";
import { MultiLineChart }     from "./components/MultiLineChart";
import { RacingLineChart }    from "./components/RacingLineChart";
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

const BarChartZ           = withZoom(BarChart as any);
const LineChartZ          = withZoom(LineChart as any);
const PieChartZ           = withZoom(PieChart as any);
const HorizontalBarChartZ = withZoom(HorizontalBarChart as any);
const ComparativeBarChartZ= withZoom(ComparativeBarChart as any);
const DonutChartZ         = withZoom(DonutChart as any);
const RacingLineChartZ    = withZoom(RacingLineChart as any);
const BarChartRaceZ       = withZoom(BarChartRace as any);
const ReasonSceneZ        = withZoom(ReasonScene as any);
const SocialPromoBoardZ   = withZoom(SocialPromoBoard as any);
const DUOPromoBoardZ      = withZoom(DUOPromoBoard as any);
const LivroPromoBoardZ    = withZoom(LivroPromoBoard as any);
const HeatmapChartZ       = withZoom(HeatmapChart as any);
const RadarChartZ         = withZoom(RadarChart as any);
const FunnelChartZ        = withZoom(FunnelChart as any);
const TreemapChartZ       = withZoom(TreemapChart as any);
const SunburstChartZ      = withZoom(SunburstChart as any);
const WaterfallChartZ     = withZoom(WaterfallChart as any);
const GaugeChartZ         = withZoom(GaugeChart as any);
const GanttChartZ         = withZoom(GanttChart as any);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="BarChart" component={BarChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="LineChart" component={LineChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="PieChart" component={PieChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="HorizontalBarChart" component={HorizontalBarChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="ComparativeBarChart" component={ComparativeBarChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{} as any} />
      <Composition id="DonutChart" component={DonutChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ data: [{ label: "A", value: 1 }] }} />
      <Composition id="RacingLineChart" component={RacingLineChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} defaultProps={{ series: [{label: "A", data: [1], color: "#FF0000"}], labels: ["0"] }} />

      <Composition id="BarChartRace" component={BarChartRaceZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="ReasonScene" component={ReasonSceneZ as any} durationInFrames={360} fps={30} width={3840} height={2160} />
      <Composition id="SocialPromoBoard" component={SocialPromoBoardZ as any} durationInFrames={300} fps={30} width={3840} height={2160} />
      <Composition id="DUOPromoBoard" component={DUOPromoBoardZ as any} durationInFrames={300} fps={30} width={3840} height={2160} />
      <Composition id="LivroPromoBoard" component={LivroPromoBoardZ as any} durationInFrames={300} fps={30} width={3840} height={2160} />

      {/* Additional High Fidelity Charts */}
      <Composition id="HeatmapChart" component={HeatmapChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="RadarChart" component={RadarChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="FunnelChart" component={FunnelChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="TreemapChart" component={TreemapChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="SunburstChart" component={SunburstChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="WaterfallChart" component={WaterfallChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="GaugeChart" component={GaugeChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
      <Composition id="GanttChart" component={GanttChartZ as any} durationInFrames={600} fps={30} width={3840} height={2160} />
    </>
  );
};
