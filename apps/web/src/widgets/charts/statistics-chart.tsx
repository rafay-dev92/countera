import type React from "react";
import Chart from "react-apexcharts";
import type { Props as ApexChartProps } from "react-apexcharts";

export interface StatisticsChartProps {
  chart: ApexChartProps;
  title: React.ReactNode;
  description?: React.ReactNode;
}

export function StatisticsChart({ chart, title, description = null }: StatisticsChartProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex-1 px-2 pt-3">
        <Chart {...chart} />
      </div>
    </div>
  );
}

StatisticsChart.displayName = "/src/widgets/charts/statistics-chart.tsx";

export default StatisticsChart;
