import { useState, useMemo } from "react";
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
  Filter,
  ArrowUpDown,
  ChevronDown,
  FileText,
  CheckCircle2,
  Layers,
  Clock,
  CheckCircle,
  Hourglass,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBundleScanLoadsApi, scanBundleScanApi } from "../api/projects.api";
import WaveStatCard from "../components/cards/WaveStatCard";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import type { BundleScanProjectListItem, BundleScanProjectSummary } from "../types/projects.types";
import toast from "react-hot-toast";

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${Number(weight.toFixed(0)).toLocaleString()} IBS`;
};

export default function BundleScanLoads() {
  const { leadId = "" } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateProject = (location.state as { project?: BundleScanProjectListItem | BundleScanProjectSummary })?.project;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bundleScanLoads", leadId, page, limit],
    queryFn: () => getBundleScanLoadsApi(leadId, { page, limit }),
    enabled: !!leadId,
  });

  const apiData = data?.data?.data;
  const project = apiData?.project || stateProject;
  const loads = useMemo(() => apiData?.loads || [], [apiData?.loads]);
  const total = apiData?.total || loads.length || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Stat calculations
  const totalBundles = useMemo(
    () => loads.reduce((sum, l) => sum + (l.totalBundles || 0), 0),
    [loads]
  );
  const readyCount = useMemo(
    () => loads.filter((l) => l.status === "confirmed" || l.status === "ready" || l.status === "loaded").length,
    [loads]
  );
  const loadingCount = useMemo(
    () => loads.filter((l) => l.status !== "confirmed" && l.status !== "ready" && l.status !== "loaded").length,
    [loads]
  );

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
            Packing List - {project?.projectName || "Downtown Office Complex"}
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

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WaveStatCard
          title="Total Packing List"
          value={total || loads.length || 24}
          trend="5.62%"
          isUp={true}
          theme="purple"
          isLoading={isLoading}
          icon={<FileText className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Loads Ready For Dispatch"
          value={readyCount || 15}
          trend="11.4%"
          isUp={true}
          theme="green"
          isLoading={isLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Bundles Assigned"
          value={totalBundles || 58}
          trend="8.52%"
          isUp={true}
          theme="amber"
          isLoading={isLoading}
          icon={<Layers className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Loads Dispatch Today"
          value={loadingCount || 3}
          trend="7.45%"
          isUp={false}
          theme="red"
          isLoading={isLoading}
          icon={<Clock className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          {/* Search box placeholder */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder="Search"
              className="h-8 pl-8 pr-3 bg-white border border-gray-200 rounded-md text-xs font-normal text-gray-500 placeholder:text-gray-400 outline-none w-48 sm:w-56 shadow-2xs"
            />
          </div>

          {/* Filter button placeholder */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 h-8 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span>Filter</span>
          </button>
        </div>

        {/* Sort by dropdown placeholder */}
        <div className="flex items-center gap-2 text-xs text-gray-600 self-end sm:self-auto">
          <div className="h-8 px-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-2xs">
            <ArrowUpDown className="w-3 h-3 text-gray-400" />
            <span className="font-normal text-gray-600">Sort by :</span>
            <span className="font-semibold text-gray-900">Latest</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Loads Table Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[850px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-700">
                <th className="px-5 py-3 text-left">Packing List</th>
                <th className="px-5 py-3 text-left">Load</th>
                <th className="px-5 py-3 text-left">Truck</th>
                <th className="px-5 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <span>Bundles</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="px-5 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <span>Total Weight</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="px-5 py-3 text-left">Destination</th>
                <th className="px-5 py-3 text-left">Status</th>
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
                    No packing lists found for this project.
                  </td>
                </tr>
              ) : (
                loads.map((load, idx) => {
                  const isReady =
                    load.status === "confirmed" ||
                    load.status === "ready" ||
                    load.status === "verified";
                  const packingListDisplay =
                    load.packingListNo || `PKL-${String(idx + 1).padStart(3, "0")}`;
                  const loadDisplay = `LOAD-${String(idx + 1).padStart(3, "0")}`;
                  const destination = project?.location || "Site A";

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
                      <td className="px-5 py-3.5 text-gray-700 font-normal whitespace-nowrap">
                        {packingListDisplay}
                      </td>

                      {/* Load */}
                      <td className="px-5 py-3.5 text-gray-700 font-normal whitespace-nowrap">
                        {loadDisplay}
                      </td>

                      {/* Truck */}
                      <td className="px-5 py-3.5 text-gray-700 font-normal whitespace-nowrap">
                        {load.truckLabel || `TX-${4582 + (idx % 2 === 0 ? 0 : -2237)}`}
                      </td>

                      {/* Bundles */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {load.totalBundles ?? 0}
                      </td>

                      {/* Total Weight */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {formatWeight(load.totalWeight)}
                      </td>

                      {/* Destination */}
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {destination}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100">
                            <span>Ready</span>
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-medium border border-amber-100">
                            <span>Loading</span>
                            <Hourglass className="w-3 h-3 text-amber-500" />
                          </span>
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
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1.5">
                      {showEllipsis && (
                        <span className="text-gray-400 text-xs px-0.5">-</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          page === p
                            ? "border border-[#8B5CF6] text-[#8B5CF6] bg-white shadow-2xs"
                            : "text-gray-600 hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code / Manual Entry Modal */}
      <ScanQRCodeModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        scanApiFn={scanBundleScanApi}
        onScanSuccess={() => {
          setScanModalOpen(false);
          toast.success("Bundle scanned successfully");
        }}
      />
    </div>
  );
}
