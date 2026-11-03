import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { formatDateDisplay } from "@/utils/dashboard.utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export interface DateRangeSelectorProps {
  fromDate: string;
  toDate: string;
  onChange: (dates: { fromDate: string; toDate: string }) => void;
  className?: string;
  defaultLabel?: string;
}

export default function DateRangeSelector({
  fromDate,
  toDate,
  onChange,
  className = "w-full xl:w-auto xl:flex-1 min-w-[220px]",
  defaultLabel = "All Time",
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDatePreset = (
    preset: "today" | "last7" | "last30" | "month" | "clear",
  ) => {
    if (preset === "clear") {
      onChange({ fromDate: "", toDate: "" });
    } else if (preset === "today") {
      const today = dayjs().format("YYYY-MM-DD");
      onChange({ fromDate: today, toDate: today });
    } else if (preset === "last7") {
      onChange({
        fromDate: dayjs().subtract(7, "day").format("YYYY-MM-DD"),
        toDate: dayjs().format("YYYY-MM-DD"),
      });
    } else if (preset === "last30") {
      onChange({
        fromDate: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
        toDate: dayjs().format("YYYY-MM-DD"),
      });
    } else if (preset === "month") {
      onChange({
        fromDate: dayjs().startOf("month").format("YYYY-MM-DD"),
        toDate: dayjs().endOf("month").format("YYYY-MM-DD"),
      });
    }
    setIsOpen(false);
  };

  const buttonLabel = useMemo(() => {
    if (fromDate && toDate) {
      return `${formatDateDisplay(fromDate)} - ${formatDateDisplay(toDate)}`;
    }
    if (fromDate) {
      return `From ${formatDateDisplay(fromDate)}`;
    }
    if (toDate) {
      return `Until ${formatDateDisplay(toDate)}`;
    }
    return defaultLabel;
  }, [fromDate, toDate, defaultLabel]);

  const hasSelectedDates = Boolean(fromDate || toDate);

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          type="button"
          className={`bg-white border rounded text-xs sm:text-sm font-medium flex items-center justify-between w-full h-[40px] px-4 shadow-sm hover:bg-gray-50 transition-colors ${
            hasSelectedDates
              ? "border-blue-500 text-blue-700 font-semibold"
              : "border-gray-200 text-gray-700"
          }`}
        >
          <span className="truncate">{buttonLabel}</span>
          <svg
            className={`w-4 h-4 ml-2 shrink-0 ${
              hasSelectedDates ? "text-blue-500" : "text-gray-500"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-80 bg-white border border-gray-200 rounded shadow-xl p-4 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Filter by Date
            </span>
            {hasSelectedDates && (
              <button
                type="button"
                onClick={() => handleDatePreset("clear")}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleDatePreset("today")}
              className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset("last7")}
              className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset("last30")}
              className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset("month")}
              className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
            >
              This Month
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onChange({ fromDate: e.target.value, toDate })}
                className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => onChange({ fromDate, toDate: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
