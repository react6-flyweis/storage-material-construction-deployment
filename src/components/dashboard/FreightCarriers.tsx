import CardHeader from "./CardHeader";
import { Calendar, Clock } from "lucide-react";
import type { DashboardFreightCarriers, DashboardFreightCarrierRow } from "../../types/projects.types";

interface FreightCarriersProps {
  freightCarriers?: DashboardFreightCarriers;
  isLoading?: boolean;
  onViewAll?: () => void;
  className?: string;
}

const defaultRows: DashboardFreightCarrierRow[] = [
  { carrierId: "1", carrierName: "Roadking Logistics", loadsToday: 12, onTime: 10, delayed: 2, priority: "On Time" },
  { carrierId: "2", carrierName: "Swift Transport", loadsToday: 8, onTime: 8, delayed: 0, priority: "On Time" },
  { carrierId: "3", carrierName: "Global Freight Lines", loadsToday: 5, onTime: 3, delayed: 2, priority: "Delayed" },
  { carrierId: "4", carrierName: "Eagle Freight", loadsToday: 6, onTime: 6, delayed: 2, priority: "On Time" },
  { carrierId: "5", carrierName: "Prime Freight", loadsToday: 3, onTime: 3, delayed: 1, priority: "Delayed" },
];

export default function FreightCarriers({
  freightCarriers,
  isLoading = false,
  className = "",
}: FreightCarriersProps) {
  const rows = freightCarriers?.rows && freightCarriers.rows.length > 0 ? freightCarriers.rows : defaultRows;
  const totals = freightCarriers?.totals;

  const totalLoads = totals?.totalLoadsToday ?? 34;
  const onTimeText = totals ? `${totals.onTime} (${totals.onTimePct}%)` : "29 (85.8%)";
  const delayedText = totals ? `${totals.delayed} (${totals.delayedPct}%)` : "5 (14.7%)";

  return (
    <div className={`bg-white rounded border border-gray-100 shadow-sm flex flex-col h-full ${className}`}>
      <CardHeader
        title="Freight Carriers & Deliveries"
        action={
          <button
            type="button"
            className="text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded flex items-center gap-1.5 shadow-none transition-colors cursor-pointer"
          >
            <Calendar size={13} className="text-gray-500" />
            <span>September</span>
          </button>
        }
      />

      <div className="flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#EEF2F6]">
              <tr className="text-xs font-bold text-gray-800">
                <th className="py-3 pl-6 pr-2">Carrier</th>
                <th className="py-3 px-2">Loads Today</th>
                <th className="py-3 px-2">On Time</th>
                <th className="py-3 px-2">Delayed</th>
                <th className="py-3 pr-6 pl-2">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-3 pl-6 pr-2">
                      <div className="h-4 w-28 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="h-4 w-8 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="h-4 w-8 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="h-4 w-8 bg-gray-200 rounded" />
                    </td>
                    <td className="py-3 pr-6 pl-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : (
                rows.map((row, idx) => {
                  const isOnTime = (row.priority || "").toLowerCase().includes("time") || (row.priority || "").toLowerCase().includes("track");
                  return (
                    <tr key={row.carrierId || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pl-6 pr-2 text-sm font-bold text-gray-900">
                        {row.carrierName}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium text-gray-500">
                        {row.loadsToday}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium text-gray-500">
                        {row.onTime}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium text-gray-500">
                        {row.delayed}
                      </td>
                      <td className="py-3 pr-6 pl-2">
                        {isOnTime ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00C853] text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            On Time
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E53935] text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            Delayed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="p-4 sm:p-6 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#F4F5F7] p-3 sm:p-4 rounded flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-[#FA5A16] flex items-center justify-center text-white mb-2">
                <Clock size={12} strokeWidth={2.5} />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {isLoading ? "..." : totalLoads}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Total Loads Today
              </p>
            </div>
            <div className="bg-[#F4F5F7] p-3 sm:p-4 rounded flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-[#FA5A16] flex items-center justify-center text-white mb-2">
                <Clock size={12} strokeWidth={2.5} />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {isLoading ? "..." : onTimeText}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                On time
              </p>
            </div>
            <div className="bg-[#F4F5F7] p-3 sm:p-4 rounded flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-[#FA5A16] flex items-center justify-center text-white mb-2">
                <Clock size={12} strokeWidth={2.5} />
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {isLoading ? "..." : delayedText}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Delayed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
