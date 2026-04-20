import React from "react";
import { WaterfallChart as WaterfallChartReal } from "../components/WaterfallChart";

/** Alias para o componente real em components/. O stub estava em branco. */
export const WaterfallChart: React.FC<any> = (props) => <WaterfallChartReal {...props} />;
export default WaterfallChart;

