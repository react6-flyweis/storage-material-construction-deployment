import React from "react";

export type StatTheme = "purple" | "green" | "amber" | "red" | "blue";

const themeConfigs: Record<
  StatTheme,
  { circleBg: string; wave1: string; wave2: string }
> = {
  purple: {
    circleBg: "bg-[#6366F1]",
    wave1: "#C7D2FE",
    wave2: "#E0E7FF",
  },
  green: {
    circleBg: "bg-[#10B981]",
    wave1: "#A7F3D0",
    wave2: "#D1FAE5",
  },
  amber: {
    circleBg: "bg-[#F59E0B]",
    wave1: "#FDE68A",
    wave2: "#FEF3C7",
  },
  red: {
    circleBg: "bg-[#EF4444]",
    wave1: "#FECACA",
    wave2: "#FEE2E2",
  },
  blue: {
    circleBg: "bg-[#2563EB]",
    wave1: "#BFDBFE",
    wave2: "#DBEAFE",
  },
};

export interface WaveStatCardProps {
  title: string;
  value: number | string;
  trend?: string;
  isUp?: boolean;
  trendLabel?: string;
  subtext?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  iconBoxClass?: string;
  theme?: StatTheme;
  circleBg?: string;
  wave1?: string;
  wave2?: string;
  className?: string;
  isLoading?: boolean;
}

export default function WaveStatCard({
  title,
  value,
  trend,
  isUp = true,
  trendLabel = "from last month",
  subtext,
  subtitle,
  icon,
  iconBoxClass,
  theme = "purple",
  circleBg,
  wave1,
  wave2,
  className = "",
  isLoading = false,
}: WaveStatCardProps) {
  const config = themeConfigs[theme] || themeConfigs.purple;
  const finalCircleBg = circleBg || config.circleBg;
  const finalWave1 = wave1 || config.wave1;
  const finalWave2 = wave2 || config.wave2;

  const displaySubtext = subtext || subtitle;

  return (
    <div
      className={`bg-white rounded-lg p-5 border border-gray-100 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-28.75 ${className}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-gray-100 animate-pulse rounded mt-1.5" />
          ) : (
            <h3 className="text-2xl sm:text-[28px] font-bold text-gray-900 mt-1.5 leading-none tracking-tight">
              {value}
            </h3>
          )}
          {displaySubtext && (
            <p className="text-xs text-gray-400 font-medium mt-1.5 z-10">
              {displaySubtext}
            </p>
          )}
        </div>
        {icon && (
          iconBoxClass ? (
            <div
              className={`${iconBoxClass} flex items-center justify-center shrink-0 z-10`}
            >
              {icon}
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full ${finalCircleBg} flex items-center justify-center shrink-0 shadow-xs z-10`}
            >
              {icon}
            </div>
          )
        )}
      </div>

      {/* Bottom row (Trend) */}
      {trend && (
        <div className="flex items-center gap-1.5 text-xs mt-2.5 z-10">
          <span
            className={`font-semibold ${
              isUp ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            {isUp ? "↗" : "↘"} {trend}
          </span>
          <span className="text-gray-400 font-normal">{trendLabel}</span>
        </div>
      )}

      {/* Decorative smooth bottom-right waves */}
      <svg
        className="absolute -bottom-1 -right-1 w-28 h-14 pointer-events-none overflow-visible"
        viewBox="0 0 130 65"
        fill="none"
      >
        <path
          d="M10 65C35 65 60 45 90 25C110 12 122 5 130 2"
          stroke={finalWave1}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M35 65C60 65 85 48 110 32C122 22 127 15 130 10"
          stroke={finalWave2}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
