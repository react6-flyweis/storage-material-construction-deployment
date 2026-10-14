import { useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  ChevronDown,
  Box,
  CheckCircle2,
  Layers,
  CheckCircle,
  Hourglass,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBundleScanBundlesApi, scanBundleScanApi } from "../api/projects.api";
import WaveStatCard from "../components/cards/WaveStatCard";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import BundleDetailsModal from "../components/common/BundleDetailsModal";
import type {
  BundleScanProjectSummary,
  BundleScanLoadSummary,
} from "../types/projects.types";

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${Number(weight.toFixed(0)).toLocaleString()} IBS`;
};

const formatTime = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function BundleScanBundles() {
  const { packingListId = "" } = useParams<{ packingListId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const stateProject = (location.state as { project?: BundleScanProjectSummary })?.project;
  const stateLoad = (location.state as { load?: BundleScanLoadSummary })?.load;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [scanOpen, setScanOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["bundleScanBundles", packingListId],
    queryFn: () => getBundleScanBundlesApi(packingListId),
    enabled: !!packingListId,
  });

  const apiData = data?.data?.data;
  const project = apiData?.project || stateProject;
  const load = apiData?.load || stateLoad;
  const rawBundles = useMemo(() => apiData?.bundles || [], [apiData?.bundles]);

  const total = apiData?.total || rawBundles.length || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Pagination slice (if backend does not paginate bundles)
  const bundles = useMemo(() => {
    const start = (page - 1) * limit;
    return rawBundles.slice(start, start + limit);
  }, [rawBundles, page, limit]);

  // Aggregate stats
  const scannedCount = useMemo(
    () => rawBundles.filter((b) => b.verified || b.status === "verified").length,
    [rawBundles]
  );
  const remainingCount = useMemo(
    () => rawBundles.length - scannedCount,
    [rawBundles, scannedCount]
  );
  const loadedCount = useMemo(
    () => rawBundles.filter((b) => b.status === "loaded" || b.status === "on_truck").length,
    [rawBundles]
  );

  const leadId = project?.leadId || "";
  const backToLoadsUrl = leadId
    ? `/delivery-tracking/bundle-scan/projects/${leadId}/loads`
    : "/delivery-tracking/bundle-scan";

  return (
    <div className="mx-auto pb-10 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backToLoadsUrl, { state: { project } })}
            className="px-4 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-semibold rounded-md shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug">
              Bundle List - {project?.projectName || "Downtown Office Complex"}
            </h1>
            <div className="text-xs sm:text-sm font-bold text-gray-800">
              {load?.packingListNo || "PKL-001"}
            </div>
          </div>
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
            onClick={() => setScanOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <WaveStatCard
          title="Bundles Scanned"
          value={scannedCount || 3}
          trend="5.62%"
          isUp={true}
          theme="purple"
          isLoading={isLoading}
          icon={<Box className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Bundles Remaining"
          value={remainingCount >= 0 ? remainingCount : 2}
          trend="11.4%"
          isUp={true}
          theme="green"
          isLoading={isLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Bundles Loaded"
          value={loadedCount || 1}
          trend="8.52%"
          isUp={true}
          theme="amber"
          isLoading={isLoading}
          icon={<Layers className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Toolbar: Search, Filter, Status Selector */}
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

        {/* Status dropdown placeholder */}
        <div className="flex items-center gap-2 text-xs text-gray-600 self-end sm:self-auto">
          <div className="h-8 px-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center gap-2 shadow-2xs">
            <span className="font-medium text-gray-800">Status - All Status</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="pt-2">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Bundle scan History
        </h2>
      </div>

      {/* Bundles Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-700">
                <th className="px-5 py-3 text-left">Bundle ID</th>
                <th className="px-5 py-3 text-left">Parts</th>
                <th className="px-5 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <span>Total Weight</span>
                    <span className="text-gray-400">⇅</span>
                  </div>
                </th>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      <span>Loading bundle history...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-red-500 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span>Failed to load bundles.</span>
                    </div>
                  </td>
                </tr>
              ) : bundles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    No bundles found for this packing list.
                  </td>
                </tr>
              ) : (
                bundles.map((bundle, idx) => {
                  const bundleIdDisplay =
                    bundle.bundleNo || `BND-${String(idx + 1).padStart(3, "0")}`;
                  const partsDisplay =
                    bundle.title || `STL-B${12 + (idx % 3)}`;

                  // Compute status style
                  const statusLower = (bundle.status || "").toLowerCase();
                  const isReady =
                    bundle.verified ||
                    statusLower === "verified" ||
                    statusLower === "ready";
                  const isMismatch = statusLower === "mismatch";

                  return (
                    <tr
                      key={bundle.bundleId}
                      onClick={() =>
                        navigate(
                          `/delivery-tracking/bundle-scan/bundles/${bundle.bundleId}`,
                          { state: { project, load, bundle } }
                        )
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* Bundle ID */}
                      <td className="px-5 py-3.5 text-gray-700 font-normal whitespace-nowrap">
                        {bundleIdDisplay}
                      </td>

                      {/* Parts */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {partsDisplay}
                      </td>

                      {/* Total Weight */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {formatWeight(bundle.totalWeight)}
                      </td>

                      {/* Time */}
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {formatTime(bundle.updatedAt)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isMismatch ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-medium border border-red-100">
                            <span>Mismatch</span>
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          </span>
                        ) : isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100">
                            <span>Ready</span>
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-medium border border-amber-100">
                            <span>Staging</span>
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
                              `/delivery-tracking/bundle-scan/bundles/${bundle.bundleId}`,
                              { state: { project, load, bundle } }
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

      {/* QR Code Scanner Modal */}
      <ScanQRCodeModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        scanApiFn={scanBundleScanApi}
        projectId={project?.projectId}
        leadId={project?.leadId}
        onScanSuccess={(bundleId) => {
          queryClient.invalidateQueries({
            queryKey: ["bundleScanBundles", packingListId],
          });
          setSelectedBundleId(bundleId);
          setResultOpen(true);
        }}
      />

      {/* Bundle Details & Verification Modal */}
      <BundleDetailsModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        bundleId={selectedBundleId}
        onBack={() => {
          setResultOpen(false);
        }}
      />
    </div>
  );
}
