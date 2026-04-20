import React from "react";
import { CandlestickChart as CandlestickChartReal } from "../components/CandlestickChart";

/** Alias para o componente real em components/. O stub estava em branco. */
export const CandlestickChart: React.FC<any> = (props) => <CandlestickChartReal {...props} />;
export default CandlestickChart;

