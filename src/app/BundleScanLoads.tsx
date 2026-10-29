import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Share,
  QrCode,
  Keyboard,
  Search,
  ArrowUpDown,
  ChevronDown,
  FileText,
  CheckCircle2,
  Layers,
  AlertTriangle,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBundleScanLoadsApi } from "../api/projects.api";
import WaveStatCard from "../components/cards/WaveStatCard";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import type { BundleScanProjectListItem, BundleScanProjectSummary } from "../types/projects.types";

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${Number(weight.toFixed(0)).toLocaleString()} LBS`;
};

const formatStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "ready":
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Ready" };
    case "confirmed":
      return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Confirmed" };
    case "loading":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Loading" };
    case "delivery_created":
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Delivery Created" };
    case "dispatched":
      return { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", label: "Dispatched" };
    case "delivered":
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Delivered" };
    case "draft":
      return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", label: "Draft" };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        label: status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : "-",
      };
  }
};

export default function BundleScanLoads() {
  const { leadId = "" } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateProject = (location.state as { project?: BundleScanProjectListItem | BundleScanProjectSummary })?.project;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [scanModalOpen, setScanModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bundleScanLoads", leadId, page, limit, debouncedSearch, selectedStatus, sortBy, sortOrder],
    queryFn: () =>
      getBundleScanLoadsApi(leadId, {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus || undefined,
        sortBy,
        sortOrder,
      }),
    enabled: !!leadId,
  });

  const apiData = data?.data?.data;
  const project = apiData?.project || stateProject;
  const loads = useMemo(() => apiData?.loads || [], [apiData?.loads]);
  const total = apiData?.total || loads.length || 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const stats = apiData?.stats;
  const filterOptions = apiData?.filters;

  const availableStatuses = useMemo(() => {
    if (filterOptions?.statuses && filterOptions.statuses.length > 0) {
      return filterOptions.statuses;
    }
    return ["draft", "confirmed", "ready", "loading", "delivery_created", "dispatched", "delivered"];
  }, [filterOptions?.statuses]);

  const availableSortOptions = useMemo(() => {
    if (filterOptions?.sortBy && filterOptions.sortBy.length > 0) {
      return filterOptions.sortBy;
    }
    return ["updatedAt", "packingListNo", "status", "totalBundles", "totalWeight"];
  }, [filterOptions?.sortBy]);

  const formatSortLabel = (val: string) => {
    switch (val) {
      case "updatedAt":
        return "Latest Updated";
      case "packingListNo":
        return "Packing List No";
      case "status":
        return "Status";
      case "totalBundles":
        return "Total Bundles";
      case "totalWeight":
        return "Total Weight";
      default:
        return val;
    }
  };

  return (
    <div className="mx-auto pb-10 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/delivery-tracking/bundle-scan")}
            className="px-4 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-semibold rounded-md shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Packing Lists & Loads — {project?.projectName || "Project"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-all"
          >
            <Share className="w-3.5 h-3.5 text-gray-600" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setScanModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setScanModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards using backend stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WaveStatCard
          title="Total Packing Lists"
          value={stats?.totalLoads ?? total}
          trend={`${stats?.totalLoads ?? total} loads`}
          isUp={true}
          theme="purple"
          isLoading={isLoading}
          icon={<FileText className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Loads Ready"
          value={stats?.ready ?? 0}
          trend={`${stats?.ready ?? 0} ready`}
          isUp={true}
          theme="green"
          isLoading={isLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Loading / Staging"
          value={stats?.loading ?? 0}
          trend={`${stats?.loading ?? 0} in progress`}
          isUp={true}
          theme="amber"
          isLoading={isLoading}
          icon={<Layers className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="With Mismatch"
          value={stats?.withMismatch ?? 0}
          trend={stats?.withMismatch ? `${stats.withMismatch} require review` : "All clear"}
          isUp={false}
          theme="red"
          isLoading={isLoading}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PL#, truck, truck type..."
              className="h-8 pl-8 pr-7 bg-white border border-gray-200 rounded-md text-xs font-normal text-gray-800 placeholder:text-gray-400 outline-none w-52 sm:w-60 shadow-2xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status filter dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-3 pr-8 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 shadow-2xs outline-none cursor-pointer appearance-none hover:bg-gray-50 focus:border-indigo-400"
            >
              <option value="">All Statuses</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1).replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Reset filter button if active */}
          {(selectedStatus || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus("");
                setSearch("");
                setPage(1);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Sort by dropdown */}
        <div className="flex items-center gap-2 text-xs text-gray-600 self-end sm:self-auto">
          <div className="relative inline-flex items-center">
            <div className="h-8 pl-2.5 pr-8 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-2xs">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <span className="font-normal text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-semibold text-gray-900 outline-none cursor-pointer appearance-none pr-4"
              >
                {availableSortOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {formatSortLabel(opt)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Sort order toggle button */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title={`Toggle sort order (current: ${sortOrder.toUpperCase()})`}
            className="h-8 px-2.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
          >
            {sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
          </button>
        </div>
      </div>

      {/* Loads Table Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-700">
                <th className="px-5 py-3 text-left">Packing List #</th>
                <th className="px-5 py-3 text-left">Truck / Type</th>
                <th className="px-5 py-3 text-left">Total Bundles</th>
                <th className="px-5 py-3 text-left">Total Weight</th>
                <th className="px-5 py-3 text-left">Max Length</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Mismatch</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      <span>Loading packing lists and loads...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-xs text-red-500 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span>Failed to load project loads.</span>
                    </div>
                  </td>
                </tr>
              ) : loads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    {debouncedSearch || selectedStatus
                      ? "No packing lists matching your search or filters."
                      : "No packing lists found for this project."}
                  </td>
                </tr>
              ) : (
                loads.map((load, idx) => {
                  const packingListDisplay =
                    load.packingListNo || `PKL-${String(idx + 1).padStart(3, "0")}`;
                  const truckDisplay = load.truckLabel
                    ? `${load.truckLabel}${load.truckType ? ` (${load.truckType})` : ""}`
                    : load.truckType || "Truck N/A";
                  const statusBadge = formatStatusBadge(load.status);
                  const hasMismatch = Boolean(load.hasMismatch || (load.mismatchCount && load.mismatchCount > 0));

                  return (
                    <tr
                      key={load.packingListId}
                      onClick={() =>
                        navigate(
                          `/delivery-tracking/bundle-scan/loads/${load.packingListId}/bundles`,
                          { state: { project, load } }
                        )
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Packing List */}
                      <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                        {packingListDisplay}
                      </td>

                      {/* Truck */}
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {truckDisplay}
                      </td>

                      {/* Bundles */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {load.totalBundles ?? 0}
                      </td>

                      {/* Total Weight */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {formatWeight(load.totalWeight)}
                      </td>

                      {/* Max Length */}
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {load.maxLengthFeet ? `${load.maxLengthFeet} FT` : "-"}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>

                      {/* Mismatch badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {hasMismatch ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span>{load.mismatchCount ? `${load.mismatchCount} Mismatch` : "Mismatch"}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium text-xs">No mismatch</span>
                        )}
                      </td>

                      {/* Action */}
                      <td
                        className="px-5 py-3.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/delivery-tracking/bundle-scan/loads/${load.packingListId}/bundles`,
                              { state: { project, load } }
                            )
                          }
                          className="px-3.5 py-1 bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
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

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-normal">
            <span>Showing</span>
            <div className="relative inline-flex items-center">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-gray-200 rounded-md pl-2 pr-6 py-0.5 text-xs font-medium text-gray-700 outline-none cursor-pointer appearance-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 pointer-events-none" />
            </div>
            <span>Results</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-600 font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ScanQRCodeModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        leadId={leadId}
        onScanSuccess={(scannedBundleId) => {
          setScanModalOpen(false);
          navigate(`/delivery-tracking/bundle-scan/bundles/${scannedBundleId}`);
        }}
      />
    </div>
  );
}
