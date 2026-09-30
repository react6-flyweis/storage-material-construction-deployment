import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsOverview from "../components/cards/StatCard";
import SuccessModal from "../components/common/SuccessModal";
import RequestMaterialModel from "../components/requestMaterialModel";
import MaterialRequestDetailsModal from "../components/materials/MaterialRequestDetailsModal";
import {
  Plus,
  Search,
  X,
  Loader2,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  getMaterialRequestsApi,
  getMaterialRequestsFiltersApi,
  exportMaterialRequestsApi,
} from "../api/projects.api";
import type { MaterialRequest } from "../types/projects.types";

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return { date: "-", time: "-" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "-", time: "-" };

  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date, time };
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Materials() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  // Filters State
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Fetch Filters from 7.1 API
  const { data: filtersResponse } = useQuery({
    queryKey: ["material-requests-filters"],
    queryFn: getMaterialRequestsFiltersApi,
  });
  const filtersData = filtersResponse?.data?.data;

  // Fetch Material Requests List from 7.2 API
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "material-requests",
      page,
      limit,
      projectFilter,
      statusFilter,
      priorityFilter,
      searchQuery,
      startDateFilter,
      endDateFilter,
    ],
    queryFn: () =>
      getMaterialRequestsApi({
        page,
        limit,
        leadId: projectFilter || undefined,
        projectId: projectFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchQuery.trim() || undefined,
        dateFrom: startDateFilter || undefined,
        dateTo: endDateFilter || undefined,
        fromDate: startDateFilter || undefined,
        toDate: endDateFilter || undefined,
      }),
  });

  const responseData = data?.data?.data;
  const requests = responseData?.materialRequests || [];
  const total = responseData?.total || 0;
  const statsData = responseData?.stats;
  const totalPages = Math.ceil(total / limit) || 1;

  // Filter options derived from API or fallbacks
  const projectOptions = filtersData?.projects || [];
  const statusOptions = filtersData?.statuses && filtersData.statuses.length > 0
    ? filtersData.statuses
    : ["pending", "approved", "rejected", "fulfilled", "cancelled"];
  const priorityOptions = filtersData?.priorities && filtersData.priorities.length > 0
    ? filtersData.priorities
    : ["low", "medium", "high", "critical"];

  const hasActiveFilters = Boolean(
    projectFilter ||
    statusFilter ||
    priorityFilter ||
    searchQuery ||
    startDateFilter ||
    endDateFilter
  );

  const handleClearFilters = () => {
    setProjectFilter("");
    setStatusFilter("");
    setPriorityFilter("");
    setSearchQuery("");
    setStartDateFilter("");
    setEndDateFilter("");
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportMaterialRequestsApi({
        leadId: projectFilter || undefined,
        projectId: projectFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchQuery.trim() || undefined,
        dateFrom: startDateFilter || undefined,
        dateTo: endDateFilter || undefined,
        fromDate: startDateFilter || undefined,
        toDate: endDateFilter || undefined,
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "material-requests.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export material requests", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Replaced emojis with modern SVG icons
  const stats = [
    {
      key: "total",
      title: "Total Requests",
      value: statsData?.totalRequests ?? 0,
      iconBg: "#F5F3FF",
      iconsvg: <Layers className="w-4 h-4 text-purple-600" />,
    },
    {
      key: "pending",
      title: "Pending",
      value: statsData?.pending ?? 0,
      iconBg: "#FEFCE8",
      iconsvg: <Clock className="w-4 h-4 text-amber-500" />,
    },
    {
      key: "approved",
      title: "Approved",
      value: statsData?.approved ?? 0,
      iconBg: "#F0FDF4",
      iconsvg: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    },
    {
      key: "rejected",
      title: "Rejected",
      value: statsData?.rejected ?? 0,
      iconBg: "#FEF2F2",
      iconsvg: <XCircle className="w-4 h-4 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Material Requests
          </h1>
          <p className="text-gray-500 font-medium mt-0.5 text-xs sm:text-[13px]">
            View & Manage all additional material requests.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-xs disabled:opacity-50"
          >
            {isExporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Export
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Requests Material
          </button>
        </div>
      </div>

      {/* Filters Section (Dropdowns + Search + Date Range) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search by Request ID */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Request ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-7 py-2 text-xs font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Projects Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 truncate"
            >
              <option value="">All Projects</option>
              {projectOptions.map((proj) => (
                <option key={proj.leadId || proj.jobId} value={proj.leadId}>
                  {proj.projectName ? `${proj.projectName} (${proj.jobId})` : proj.jobId}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 capitalize"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 capitalize"
            >
              <option value="">All Priorities</option>
              {priorityOptions.map((pr) => (
                <option key={pr} value={pr}>
                  {pr.charAt(0).toUpperCase() + pr.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Date Range
            </label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 flex items-center justify-between">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none cursor-pointer w-full text-[10px] sm:text-[11px] text-gray-600"
              />
              <span className="mx-1 text-gray-400">-</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none cursor-pointer w-full text-[10px] sm:text-[11px] text-gray-600"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors py-1 px-2 rounded-md hover:bg-gray-50"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Stats Section with icons instead of emojis */}
      <StatsOverview
        stats={stats}
        gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Material Request ({total})
          </h3>
        </div>

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Project / Site</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Required</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading material requests...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-red-500 font-medium">
                    Error loading material requests.
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 font-medium">
                    No material requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req: MaterialRequest) => {
                  const { date, time } = formatDateTime(req.requestDate);
                  const statusLower = (req.status || "").toLowerCase();
                  const priorityLower = (req.priority || "").toLowerCase();

                  return (
                    <tr
                      key={req._id}
                      className="text-[12px] hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {req.requestId}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-700 leading-tight">
                          {req.project?.projectName || "N/A"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {req.siteLocation}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-700 leading-tight">
                          {req.itemCount} {req.itemCount === 1 ? "Item" : "Items"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium truncate w-36">
                          {req.requestedItems.map((i) => i.name).join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-700 leading-tight">{date}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {time}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-700">
                        {formatDate(req.requiredBy)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            statusLower === "pending"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : statusLower === "approved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : statusLower === "fulfilled"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                                  : statusLower === "cancelled"
                                    ? "bg-gray-50 text-gray-500 border border-gray-200"
                                    : "bg-red-50 text-red-500 border border-red-100"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border capitalize ${
                            priorityLower === "critical"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : priorityLower === "high"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : priorityLower === "medium"
                                  ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                                  : "bg-blue-50 text-blue-600 border-blue-100"
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setDetailsOpen(true);
                          }}
                          className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <span className="text-sm font-medium text-gray-400">Showing</span>
            <select
              disabled
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-gray-700"
            >
              <option>{limit}</option>
            </select>
            <span className="text-sm font-medium text-gray-400">Results</span>
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                      pageNum === page
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        open={successOpen}
        title="Material Requested Successfully"
        onClose={() => setSuccessOpen(false)}
      />
      <RequestMaterialModel
        onClose={() => setIsCreateOpen(false)}
        open={isCreateOpen}
        onCreate={() => {
          setIsCreateOpen(false);
          setSuccessOpen(true);
        }}
      />
      <MaterialRequestDetailsModal
        open={detailsOpen}
        projectId={selectedProjectId}
        request={selectedRequest}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedProjectId(null);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
}
