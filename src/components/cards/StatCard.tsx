import UploadIcon from "../../assets/uploadicon.svg";
import MaterialIcon from "../../assets/requesticon.svg";
import ChatIcon from "../../assets/teamcomicon.svg";

export type StatItem = {
  key: string;
  title: string;
  value: number | string;
  icon?: string;
  iconsvg?: React.ReactNode;
  iconBg?: string;
  cardBg?: string;
  iconBoxBg?: string;
  valueColor?: string;
  trend?: {
    value: string;
    label: string;
    isUp?: boolean;
  };
};

export type StatsOverviewProps = {
  stats: StatItem[];
  gridCols?: string;
  isLoading?: boolean;
};

export default function StatsOverview({
  stats,
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  isLoading = false,
}: StatsOverviewProps) {
  return (
    <div className={`grid ${gridCols} gap-4`}>
      {stats.map((item) => {
        if (item.cardBg) {
          return (
            <div
              key={item.key}
              className="rounded-xl p-5 shadow-xs flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]"
              style={{ backgroundColor: item.cardBg }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white/95">
                  {item.title}
                </span>
                {isLoading ? (
                  <div className="h-8 w-16 bg-white/20 animate-pulse rounded mt-2" />
                ) : (
                  <span className="text-3xl md:text-[32px] font-bold text-white tracking-tight mt-1">
                    {item.value}
                  </span>
                )}
              </div>

              <div
                className="w-12 h-12 md:w-13 md:h-13 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.iconBoxBg || "#FFFFFF" }}
              >
                {item.iconsvg ? (
                  item.iconsvg
                ) : (
                  <img src={item.icon} alt="" className="w-6 h-6 object-contain" />
                )}
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.key}
            className="bg-white rounded p-4 border border-gray-100 shadow-sm flex flex-col gap-3"
          >
            <div 
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: item.iconBg || "#F3F4F6" }}
            >
              {item.iconsvg ? (
                item.iconsvg
              ) : (
                <img src={item.icon} alt="" className="w-4 h-4" />
              )}
            </div>
            
            <div>
              {isLoading ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded my-1" />
              ) : (
                <p className={`text-2xl font-bold ${item.valueColor || "text-gray-900"}`}>{item.value}</p>
              )}
              <p className="text-sm text-gray-500 font-medium">{item.title}</p>
              {item.trend && <div className="w-3/4 border-b border-gray-100 mt-2.5" />}
            </div>

          {item.trend && (
            <div className="flex items-center gap-2 mt-auto pt-1">
              <div className={`w-4 h-4 flex items-center justify-center rounded-full text-white ${
                item.trend.isUp ? "bg-green-500" : "bg-red-500"
              }`}>
                {item.trend.isUp ? (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
              <div className="text-xs font-semibold flex gap-1">
                <span className={item.trend.isUp ? "text-green-600" : "text-red-600"}>
                  {item.trend.value}
                </span>
                <span className="text-gray-400 font-medium">
                  {item.trend.label}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
  );
}
export function ActionButtons({ onAction }: { onAction: (key: string) => void }) {
  const ACTIONS_CONFIG = [
    {
      key: "uploadLog",
      title: "Upload Work Log",
      bg: "#16A34A",
      icon: UploadIcon,
    },
    {
      key: "requestMaterial",
      title: "Request Materials",
      bg: "#EA580C",
      icon: MaterialIcon,
    },
    {
      key: "teamCom",
      title: "Team Communication",
      bg: "#9333EA",
      icon: ChatIcon,
    },
  ];

  return (
    <div className="grid sm:grid-cols-3 grid-cols-1 sm:gap-6 gap-3">
      {ACTIONS_CONFIG.map((item) => (
        <button
          key={item.key}
          onClick={() => onAction(item.key)}
          className="min-h-21.25 sm:px-6 px-3 rounded flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: item.bg }}
        >
          <img src={item.icon} alt={item.title} className="w-5 h-5" />
          <p className="text-white text-[16px] font-medium">{item.title}</p>
        </button>
      ))}
    </div>
  );
}
