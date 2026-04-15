import React from "react";
import { LineChart } from "./LineChart";

export const AreaChart: React.FC<any> = (props) => {
  return <LineChart {...props} showArea={true} />;
};

export default AreaChart;
