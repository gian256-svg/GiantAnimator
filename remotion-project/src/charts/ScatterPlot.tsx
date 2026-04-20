import React from "react";
import { ScatterPlot as ScatterPlotReal } from "../components/ScatterPlot";

/** Alias para o componente real em components/. O stub estava em branco. */
export const ScatterPlot: React.FC<any> = (props) => <ScatterPlotReal {...props} />;
export default ScatterPlot;

