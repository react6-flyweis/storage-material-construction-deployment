import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle,
  Building2,
  Share,
  QrCode,
  Keyboard,
  Search,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBundleScanProjectsApi, scanBundleScanApi } from "../api/projects.api";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import toast from "react-hot-toast";

export default function BundleScan() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bundleScanProjects", page, limit],
    queryFn: () =>
      getBundleScanProjectsApi({
        page,
        limit,
      }),
  });

  const apiData = data?.data?.data;
  const projects = useMemo(() => apiData?.projects || [], [apiData?.projects]);
  const total = apiData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="mx-auto pb-10 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Dispatch Verification
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

      {/* Projects Table Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
        {/* Table Title and Controls */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Project List
          </h2>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input Placeholder */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                readOnly
                placeholder="Search"
                className="h-8 pl-8 pr-3 bg-white border border-gray-200 rounded-md text-xs font-normal text-gray-500 placeholder:text-gray-400 outline-none w-44 sm:w-52"
              />
            </div>

            {/* All Projects Dropdown Placeholder */}
            <div className="h-8 px-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center gap-2">
              <span>All Projects</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* Date Range Selector Placeholder */}
            <div className="h-8 px-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center gap-2">
              <span>May 1 - May 31, 2025</span>
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-700">
                <th className="px-5 py-3 text-left">Project ID</th>
                <th className="px-5 py-3 text-left">Project / Site Name</th>
                <th className="px-5 py-3 text-left">Total Packing list</th>
                <th className="px-5 py-3 text-left">Total Bundles</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      <span>Loading projects...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-xs text-red-500 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span>Failed to load projects.</span>
                    </div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-xs text-gray-500 font-medium"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const displayJobId =
                    proj.jobId || proj.projectId || `PRJ-${proj.leadId.slice(-4).toUpperCase()}`;

                  return (
                    <tr
                      key={proj.leadId}
                      onClick={() =>
                        navigate(
                          `/delivery-tracking/bundle-scan/projects/${proj.leadId}/loads`,
                          { state: { project: proj } }
                        )
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Project ID */}
                      <td className="px-5 py-3.5 font-bold text-gray-900 tracking-tight whitespace-nowrap">
                        {displayJobId}
                      </td>

                      {/* Project / Site Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                              {proj.projectName || "Unnamed Project"}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {proj.location || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Total Packing list */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {proj.totalLoads ?? 0}
                      </td>

                      {/* Total Bundles */}
                      <td className="px-5 py-3.5 text-gray-800 font-medium whitespace-nowrap">
                        {proj.totalBundles ?? 0} Bundles
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-3.5 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/delivery-tracking/bundle-scan/projects/${proj.leadId}/loads`,
                              { state: { project: proj } }
                            )
                          }
                          className="px-3.5 py-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-medium rounded-md shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
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
