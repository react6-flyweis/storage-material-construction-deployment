import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Download, ArrowUpDown, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDispatchVerificationApi, exportDispatchVerificationApi } from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import CustomSelect from "../components/common/CustomSelect";
import toast from "react-hot-toast";
import DispatchDetailModal from "../components/common/DispatchDetailModal";

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-50 text-gray-600";
  const lowered = status.toLowerCase();
  if (lowered === "pending") return "bg-yellow-50 text-yellow-600";
  if (lowered === "confirmed" || lowered === "verified") return "bg-emerald-50 text-emerald-600";
  return "bg-blue-50 text-blue-600";
};

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${weight.toLocaleString()} LBS`;
};

export default function DispatchVerification() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Oldest");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    queryKey: ["dispatchVerification", page, limit, debouncedSearch, sortBy, statusFilter],
    queryFn: () =>
      getDispatchVerificationApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      }),
  });

  const apiData = data?.data?.data;
  const loads = apiData?.loads || [];
  const total = apiData?.total || 0;
  const apiStats = apiData?.stats;
  const enums = apiData?.enums;

  const totalPages = Math.ceil(total / limit) || 1;

  const enumsStatus = enums?.status;
  const enumsSortBy = enums?.sortBy;

  // Status options (UI enums)
  const statusOptions = useMemo(() => {
    if (enumsStatus && enumsStatus.length > 0) {
      return enumsStatus.map((s) => ({
        label: s === "all" ? "All Loads" : formatStatus(s),
        value: s,
      }));
    }
    return [
      { label: "All Loads", value: "all" },
      { label: "Pending Verification", value: "pending" },
      { label: "Verified (Ready)", value: "verified" },
      { label: "Dispatched", value: "dispatched" },
    ];
  }, [enumsStatus]);

  // Sort options
  const sortOptions = useMemo(() => {
    const rawSorts = enumsSortBy || ["Latest", "Oldest", "Weight", "PackingListNo"];
    return rawSorts.map((s) => ({ label: s, value: s }));
  }, [enumsSortBy]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await exportDispatchVerificationApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      });
      downloadFileFromResponse(res, "dispatch-verification.xlsx");
      toast.success("Dispatch verification data exported successfully");
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to export dispatch verification data");
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    { title: "Loads Ready for Dispatch", value: apiStats?.loadsReadyForDispatch ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Bundles Verified", value: apiStats?.bundlesVerified ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Bundles Missing", value: apiStats?.bundlesMissing ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Leads Dispatched Today", value: apiStats?.leadsDispatchedToday ?? 0, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Dispatch Verification</h1>
          <p className="text-sm font-medium text-gray-500 max-w-2xl">Verify bundles and truckload details before confirming dispatch from the plant.</p>
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
            onClick={() => {
              setSelectedId("");
              setIsConfirmOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#8B5CF6] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-100 hover:opacity-90 transition-all"
          >
            Confirm Dispatch
          </button>
          <button
            onClick={() => {
              setSelectedId("");
              setIsVerifyOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#6366F1] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-100 hover:opacity-90 transition-all"
          >
            Verify Load
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <ShieldCheck className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg mb-2" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight">{stat.value}</h3>
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
            placeholder="Search dispatch verification history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            width="200px"
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

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-gray-50 shadow-sm overflow-hidden flex flex-col min-h-[300px] justify-between">
        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 w-12">
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-md cursor-pointer hover:border-blue-400" />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Load ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Truck</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 cursor-pointer group">
                    Bundles <ArrowUpDown className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 cursor-pointer group">
                    Total Weight <ArrowUpDown className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
                      <p className="text-sm font-bold text-gray-500">Loading dispatch verification data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <p className="text-sm font-bold text-red-500">Error loading dispatch verification data. Please try again later.</p>
                  </td>
                </tr>
              ) : loads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <p className="text-sm font-bold text-gray-400">No dispatch loads found.</p>
                  </td>
                </tr>
              ) : (
                loads.map((row) => {
                  const targetLoadId = row.loadId || row._id || "";
                  return (
                    <tr key={targetLoadId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="w-5 h-5 border-2 rounded-md transition-all cursor-pointer border-gray-200 group-hover:border-blue-400" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-gray-900">{row.loadId}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                          {row.packingListNo ? `Packing List: ${row.packingListNo}` : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{row.truck || "-"}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-400">-</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{row.totalBundles ?? 0}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{formatWeight(row.totalWeight)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500">
                        <div>{row.destination || "-"}</div>
                        {row.project && (
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                            {row.project.projectName || "-"} ({row.project.jobId || "-"})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${row.weightVerified ? "text-emerald-600" : "text-amber-600"}`}>
                            {row.weightVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            Weight: {row.weightVerified ? "OK" : "Pending"}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${row.loadingVerified ? "text-emerald-600" : "text-amber-600"}`}>
                            {row.loadingVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            Loading: {row.loadingVerified ? "OK" : "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`
                          px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit
                          ${getStatusStyle(row.status)}
                        `}>
                          {formatStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedId(targetLoadId);
                            setIsModalOpen(true);
                          }}
                          className="bg-[#6366F1] text-white px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-sm"
                        >
                          View Load
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
        {!isLoading && !error && loads.length > 0 && (
          <div className="px-4 sm:px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 order-2 sm:order-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Show</p>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-blue-500 transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Results</p>
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className={`p-2 text-gray-300 hover:text-gray-900 transition-colors ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === pNum
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                        : "text-gray-400 hover:bg-white hover:text-gray-900"
                        }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className={`p-2 text-gray-300 hover:text-gray-900 transition-colors ${page === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DispatchDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loadId={selectedId}
      />

      {/* Confirm Dispatch Dialog */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[500px] bg-white rounded-[24px] p-8 flex flex-col shadow-2xl relative"
          >
            <h2 className="text-black text-center text-[28px] sm:text-[32px] font-bold mb-6 tracking-tight">
              Confirm Dispatch
            </h2>

            <div className="space-y-2 mb-8">
              <label htmlFor="confirm-load-id-input" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Enter Load ID
              </label>
              <input
                id="confirm-load-id-input"
                type="text"
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value)}
                placeholder="LOAD-001"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3 bg-[#CCCCCC] text-white rounded-xl text-sm font-bold hover:opacity-95 transition-all text-center"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedId?.trim()) {
                    toast.error("Please enter a Load ID");
                    return;
                  }
                  setIsModalOpen(true);
                  setIsConfirmOpen(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition-all text-center"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Load Dialog */}
      {isVerifyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsVerifyOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[500px] bg-white rounded-[24px] p-8 flex flex-col shadow-2xl relative"
          >
            <h2 className="text-black text-center text-[28px] sm:text-[32px] font-bold mb-6 tracking-tight">
              Verify Load
            </h2>

            <div className="space-y-2 mb-8">
              <label htmlFor="verify-load-id-input" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Enter Load ID
              </label>
              <input
                id="verify-load-id-input"
                type="text"
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value)}
                placeholder="LOAD-001"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsVerifyOpen(false)}
                className="flex-1 py-3 bg-[#CCCCCC] text-white rounded-xl text-sm font-bold hover:opacity-95 transition-all text-center"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedId?.trim()) {
                    toast.error("Please enter a Load ID");
                    return;
                  }
                  setIsModalOpen(true);
                  setIsVerifyOpen(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition-all text-center"
              >
                Verify Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
