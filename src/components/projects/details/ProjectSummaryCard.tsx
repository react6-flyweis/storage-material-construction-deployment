import React from "react";
import { Landmark, Building2, Calendar, MapPin, Warehouse, User, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "./types";

interface ProjectSummaryCardProps {
  summary: ProjectSummary;
}

export const ProjectSummaryCard: React.FC<ProjectSummaryCardProps> = ({ summary }) => {
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    const isCompleted =
      s === "delivered" ||
      s === "completed" ||
      s === "deal_closed" ||
      s === "ready_for_delivery";

    const isCancelled = s === "canceled" || s === "cancelled" || s === "rejected";

    if (isCompleted) {
      return (
        <Badge
          variant="success"
          className="bg-[#DCFCE7] text-[#16A34A] border-none px-3 py-0.5 text-xs font-semibold gap-1.5 capitalize"
        >
          <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
          {status.replace(/_/g, " ")}
        </Badge>
      );
    }

    if (isCancelled) {
      return (
        <Badge className="bg-red-50 text-red-600 border border-red-200/50 px-3 py-0.5 text-xs font-semibold gap-1.5 capitalize">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {status.replace(/_/g, " ")}
        </Badge>
      );
    }

    return (
      <Badge
        variant="inProgress"
        className="bg-amber-50 text-amber-600 border border-amber-200/50 px-3 py-0.5 text-xs font-semibold gap-1.5 capitalize"
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <Card className="p-5 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-[#EBF3FC] flex items-center justify-center shrink-0 text-brand-blue">
            <Landmark className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {summary.projectName || summary.projectCode}
              </h2>

              {getStatusBadge(summary.status)}

              {summary.priority && (
                <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
                  {summary.priority} Priority
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              {summary.projectCode}
            </p>
          </div>
        </div>

        {summary.customerName && (
          <div className="flex items-center gap-2.5 bg-gray-50/80 px-3.5 py-2 rounded-lg border border-gray-100 self-start sm:self-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 leading-snug">
                {summary.customerName}
              </p>
              {summary.customerEmail && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span>{summary.customerEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-5" />

      {/* Metadata Attributes Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Building Type */}
        <div className="flex items-start gap-3">
          <Warehouse className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-500">Building Type</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">
              {summary.buildingType || "-"}
            </p>
          </div>
        </div>

        {/* No. of Building */}
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-500">No. of Building</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">
              {summary.numberOfBuildings ?? "-"}
            </p>
          </div>
        </div>

        {/* Created On */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-500">Created On</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">
              {summary.createdOn || "-"}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-500">Location</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 leading-snug">
              {summary.location || "-"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
