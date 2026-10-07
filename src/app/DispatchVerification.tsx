import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  Filter,
  Hourglass,
  Timer,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getDispatchVerificationApi,
  exportDispatchVerificationApi,
} from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import DispatchDetailModal from "../components/common/DispatchDetailModal";
import WaveStatCard from "../components/cards/WaveStatCard";
import toast from "react-hot-toast";

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusStyle = (status?: string) => {
  if (!status) return "bg-gray-50 text-gray-600 border-gray-100";
  const lowered = status.toLowerCase();
  if (lowered === "pending")
    return "bg-[#FEF3C7]/40 text-[#D97706] border-[#FDE68A]/60";
  if (lowered === "confirmed" || lowered === "verified")
    return "bg-[#D1FAE5]/40 text-[#059669] border-[#A7F3D0]/60";
  return "bg-blue-50 text-blue-600 border-blue-100";
};

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${weight.toLocaleString()} IBS`;
};

export default function DispatchVerification() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Oldest");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);
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

  // Handle outside click for filter popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "dispatchVerification",
      page,
      limit,
      debouncedSearch,
      sortBy,
      statusFilter,
    ],
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
    const rawSorts = enumsSortBy || [
      "Latest",
      "Oldest",
      "Weight",
      "PackingListNo",
    ];
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
      const errorMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(errorMsg || "Failed to export dispatch verification data");
    } finally {
      setIsExporting(false);
    }
  };

  const allSelected =
    loads.length > 0 &&
    loads.every((r) => selectedLoadIds.includes(r.loadId || r._id || ""));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedLoadIds((prev) =>
        prev.filter(
          (id) => !loads.some((r) => (r.loadId || r._id || "") === id),
        ),
      );
    } else {
      const newSelections = loads.map((r) => r.loadId || r._id || "");
      setSelectedLoadIds((prev) =>
        Array.from(new Set([...prev, ...newSelections])),
      );
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedLoadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Dispatch Verification
          </h1>
          <p className="text-xs sm:text-sm font-normal text-gray-500 mt-1 max-w-2xl">
            Verify bundles and truckload details before confirming dispatch from
            the plant.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <Upload className="w-4 h-4 text-gray-700" />
            )}
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setSelectedId("");
              setIsConfirmOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-md text-xs font-semibold shadow-xs transition-all"
          >
            <span>Confirm Dispatch</span>
          </button>
          <button
            onClick={() => {
              setSelectedId("");
              setIsVerifyOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs transition-all"
          >
            <span>Verify Load</span>
          </button>
        </div>
      </div>

      {/* Stats Grid using WaveStatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WaveStatCard
          title="Loads Ready for Dispatch"
          value={apiStats?.loadsReadyForDispatch ?? 0}
          trend="5.62%"
          isUp={true}
          theme="purple"
          isLoading={isLoading}
          icon={<ShieldCheck className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Bundles Verified"
          value={apiStats?.bundlesVerified ?? 0}
          trend="11.4%"
          isUp={true}
          theme="green"
          isLoading={isLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Bundles Missing"
          value={apiStats?.bundlesMissing ?? 0}
          trend="8.52%"
          isUp={true}
          theme="amber"
          isLoading={isLoading}
          icon={<Hourglass className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Leads Dispatched Today"
          value={apiStats?.leadsDispatchedToday ?? 0}
          trend="7.45%"
          isUp={false}
          theme="red"
          isLoading={isLoading}
          icon={<Timer className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dispatch verification history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 bg-white border border-gray-200 rounded-md text-xs font-normal text-gray-900 placeholder:text-gray-400 shadow-xs outline-none focus:border-indigo-400 w-48 sm:w-56 transition-colors"
            />
          </div>

          {/* Filter button with popover */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 h-8 bg-white border rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-colors cursor-pointer ${
                statusFilter && statusFilter !== "all"
                  ? "border-[#6366F1] text-[#6366F1]"
                  : "border-gray-200"
              }`}
            >
              <Filter
                className={`w-3.5 h-3.5 ${
                  statusFilter && statusFilter !== "all"
                    ? "text-[#6366F1]"
                    : "text-gray-500"
                }`}
              />
              <span>Filter</span>
              {statusFilter && statusFilter !== "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              )}
            </button>

            {filterOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-md shadow-lg border border-gray-100 py-1.5 z-30">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Filter by Status
                </div>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setPage(1);
                      setFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      statusFilter === opt.value
                        ? "bg-indigo-50 text-[#6366F1] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.value && (
                      <Check className="w-3.5 h-3.5 text-[#6366F1]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-1.5 text-xs text-gray-700 self-end sm:self-auto">
          <ArrowDownWideNarrow className="w-4 h-4 text-gray-700" />
          <span className="font-normal text-gray-800">Sort by :</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-transparent pr-4 text-xs font-semibold text-gray-900 outline-none cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-700 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-xs overflow-hidden flex flex-col min-h-[300px] justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[950px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 w-12 text-left">
                  <div
                    onClick={handleSelectAll}
                    className={`w-4 h-4 rounded-[3px] cursor-pointer transition-colors flex items-center justify-center ${
                      allSelected
                        ? "bg-[#6366F1] border border-[#6366F1] text-white"
                        : "border border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {allSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Load ID
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Truck
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Driver
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Bundles <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Total Weight{" "}
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Destination
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Verification
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-xs text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      <span>Loading dispatch verification data...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-xs text-red-500 font-medium">
                    Error loading dispatch verification data. Please try again later.
                  </td>
                </tr>
              ) : loads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-xs text-gray-500 font-medium">
                    No dispatch loads found.
                  </td>
                </tr>
              ) : (
                loads.map((row) => {
                  const targetLoadId = row.loadId || row._id || "";
                  return (
                    <tr
                      key={targetLoadId}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div
                          onClick={() => handleSelectRow(targetLoadId)}
                          className={`w-4 h-4 rounded-[3px] transition-all cursor-pointer flex items-center justify-center ${
                            selectedLoadIds.includes(targetLoadId)
                              ? "bg-[#6366F1] border border-[#6366F1] text-white"
                              : "border border-gray-300 hover:border-gray-400 bg-white"
                          }`}
                        >
                          {selectedLoadIds.includes(targetLoadId) && (
                            <Check className="w-3.5 h-3.5 stroke-3" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-normal">
                        {row.packingListNo || row.loadId || "-"}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                        {row.truck || "-"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-normal">
                        -
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900">
                        {row.totalBundles ?? 0}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900">
                        {formatWeight(row.totalWeight)}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-normal">
                        <div>{row.destination || "-"}</div>
                        {row.project && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {row.project.projectName || "-"} (
                            {row.project.jobId || "-"})
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                              row.weightVerified
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {row.weightVerified ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            Weight: {row.weightVerified ? "OK" : "Pending"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                              row.loadingVerified
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {row.loadingVerified ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            Loading: {row.loadingVerified ? "OK" : "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`
                            px-2 py-0.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 w-fit border
                            ${getStatusStyle(row.status)}
                          `}
                        >
                          {formatStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedId(targetLoadId);
                            setIsModalOpen(true);
                          }}
                          className="bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold px-3.5 py-1 rounded-md transition-colors shadow-xs cursor-pointer"
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
          <div className="px-5 py-3 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-normal">
              <span>Showing</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-gray-200 rounded-md px-2 py-0.5 text-xs font-medium text-gray-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>Results</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className={`w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 transition-colors ${
                  page === 1 ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-6 h-6 rounded-[4px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        page === pNum
                          ? "border border-[#6366F1] text-[#6366F1] bg-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-50"
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
                className={`w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 transition-colors ${
                  page === totalPages ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
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
            className="w-full max-w-[460px] bg-white rounded-lg p-6 flex flex-col shadow-2xl relative border border-gray-100"
          >
            <h2 className="text-gray-900 text-center text-xl font-bold mb-5 tracking-tight">
              Confirm Dispatch
            </h2>

            <div className="space-y-1.5 mb-6">
              <label
                htmlFor="confirm-load-id-input"
                className="block text-xs font-semibold text-gray-700"
              >
                Enter Load ID
              </label>
              <input
                id="confirm-load-id-input"
                type="text"
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value)}
                placeholder="LOAD-001"
                className="w-full h-10 px-3.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-900 outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition-all text-center"
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
                className="flex-1 py-2 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs hover:opacity-95 transition-all text-center"
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
            className="w-full max-w-[460px] bg-white rounded-lg p-6 flex flex-col shadow-2xl relative border border-gray-100"
          >
            <h2 className="text-gray-900 text-center text-xl font-bold mb-5 tracking-tight">
              Verify Load
            </h2>

            <div className="space-y-1.5 mb-6">
              <label
                htmlFor="verify-load-id-input"
                className="block text-xs font-semibold text-gray-700"
              >
                Enter Load ID
              </label>
              <input
                id="verify-load-id-input"
                type="text"
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value)}
                placeholder="LOAD-001"
                className="w-full h-10 px-3.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-900 outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsVerifyOpen(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-200 transition-all text-center"
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
                className="flex-1 py-2 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs hover:opacity-95 transition-all text-center"
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
