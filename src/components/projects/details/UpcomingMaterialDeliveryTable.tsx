import React, { useState } from "react";
import { ArrowUpDown, Calendar, Check, Mail, Phone, Truck } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MaterialDelivery } from "./types";

interface UpcomingMaterialDeliveryTableProps {
  deliveries: MaterialDelivery[];
  onSelectDelivery?: (delivery: MaterialDelivery) => void;
}

type SortField = "id" | "status" | "date" | "item" | null;
type SortOrder = "asc" | "desc";

export const UpcomingMaterialDeliveryTable: React.FC<UpcomingMaterialDeliveryTableProps> = ({
  deliveries,
  onSelectDelivery,
}) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedDeliveries = React.useMemo(() => {
    if (!sortField) return deliveries;
    return [...deliveries].sort((a, b) => {
      const aVal = (a[sortField] || "").toString();
      const bVal = (b[sortField] || "").toString();
      const comparison = aVal.localeCompare(bVal);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [deliveries, sortField, sortOrder]);

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    const isCompleted = s === "confirmed" || s === "delivered" || s === "completed";
    const isInTransit = s === "in_transit" || s === "dispatched";

    if (isCompleted) {
      return (
        <Badge
          variant="success"
          className="bg-[#DCFCE7] text-[#16A34A] border-none px-3 py-1 text-xs font-semibold gap-1.5 capitalize"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{status.replace(/_/g, " ")}</span>
        </Badge>
      );
    }

    if (isInTransit) {
      return (
        <Badge className="bg-purple-50 text-purple-600 border border-purple-200/50 px-3 py-1 text-xs font-semibold gap-1.5 capitalize">
          <Truck className="w-3.5 h-3.5" />
          <span>{status.replace(/_/g, " ")}</span>
        </Badge>
      );
    }

    return (
      <Badge
        variant="scheduled"
        className="bg-[#EBF3FC] text-brand-accent border-none px-3 py-1 text-xs font-semibold gap-1.5 capitalize"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{status.replace(/_/g, " ")}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-3.5">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
        Upcoming Material Delivery {deliveries.length > 0 && `(${deliveries.length})`}
      </h3>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <tr className="bg-[#2B579A] text-white">
              <TableHead
                onClick={() => handleSort("id")}
                className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4 sm:px-6 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>ID</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </TableHead>

              <TableHead
                onClick={() => handleSort("status")}
                className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </TableHead>

              <TableHead
                onClick={() => handleSort("date")}
                className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date &amp; Time</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </TableHead>

              <TableHead
                onClick={() => handleSort("item")}
                className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Item</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-80" />
                </div>
              </TableHead>

              <TableHead className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4">
                Vendor
              </TableHead>

              <TableHead className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4">
                Carrier
              </TableHead>

              <TableHead className="text-white font-semibold text-xs sm:text-sm py-3.5 px-4 sm:px-6">
                POC
              </TableHead>
            </tr>
          </TableHeader>

          <TableBody>
            {sortedDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500 font-medium">
                  No material deliveries found for this project.
                </TableCell>
              </TableRow>
            ) : (
              sortedDeliveries.map((delivery) => (
                <TableRow
                  key={delivery.id}
                  className="hover:bg-blue-50/20 transition-colors"
                >
                  {/* ID */}
                  <TableCell className="font-bold text-brand-accent text-xs sm:text-sm px-4 sm:px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onSelectDelivery?.(delivery)}
                      className="hover:underline font-bold text-left cursor-pointer"
                    >
                      {delivery.deliveryNumber || delivery.id}
                    </button>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-4 py-4">
                    {renderStatusBadge(delivery.status)}
                  </TableCell>

                  {/* Date & Time */}
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                      {delivery.date || "-"}
                    </div>
                    {delivery.time && (
                      <div className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
                        {delivery.time}
                      </div>
                    )}
                  </TableCell>

                  {/* Item */}
                  <TableCell className="px-4 py-4">
                    <div className="text-xs sm:text-sm font-bold text-gray-900 max-w-37.5 leading-snug">
                      {delivery.item || "-"}
                    </div>
                    {delivery.loadWeight !== undefined && delivery.loadWeight !== null && (
                      <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                        Weight: {delivery.loadWeight.toLocaleString()} lbs
                      </div>
                    )}
                  </TableCell>

                  {/* Vendor */}
                  <TableCell className="px-4 py-4">
                    <div className="text-xs sm:text-sm text-gray-700 max-w-35 leading-snug">
                      {delivery.vendor || "-"}
                    </div>
                  </TableCell>

                  {/* Carrier */}
                  <TableCell className="px-4 py-4">
                    <div className="text-xs sm:text-sm text-gray-700 max-w-35 leading-snug">
                      {delivery.carrier || "-"}
                    </div>
                  </TableCell>

                  {/* POC */}
                  <TableCell className="px-4 sm:px-6 py-4">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 max-w-37.5 leading-snug">
                      {delivery.pocName || "-"}
                    </div>
                    {(delivery.pocPhone || delivery.pocEmail) && (
                      <div className="flex items-center gap-2.5 mt-1.5 text-brand-accent">
                        {delivery.pocPhone && (
                          <a
                            href={`tel:${delivery.pocPhone}`}
                            className="hover:text-blue-800 transition-colors"
                            title={`Call ${delivery.pocPhone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {delivery.pocEmail && (
                          <a
                            href={`mailto:${delivery.pocEmail}`}
                            className="hover:text-blue-800 transition-colors"
                            title={`Email ${delivery.pocEmail}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
