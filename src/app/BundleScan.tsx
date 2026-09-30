import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Download, ArrowUpDown, QrCode, Keyboard, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBundleScansApi, exportBundleScanApi, scanBundleScanApi } from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import CustomSelect from "../components/common/CustomSelect";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import BundleDetailsModal from "../components/common/BundleDetailsModal";
import toast from "react-hot-toast";


const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatParts = (parts?: string) => {
  if (!parts) return "-";
  const cleaned = parts
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
  return cleaned || "-";
};

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${weight.toLocaleString()} LBS`;
};

const formatScannedTime = (scannedAt?: string) => {
  if (!scannedAt) return "-";
  const date = new Date(scannedAt);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export default function BundleScan() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Weight");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [scanOpen, setScanOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bundleScans", page, limit, debouncedSearch, sortBy, statusFilter],
    queryFn: () =>
      getBundleScansApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      }),
  });

  const apiData = data?.data?.data;
  const bundles = apiData?.bundles || [];
  const total = apiData?.total || 0;
  const apiStats = apiData?.stats;
  const enums = apiData?.enums;

  const totalPages = Math.ceil(total / limit) || 1;

  const enumsStatus = enums?.status;
  const enumsSortBy = enums?.sortBy;

  // Status enum options
  const statusOptions = useMemo(() => {
    if (enumsStatus && enumsStatus.length > 0) {
      return enumsStatus.map((s) => ({
        label: s === "all" ? "All Statuses" : formatStatus(s),
        value: s,
      }));
    }
    return [
      { label: "All Statuses", value: "all" },
      { label: "Pending", value: "pending" },
      { label: "Staged", value: "staged" },
      { label: "On Truck", value: "on_truck" },
      { label: "Loaded", value: "loaded" },
    ];
  }, [enumsStatus]);

  // Sort options
  const sortOptions = useMemo(() => {
    const rawSorts = enumsSortBy || ["Latest", "Oldest", "Weight"];
    return rawSorts.map((s) => ({ label: s, value: s }));
  }, [enumsSortBy]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await exportBundleScanApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      });
      downloadFileFromResponse(res, "bundle-scan.xlsx");
      toast.success("Bundle scan data exported successfully");
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to export bundle scan data");
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    { title: "Bundles Scanned", value: apiStats?.bundlesScanned ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Bundles Remaining", value: apiStats?.bundlesRemaining ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Bundles Loaded", value: apiStats?.bundlesLoaded ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Bundle Scan</h1>
          <p className="text-sm font-medium text-gray-500 max-w-2xl">Scan bundle QR codes to verify staging, loading, and dispatch readiness.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
          <button
            onClick={() => setScanOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-750 shadow-sm hover:bg-gray-50 transition-all"
          >
            <QrCode className="w-4 h-4" />
            Scan QR Code
          </button>
          <button
            onClick={() => setScanOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#6366F1] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-100 hover:opacity-90 transition-all"
          >
            <Keyboard className="w-4 h-4" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <QrCode className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg mb-2" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                {stat.value}
              </h3>
            )}
          </div>
        ))}
      </div>

      {/* Table Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bundle history..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none shadow-sm focus:border-blue-500 transition-all duration-200"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <CustomSelect
            title="Filter by Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            width="180px"
          />

          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center justify-between sm:justify-start gap-3 shadow-sm relative h-[40px] min-w-[150px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Sort by :</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-transparent text-xs font-bold text-gray-900 pr-6 outline-none cursor-pointer w-full"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-900 absolute right-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[24px] border border-gray-50 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 sm:px-8 py-5 border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Bundle scan History</h3>
        </div>
        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 w-12">
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-md cursor-pointer hover:border-blue-400" />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Project / Site</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bundle ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Parts</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 cursor-pointer group">
                    Total Weight <ArrowUpDown className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 font-medium">
                    Loading bundle scans...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-red-500 font-medium">
                    Failed to load bundle scans. Please try again.
                  </td>
                </tr>
              ) : bundles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 font-medium">
                    No bundle scans found.
                  </td>
                </tr>
              ) : (
                bundles.map((row, i) => {
                  const rowId = row.bundleId || row.bundleNo;
                  return (
                    <tr key={rowId || i} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-md cursor-pointer group-hover:border-blue-400 transition-all" />
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-gray-900 mb-1 leading-tight">
                          {row.project?.projectName || "N/A"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">
                          {row.project?.jobId || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-400">{row.bundleNo || "-"}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{formatParts(row.parts)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{formatWeight(row.totalWeight)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500">{formatScannedTime(row.scannedAt)}</td>
                      <td className="px-6 py-5">
                        <span className={`
                          px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit
                          ${row.status === "pending" ? "bg-yellow-50 text-yellow-600" :
                            row.status === "assigned_to_truck" ? "bg-blue-50 text-blue-600" :
                              "bg-green-50 text-green-600"}
                        `}>
                          {formatStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedBundleId(rowId);
                            setResultOpen(true);
                          }}
                          className="bg-[#1D51A4] text-white px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-sm"
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
        <div className="px-4 sm:px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 order-2 sm:order-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Showing</p>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 shadow-sm outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Results</p>
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="p-2 text-gray-300 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="text-gray-400 px-1">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === p
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                          : "text-gray-400 hover:bg-white hover:text-gray-900"
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
              className="p-2 text-gray-300 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      <ScanQRCodeModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        scanApiFn={scanBundleScanApi}
        onScanSuccess={(bundleId) => {
          setSelectedBundleId(bundleId);
          setResultOpen(true);
        }}
      />

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
