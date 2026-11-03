import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SuccessModal from "../components/common/SuccessModal";
import RequestMaterialModel from "../components/requestMaterialModel";
import MaterialRequestDetailsModal from "../components/materials/MaterialRequestDetailsModal";
import {
  Plus,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  getMaterialRequestsApi,
  getMaterialRequestsFiltersApi,
  exportMaterialRequestsApi,
} from "../api/projects.api";
import type { MaterialRequest } from "../types/projects.types";

const formatTableDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return { date: "-", time: "-" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "-", time: "-" };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const date = `${months[d.getMonth()]} ${d.getDate()},${d.getFullYear()}`;

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const time = `${hours.toString().padStart(2, "0")}.${minutes} ${ampm}`;

  return { date, time };
};

const formatRequiredBy = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${months[d.getMonth()]} ${d.getDate()},${d.getFullYear()}`;
};

import WaveStatCard from "../components/cards/WaveStatCard";

export default function Materials() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

  // Filters State matching mockup
  const [projectFilter, setProjectFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [requestedByFilter, setRequestedByFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Filters from API
  const { data: filtersResponse } = useQuery({
    queryKey: ["material-requests-filters"],
    queryFn: getMaterialRequestsFiltersApi,
  });
  const filtersData = filtersResponse?.data?.data;

  // Fetch Material Requests List from API
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "material-requests",
      page,
      limit,
      projectFilter,
      departmentFilter,
      statusFilter,
      requestedByFilter,
      startDateFilter,
      endDateFilter,
    ],
    queryFn: () =>
      getMaterialRequestsApi({
        page,
        limit,
        leadId: projectFilter || undefined,
        projectId: projectFilter || undefined,
        department: departmentFilter || undefined,
        requestedBy: requestedByFilter || undefined,
        status: statusFilter || undefined,
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

  // Filter options derived from API or defaults
  const projectOptions = filtersData?.projects || [];
  const departmentOptions = filtersData?.departments && filtersData.departments.length > 0
    ? filtersData.departments
    : ["Engineering", "Construction", "Procurement", "Operations"];
  const statusOptions = filtersData?.statuses && filtersData.statuses.length > 0
    ? filtersData.statuses
    : ["pending", "approved", "rejected", "fulfilled", "cancelled"];

  const requestedByOptions = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach((r: MaterialRequest) => {
      if (r.requestedBy?.name) {
        map.set(r.requestedBy.userId || r.requestedBy.name, r.requestedBy.name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [requests]);

  const hasActiveFilters = Boolean(
    projectFilter ||
    departmentFilter ||
    statusFilter ||
    requestedByFilter ||
    startDateFilter ||
    endDateFilter
  );

  const handleClearFilters = () => {
    setProjectFilter("");
    setDepartmentFilter("");
    setStatusFilter("");
    setRequestedByFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setPage(1);
    setIsDateOpen(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportMaterialRequestsApi({
        leadId: projectFilter || undefined,
        projectId: projectFilter || undefined,
        department: departmentFilter || undefined,
        requestedBy: requestedByFilter || undefined,
        status: statusFilter || undefined,
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

  const dateRangeDisplay = useMemo(() => {
    if (startDateFilter && endDateFilter) {
      const s = new Date(startDateFilter);
      const e = new Date(endDateFilter);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return `${months[s.getMonth()]} ${s.getDate()} - ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
      }
    }
    return "May 1 - May 31, 2025";
  }, [startDateFilter, endDateFilter]);

  // Stat cards configuration strictly matching screenshot
  const statCards = [
    {
      key: "total",
      title: "Total Requests",
      value: statsData?.totalRequests ?? 48,
      subtext: "All Payment Requests",
      theme: "purple" as const,
      iconBg: "bg-[#F5F3FF]",
      borderColor: "border-[#DDD6FE]",
      icon: (
        <svg
          className="w-4 h-4 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      ),
    },
    {
      key: "pending",
      title: "Pending",
      value: statsData?.pending ?? 18,
      subtext: (statsData as any)?.pendingAmount
        ? `$${Number((statsData as any).pendingAmount).toLocaleString("en-US", { minimumFractionDigits: 3 })}`
        : "$245,680.150",
      theme: "green" as const,
      iconBg: "bg-[#F0FDF4]",
      borderColor: "border-[#BBF7D0]",
      icon: (
        <svg
          className="w-4 h-4 text-emerald-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="8" width="14" height="13" rx="2" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
        </svg>
      ),
    },
    {
      key: "approved",
      title: "Approved",
      value: statsData?.approved ?? 22,
      subtext: (statsData as any)?.approvedAmount
        ? `${Number((statsData as any).approvedAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : "582,390.75",
      theme: "amber" as const,
      iconBg: "bg-[#FEFCE8]",
      borderColor: "border-[#FEF08A]",
      icon: (
        <svg
          className="w-4 h-4 text-amber-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      key: "rejected",
      title: "Rejected",
      value: statsData?.rejected ?? 6,
      subtext: (statsData as any)?.rejectedAmount
        ? `${Number((statsData as any).rejectedAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        : "578,420.20",
      theme: "red" as const,
      iconBg: "bg-[#FEF2F2]",
      borderColor: "border-[#FECACA]",
      icon: (
        <svg
          className="w-4 h-4 text-rose-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
        </svg>
      ),
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
            View & Manage all additional material requests raised by construction teams.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-xs sm:text-sm disabled:opacity-50 shadow-2xs"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <svg
                className="w-3.5 h-3.5 text-gray-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
            Export
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Requests Material
          </button>
        </div>
      </div>

      {/* Filters Section (5 columns as in screenshot) */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-100 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Projects Filter */}
          <div>
            <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">
              Projects
            </label>
            <div className="relative">
              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 bg-white border border-gray-200 rounded-md px-3.5 pr-8 text-[13px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate"
              >
                <option value="">All Projects</option>
                {projectOptions.map((proj) => (
                  <option key={proj.leadId || proj.jobId} value={proj.leadId}>
                    {proj.projectName ? `${proj.projectName} (${proj.jobId})` : proj.jobId}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Departments Filter */}
          <div>
            <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">
              Departments
            </label>
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 bg-white border border-gray-200 rounded-md px-3.5 pr-8 text-[13px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Departments</option>
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Status Filter */}
          <div>
            <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 bg-white border border-gray-200 rounded-md px-3.5 pr-8 text-[13px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer capitalize"
              >
                <option value="">All Status</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. Requested By Filter */}
          <div>
            <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">
              Requested By
            </label>
            <div className="relative">
              <select
                value={requestedByFilter}
                onChange={(e) => {
                  setRequestedByFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 bg-white border border-gray-200 rounded-md px-3.5 pr-8 text-[13px] text-gray-800 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All</option>
                {requestedByOptions.map((user) => (
                  <option key={user.value} value={user.value}>
                    {user.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 5. Date Range Filter */}
          <div className="relative" ref={datePickerRef}>
            <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">
              Date Range
            </label>
            <button
              type="button"
              onClick={() => setIsDateOpen(!isDateOpen)}
              className="w-full h-10 bg-white border border-gray-200 rounded-md px-3.5 pr-8 text-[13px] text-gray-800 flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-left"
            >
              <span className="truncate">{dateRangeDisplay}</span>
              <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </button>

            {isDateOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg border border-gray-200 shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-900">Filter by Date</span>
                  <button
                    onClick={() => {
                      setStartDateFilter("");
                      setEndDateFilter("");
                      setIsDateOpen(false);
                      setPage(1);
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => {
                        setStartDateFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => {
                        setEndDateFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-800"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDateOpen(false)}
                  className="w-full py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-3">
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors py-1 px-2 rounded-md hover:bg-gray-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 4 Stats Cards using WaveStatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <WaveStatCard
            key={card.key}
            title={card.title}
            value={card.value}
            subtext={card.subtext}
            theme={card.theme}
            isLoading={isLoading}
            iconBoxClass={`w-9 h-9 rounded-md border ${card.borderColor} ${card.iconBg}`}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-2xs overflow-hidden flex flex-col">
        <div className="p-5 pb-4 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            Material Request ({total || 54})
          </h3>
        </div>

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left min-w-225">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9FAFB]/70 text-[12px] font-bold text-gray-700">
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Project / Site</th>
                <th className="px-5 py-3.5">Requested Items</th>
                <th className="px-5 py-3.5">Request Date</th>
                <th className="px-5 py-3.5">Required By</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading material requests...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-red-500 font-medium">
                    Error loading material requests.
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 font-medium">
                    No material requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req: MaterialRequest) => {
                  const { date, time } = formatTableDate(req.requestDate);
                  const statusLower = (req.status || "").toLowerCase();
                  const priorityLower = (req.priority || "").toLowerCase();

                  return (
                    <tr
                      key={req._id}
                      className="text-[13px] hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {req.requestId}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 leading-tight">
                          {req.project?.projectName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400 font-normal leading-tight mt-0.5">
                          {req.siteLocation}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 leading-tight">
                          {req.itemCount} {req.itemCount === 1 ? "Item" : "Items"}
                        </p>
                        <p className="text-xs text-gray-400 font-normal leading-tight mt-0.5 truncate max-w-[180px]">
                          {req.requestedItems?.map((i) => i.name).join(", ") || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 leading-tight">{date}</p>
                        <p className="text-xs text-gray-400 font-normal leading-tight mt-0.5">
                          {time}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {formatRequiredBy(req.requiredBy)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-medium text-[13px] capitalize ${
                            statusLower === "pending"
                              ? "text-amber-500"
                              : statusLower === "approved"
                                ? "text-emerald-500"
                                : statusLower === "fulfilled"
                                  ? "text-blue-500"
                                  : statusLower === "cancelled"
                                    ? "text-gray-400"
                                    : "text-rose-500"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded inline-block min-w-16.25 text-center capitalize ${
                            priorityLower === "critical"
                              ? "bg-rose-100 text-rose-700"
                              : priorityLower === "high"
                                ? "bg-[#FEF2F2] text-[#EF4444]"
                                : priorityLower === "medium"
                                  ? "bg-[#FFFBEB] text-[#D97706]"
                                  : "bg-[#EFF6FF] text-[#3B82F6]"
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setDetailsOpen(true);
                          }}
                          className="text-xs font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 transition-colors shadow-2xs"
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

        {/* Pagination Section matching mockup */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <span className="text-xs text-gray-400 font-normal">Showing</span>
            <div className="relative inline-flex items-center">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none bg-white border border-gray-200 rounded pl-2.5 pr-6 py-1 text-xs font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 pointer-events-none" />
            </div>
            <span className="text-xs text-gray-400 font-normal">Results</span>
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {totalPages <= 5 ? (
              Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                      pageNum === page
                        ? "border border-indigo-500 text-indigo-600 bg-white font-semibold"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })
            ) : (
              <>
                <button
                  onClick={() => setPage(1)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                    page === 1
                      ? "border border-indigo-500 text-indigo-600 bg-white font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setPage(2)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                    page === 2
                      ? "border border-indigo-500 text-indigo-600 bg-white font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  2
                </button>
                <button
                  onClick={() => setPage(3)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                    page === 3
                      ? "border border-indigo-500 text-indigo-600 bg-white font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  3
                </button>
                <span className="w-5 text-center text-xs text-gray-400">...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                    page === totalPages
                      ? "border border-indigo-500 text-indigo-600 bg-white font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
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
