import CardHeader from "./CardHeader";
import { formatDateDisplay, getDeliveryStatusBadgeClass } from "../../utils/dashboard.utils";
import type { DashboardActiveSite } from "../../types/projects.types";

interface ActiveConstructionSitesProps {
  sites: DashboardActiveSite[];
  isLoading?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export default function ActiveConstructionSites({
  sites,
  isLoading = false,
  onViewAll,
  className = "lg:col-span-2",
}: ActiveConstructionSitesProps) {
  return (
    <div className={`bg-white rounded border border-gray-100 shadow-sm flex flex-col ${className}`}>
      <CardHeader
        title="Active Construction Sites"
        badge={
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded border border-gray-100">
            {sites.length} Sites
          </span>
        }
        onViewAll={onViewAll}
      />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1 overflow-auto max-h-90">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 sticky top-0 z-10">
              <tr className="text-[11px] font-bold text-gray-900 border-b border-gray-100 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-2 rounded-tl">Project</th>
                <th className="py-3 pr-2">Progress</th>
                <th className="py-3 pr-2">Deadline</th>
                <th className="py-3 pr-4 rounded-tr">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-3 pl-4 pr-2">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </td>
                    <td className="py-3 pr-2">
                      <div className="h-2 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 pr-2">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="h-5 w-16 bg-gray-200 rounded" />
                    </td>
                  </tr>
                ))
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs font-medium text-gray-400">
                    No active construction site data available
                  </td>
                </tr>
              ) : (
                sites.map((site, idx) => (
                  <tr key={site.leadId || idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 pl-4 pr-2">
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {site.projectName || "Unnamed Project"}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {site.site || "N/A"} <span className="text-orange-500 font-semibold">• {site.jobId}</span>
                        {site.buildingType ? ` • ${site.buildingType}` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, site.progressPct ?? 0))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {site.progressPct ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-2 text-xs font-medium text-gray-700">
                      {site.deadline ? formatDateDisplay(site.deadline) : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getDeliveryStatusBadgeClass(
                          site.deliveryStatus
                        )}`}
                      >
                        {site.deliveryStatus || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
