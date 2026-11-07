import CardHeader from "./CardHeader";
import { CalendarClock } from "lucide-react";
import { formatDateDisplay } from "../../utils/dashboard.utils";
import type {
  DashboardUpcomingDeadline,
  UpcomingScheduleItem,
  UpcomingScheduleMeta,
} from "../../types/projects.types";

interface UpcomingDeadlinesProps {
  deadlines: (DashboardUpcomingDeadline | UpcomingScheduleItem)[];
  meta?: UpcomingScheduleMeta;
  isLoading?: boolean;
  onViewAll?: () => void;
  title?: string;
  className?: string;
}

export default function UpcomingDeadlines({
  deadlines,
  meta,
  isLoading = false,
  onViewAll,
  title = "Upcoming Schedule",
  className = "",
}: UpcomingDeadlinesProps) {
  const getBadgeClass = (tone?: string) => {
    switch (tone?.toLowerCase()) {
      case "danger":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "success":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "info":
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  return (
    <div
      className={`bg-white rounded border border-gray-100 shadow-sm flex flex-col ${className}`}
    >
      <CardHeader title={title} onViewAll={onViewAll} />

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6 flex-1">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="flex justify-between items-center animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            ))
          ) : deadlines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-2 text-gray-400">
                <CalendarClock size={20} />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                No upcoming schedule
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {meta?.taskDeadlineDays
                  ? `No upcoming tasks or deadlines within the next ${meta.taskDeadlineDays} days.`
                  : "There are no upcoming project schedules within the selected timeframe."}
              </p>
            </div>
          ) : (
            deadlines.slice(0, 5).map((item, i) => {
              const scheduleItem = item as UpcomingScheduleItem;
              const displayTitle =
                scheduleItem.title ||
                scheduleItem.projectName ||
                "Upcoming Task";

              const subText =
                scheduleItem.project?.projectName
                  ? `${scheduleItem.project.projectName}${scheduleItem.project.location ? ` • ${scheduleItem.project.location}` : ""}`
                  : scheduleItem.site || scheduleItem.location || "On Site";

              const targetDate =
                scheduleItem.estimatedEndDate ||
                scheduleItem.endDate ||
                scheduleItem.startDate;

              const badge = scheduleItem.timelineBadge;
              const statusLine = scheduleItem.timelineStatusLine;

              const uniqueKey =
                scheduleItem.taskId ||
                (scheduleItem.leadId ? `${scheduleItem.leadId}-${i}` : i);

              return (
                <div
                  key={uniqueKey}
                  className="flex justify-between items-center gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 leading-snug truncate">
                      {displayTitle}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1.5 truncate">
                      <span className="truncate">{subText}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block shrink-0" />
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-rose-500">
                      {targetDate
                        ? formatDateDisplay(targetDate)
                        : "No Date"}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {badge ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeClass(
                            badge.tone
                          )}`}
                        >
                          {badge.label}
                        </span>
                      ) : statusLine ? (
                        <p className="text-xs text-gray-700 font-semibold">
                          {statusLine}
                        </p>
                      ) : scheduleItem.daysLeft !== undefined ? (
                        <p className="text-xs text-gray-700 font-semibold">
                          {scheduleItem.daysLeft} Days Left
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {meta?.source === "project_end_dates" && deadlines.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
            Showing project completion target dates (no open tasks in next {meta.taskDeadlineDays ?? 30} days)
          </div>
        )}
      </div>
    </div>
  );
}
