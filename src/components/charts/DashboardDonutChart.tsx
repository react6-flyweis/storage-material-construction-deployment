import ReactECharts from "echarts-for-react";
import CardHeader from "../dashboard/CardHeader";

export interface DonutDataItem {
  value: number;
  name: string;
  color: string;
  displayValue?: string;
}

interface DonutChartProps {
  title: string;
  total: number;
  data: DonutDataItem[];
  subtitle: string;
  onViewAll?: () => void;
  className?: string;
}

export default function DashboardDonutChart({
  title,
  total,
  data,
  subtitle,
  onViewAll,
  className = "",
}: DonutChartProps) {
  const hasData = total > 0 || data.some((item) => item.value > 0);

  const option = {
    color: hasData ? data.map((item) => item.color) : ["#E5E7EB"],
    tooltip: {
      trigger: "item",
      formatter: hasData ? "{b}: {c} ({d}%)" : "{b}",
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: ["50%", "85%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: false,
          },
        },
        labelLine: {
          show: false,
        },
        data: hasData
          ? data.map((item) => ({ value: item.value, name: item.name }))
          : [{ value: 1, name: "No data" }],
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: subtitle.includes("\n") || subtitle.length > 10 ? "30%" : "35%",
        style: {
          text: subtitle,
          textAlign: "center",
          fill: "#6B7280",
          fontSize: 12,
          fontWeight: 500,
          width: 80,
          overflow: "break",
          lineOverflow: "truncate",
          ellipsis: "...",
          lineHeight: 15,
        },
      },
      {
        type: "text",
        left: "center",
        top: "50%",
        style: {
          text: total.toString(),
          textAlign: "center",
          fill: "#111827",
          fontSize: 28,
          fontWeight: "bold",
        },
      },
    ],
  };

  return (
    <div
      className={`bg-white rounded border border-gray-100 shadow-sm flex flex-col ${className}`}
    >
      <CardHeader title={title} onViewAll={onViewAll} />

      <div className="p-6 flex flex-col items-center justify-center gap-8 flex-1">
        <div className="w-48 h-48 shrink-0">
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
          />
        </div>

        <div className="w-full space-y-4 px-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-500">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {item.displayValue !== undefined
                  ? item.displayValue
                  : `${item.value}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
