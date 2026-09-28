import CardHeader from "./CardHeader";
import { formatDateDisplay } from "../../utils/dashboard.utils";
import type { DashboardUpcomingDeadline } from "../../types/projects.types";

interface UpcomingDeadlinesProps {
  deadlines: DashboardUpcomingDeadline[];
  isLoading?: boolean;
  onViewAll?: () => void;
  className?: string;
}

const defaultDeadlines: DashboardUpcomingDeadline[] = [
  { leadId: "1", projectName: "Downtown Office Complex", site: "Site A", jobId: "JOB-001", endDate: "2025-05-25", daysLeft: 6 },
  { leadId: "2", projectName: "Residential Tower A", site: "Site A", jobId: "JOB-002", endDate: "2025-05-25", daysLeft: 6 },
  { leadId: "3", projectName: "Downtown Office Complex", site: "Site A", jobId: "JOB-003", endDate: "2025-05-25", daysLeft: 6 },
  { leadId: "4", projectName: "Residential Tower A", site: "Site A", jobId: "JOB-004", endDate: "2025-05-25", daysLeft: 6 },
  { leadId: "5", projectName: "Downtown Office Complex", site: "Site A", jobId: "JOB-005", endDate: "2025-05-25", daysLeft: 6 },
];

export default function UpcomingDeadlines({
  deadlines,
  isLoading = false,
  onViewAll,
  className = "",
}: UpcomingDeadlinesProps) {
  const displayDeadlines = deadlines && deadlines.length > 0 ? deadlines : defaultDeadlines;

  return (
    <div className={`bg-white rounded border border-gray-100 shadow-sm flex flex-col ${className}`}>
      <CardHeader
        title="Upcoming Project Deadlines"
        onViewAll={onViewAll}
      />

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
          ) : (
            displayDeadlines.map((item, i) => (
              <div
                key={item.leadId ? `${item.leadId}-${i}` : i}
                className="flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    {item.projectName || "Unnamed Project"}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                    <span>{item.site || item.location || "Site A"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-rose-500">
                    {item.endDate ? formatDateDisplay(item.endDate) : "May 25, 2025"}
                  </p>
                  <p className="text-xs text-gray-700 font-semibold mt-1">
                    {item.daysLeft !== undefined ? `${item.daysLeft} Days Left` : "6 Days Left"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
