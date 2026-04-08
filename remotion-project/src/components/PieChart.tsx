import React from "react";
import { DonutChart, DonutChartProps } from "./DonutChart";

/**
 * PieChart Component — Ciclo 5
 * Especialização do DonutChart (innerRadiusRatio = 0)
 */
export const PieChart: React.FC<Omit<DonutChartProps, "innerRadiusRatio">> = (props) => {
  return <DonutChart {...props} innerRadiusRatio={0} />;
};
