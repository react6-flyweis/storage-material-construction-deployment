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
  ChevronDown,
  Box,
  CheckCircle2,
  CheckCircle,
  Hourglass,
  AlertTriangle,
  Tag,
  X,
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
  return `${Number(weight.toFixed(0)).toLocaleString()} LBS`;
};

export default function BundleScanBundles() {
  const { packingListId = "" } = useParams<{ packingListId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const stateProject = (location.state as { project?: BundleScanProjectSummary })?.project;
  const stateLoad = (location.state as { load?: BundleScanLoadSummary })?.load;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mismatchFilter, setMismatchFilter] = useState(false);
  const [labelPendingFilter, setLabelPendingFilter] = useState(false);

  const [scanOpen, setScanOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["bundleScanBundles", packingListId, statusFilter, mismatchFilter, labelPendingFilter],
    queryFn: () =>
      getBundleScanBundlesApi(packingListId, {
        status: statusFilter || undefined,
        mismatch: mismatchFilter ? true : undefined,
        labelPending: labelPendingFilter ? true : undefined,
      }),
    enabled: !!packingListId,
  });

  const apiData = data?.data?.data;
  const project = apiData?.project || stateProject;
  const load = apiData?.load || stateLoad;
  const rawBundles = useMemo(() => apiData?.bundles || [], [apiData?.bundles]);
  const stats = apiData?.stats;

  // Filter client-side search if provided
  const filteredBundles = useMemo(() => {
    if (!search.trim()) return rawBundles;
    const q = search.toLowerCase().trim();
    return rawBundles.filter(
      (b) =>
        b.bundleNo?.toLowerCase().includes(q) ||
        b.title?.toLowerCase().includes(q) ||
        b.bundleType?.toLowerCase().includes(q) ||
        b.mismatchNotes?.toLowerCase().includes(q)
    );
  }, [rawBundles, search]);

  const total = filteredBundles.length;
  const totalPages = Math.ceil(total / limit) || 1;

  // Pagination slice
  const bundles = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBundles.slice(start, start + limit);
  }, [filteredBundles, page, limit]);

  const leadId = project?.leadId || "";
  const backToLoadsUrl = leadId
    ? `/delivery-tracking/bundle-scan/projects/${leadId}/loads`
    : "/delivery-tracking/bundle-scan";

  const clearAllFilters = () => {
    setStatusFilter("");
    setMismatchFilter(false);
    setLabelPendingFilter(false);
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(statusFilter || mismatchFilter || labelPendingFilter || search);

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
              Bundle List — {project?.projectName || "Project"}
            </h1>
            <div className="text-xs sm:text-sm font-semibold text-gray-600 flex items-center gap-2 mt-0.5">
              <span className="font-bold text-gray-900">{load?.packingListNo || "Packing List"}</span>
              {load?.truckLabel && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{load.truckLabel}</span>
                </>
              )}
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

      {/* 4 Stat Cards based on backend stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WaveStatCard
          title="Total Bundles"
          value={stats?.total ?? rawBundles.length}
          trend={`${stats?.total ?? rawBundles.length} total`}
          isUp={true}
          theme="purple"
          isLoading={isLoading}
          icon={<Box className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Verified Bundles"
          value={stats?.verified ?? 0}
          trend={`${stats?.verified ?? 0} verified`}
          isUp={true}
          theme="green"
          isLoading={isLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="With Mismatch"
          value={stats?.withMismatch ?? 0}
          trend={stats?.withMismatch ? `${stats.withMismatch} reported` : "No mismatches"}
          isUp={false}
          theme="red"
          isLoading={isLoading}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Labels Pending"
          value={stats?.labelPending ?? 0}
          trend={stats?.labelPending ? `${stats.labelPending} unprinted` : "All printed"}
          isUp={true}
          theme="amber"
          isLoading={isLoading}
          icon={<Tag className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Toolbar: Search, Filters, and Quick Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search bundles, parts..."
              className="h-8 pl-8 pr-7 bg-white border border-gray-200 rounded-md text-xs font-normal text-gray-800 placeholder:text-gray-400 outline-none w-48 sm:w-56 shadow-2xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all"
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

          {/* Status selector */}
          <div className="relative inline-flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-3 pr-8 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 shadow-2xs outline-none cursor-pointer appearance-none hover:bg-gray-50 focus:border-indigo-400"
            >
              <option value="">All Statuses</option>
              <option value="staged">Staged</option>
              <option value="verified">Verified</option>
              <option value="loaded">Loaded</option>
              <option value="on_truck">On Truck</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Quick Filter: Mismatch Only */}
          <button
            type="button"
            onClick={() => {
              setMismatchFilter(!mismatchFilter);
              setPage(1);
            }}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 border shadow-2xs transition-all cursor-pointer ${
              mismatchFilter
                ? "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-300"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${mismatchFilter ? "text-red-600" : "text-gray-400"}`} />
            <span>Mismatch Only</span>
          </button>

          {/* Quick Filter: Label Pending Only */}
          <button
            type="button"
            onClick={() => {
              setLabelPendingFilter(!labelPendingFilter);
              setPage(1);
            }}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 border shadow-2xs transition-all cursor-pointer ${
              labelPendingFilter
                ? "bg-amber-50 border-amber-300 text-amber-700 ring-1 ring-amber-300"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Tag className={`w-3.5 h-3.5 ${labelPendingFilter ? "text-amber-600" : "text-gray-400"}`} />
            <span>Label Pending</span>
          </button>

          {/* Reset All */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bundles Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-700">
                <th className="px-5 py-3 text-left">Bundle ID</th>
                <th className="px-5 py-3 text-left">Title / Parts</th>
                <th className="px-5 py-3 text-left">Weight</th>
                <th className="px-5 py-3 text-left">Max Length</th>
                <th className="px-5 py-3 text-left">Label</th>
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
                      <span>Loading bundles...</span>
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
                      <span>Failed to load bundles.</span>
                    </div>
                  </td>
                </tr>
              ) : bundles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    {hasActiveFilters
                      ? "No bundles match the selected filters."
                      : "No bundles found for this packing list."}
                  </td>
                </tr>
              ) : (
                bundles.map((bundle, idx) => {
                  const bundleIdDisplay =
                    bundle.bundleNo || `BND-${String(idx + 1).padStart(3, "0")}`;
                  const partsDisplay = bundle.title || "Bundle Items";
                  const statusLower = (bundle.status || "").toLowerCase();
                  const isVerified = Boolean(bundle.verified || statusLower === "verified");
                  const hasMismatch = Boolean(bundle.hasMismatch || statusLower === "mismatch");

                  return (
                    <tr
                      key={bundle.bundleId}
                      onClick={() =>
                        navigate(
                          `/delivery-tracking/bundle-scan/bundles/${bundle.bundleId}`,
                          { state: { project, load, bundle } }
                        )
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Bundle ID */}
                      <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                        {bundleIdDisplay}
                      </td>

                      {/* Parts / Title */}
                      <td className="px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {partsDisplay}
                          </p>
                          <p className="text-[11px] text-gray-400 capitalize">
                            {bundle.bundleType || "Standard"}
                          </p>
                        </div>
                      </td>

                      {/* Total Weight */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {formatWeight(bundle.totalWeight)}
                      </td>

                      {/* Max Length */}
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {bundle.maxLengthFeet ? `${bundle.maxLengthFeet} FT` : "-"}
                      </td>

                      {/* Label Printed Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {bundle.labelPrinted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Printed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                            <Tag className="w-3 h-3 text-amber-500" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            <span>Verified</span>
                          </span>
                        ) : statusLower === "loaded" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
                            <span>Loaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200">
                            <Hourglass className="w-3 h-3 text-slate-500" />
                            <span className="capitalize">{bundle.status || "Staged"}</span>
                          </span>
                        )}
                      </td>

                      {/* Mismatch */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {hasMismatch ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-semibold border border-red-200 w-fit">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span>Mismatch</span>
                            </span>
                            {bundle.mismatchNotes && (
                              <span className="text-[10px] text-red-600 mt-0.5 max-w-[140px] truncate" title={bundle.mismatchNotes}>
                                {bundle.mismatchNotes}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium text-xs">Clear</span>
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
                          className="px-3.5 py-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-semibold rounded-md shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Details
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
            <span>Results (Total {total})</span>
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
