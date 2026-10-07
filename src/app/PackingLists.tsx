import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  ArrowDownWideNarrow,
  Filter,
  ListChecks,
  CheckCircle2,
  Hourglass,
  Timer,
  Loader2,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPackingListsApi, exportPackingListsApi } from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import PackingListDetailModal from "../components/common/PackingListDetailModal";
import WaveStatCard from "../components/cards/WaveStatCard";
import toast from "react-hot-toast";

const formatStatus = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatWeight = (weight?: number) => {
  if (weight === undefined || weight === null) return "-";
  return `${weight.toLocaleString()} IBS`;
};

export default function PackingLists() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Latest");
  const [statusFilter, setStatusFilter] = useState("confirmed");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedPackingListId, setSelectedPackingListId] = useState<string | null>(null);
  const [selectedPackingListIds, setSelectedPackingListIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    queryKey: ["packingLists", page, limit, debouncedSearch, sortBy, statusFilter],
    queryFn: () =>
      getPackingListsApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      }),
  });

  const apiData = data?.data?.data;
  const packingLists = apiData?.packingLists || [];
  const total = apiData?.total || 0;
  const apiStats = apiData?.stats;
  const enums = apiData?.enums;

  const totalPages = Math.ceil(total / limit) || 1;

  const enumsStatus = enums?.status;
  const enumsSortBy = enums?.sortBy;

  // DB status enum options
  const statusOptions = useMemo(() => {
    if (enumsStatus && enumsStatus.length > 0) {
      return [
        { label: "All Statuses", value: "" },
        ...enumsStatus.map((s) => ({ label: formatStatus(s), value: s })),
      ];
    }
    return [
      { label: "All Statuses", value: "" },
      { label: "Draft", value: "draft" },
      { label: "Confirmed", value: "confirmed" },
      { label: "Ready", value: "ready" },
      { label: "Loading", value: "loading" },
      { label: "Delivery Created", value: "delivery_created" },
      { label: "Dispatched", value: "dispatched" },
      { label: "Delivered", value: "delivered" },
      { label: "Cancelled", value: "cancelled" },
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
      const res = await exportPackingListsApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      });
      downloadFileFromResponse(res, "packing-lists.xlsx");
      toast.success("Packing lists exported successfully");
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to export packing lists");
    } finally {
      setIsExporting(false);
    }
  };

  const allSelected =
    packingLists.length > 0 &&
    packingLists.every((row) =>
      selectedPackingListIds.includes(row.packingListId),
    );

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPackingListIds((prev) =>
        prev.filter((id) => !packingLists.some((row) => row.packingListId === id)),
      );
    } else {
      const newSelections = packingLists.map((row) => row.packingListId);
      setSelectedPackingListIds((prev) =>
        Array.from(new Set([...prev, ...newSelections])),
      );
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedPackingListIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Packing List</h1>
          <p className="text-xs sm:text-sm font-normal text-gray-500 mt-1 max-w-2xl">
            View and manage packing lists for truckloads to verify bundles before loading and dispatch.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <Upload className="w-4 h-4 text-gray-700" />}
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid using WaveStatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WaveStatCard
          title="Total Packing List"
          value={apiStats?.totalPackingList ?? 0}
          trend="5.62%"
          isUp={true}
          theme="purple"
          isLoading={isLoading}
          icon={<ListChecks className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Loads Ready For Dispatch"
          value={apiStats?.loadsReadyForDispatch ?? 0}
          trend="11.4%"
          isUp={true}
          theme="green"
          isLoading={isLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Bundles Assigned"
          value={apiStats?.bundlesAssigned ?? 0}
          trend="8.52%"
          isUp={true}
          theme="amber"
          isLoading={isLoading}
          icon={<Hourglass className="w-5 h-5 text-white" />}
        />
        <WaveStatCard
          title="Leads Dispatch Today"
          value={apiStats?.loadsDispatchedToday ?? 0}
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
              placeholder="Search packing lists..."
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
                statusFilter
                  ? "border-[#6366F1] text-[#6366F1]"
                  : "border-gray-200"
              }`}
            >
              <Filter
                className={`w-3.5 h-3.5 ${
                  statusFilter ? "text-[#6366F1]" : "text-gray-500"
                }`}
              />
              <span>Filter</span>
              {statusFilter && (
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
                    {allSelected && <Check className="w-3 h-3 stroke-3" />}
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Packing List</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Project / Job</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Truck</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Bundles</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Total Weight</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Destination</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-xs text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      <span>Loading packing lists...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-xs text-red-500 font-medium">
                    Error loading packing lists. Please try again later.
                  </td>
                </tr>
              ) : packingLists.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-xs text-gray-500 font-medium">
                    No packing lists found.
                  </td>
                </tr>
              ) : (
                packingLists.map((row) => (
                  <tr key={row.packingListId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div
                        onClick={() => handleSelectRow(row.packingListId)}
                        className={`w-4 h-4 rounded-[3px] transition-all cursor-pointer flex items-center justify-center ${
                          selectedPackingListIds.includes(row.packingListId)
                            ? "bg-[#6366F1] border border-[#6366F1] text-white"
                            : "border border-gray-300 hover:border-gray-400 bg-white"
                        }`}
                      >
                        {selectedPackingListIds.includes(row.packingListId) && (
                          <Check className="w-3 h-3 stroke-3" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 font-normal">{row.packingListNo || "-"}</td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-semibold text-gray-900 leading-tight">{row.project?.projectName || "-"}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{row.project?.jobId || "-"}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-900 font-medium">{row.truck || "-"}</td>
                    <td className="px-5 py-3 text-xs text-gray-900 font-medium">{row.totalBundles ?? 0}</td>
                    <td className="px-5 py-3 text-xs text-gray-900 font-medium">{formatWeight(row.totalWeight)}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 font-normal">{row.destination || "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`
                        px-2 py-0.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 w-fit border
                        ${row.status === "confirmed" ? "bg-[#D1FAE5]/40 text-[#059669] border-[#A7F3D0]/60" : "bg-blue-50 text-blue-600 border-blue-100"}
                      `}>
                        <span>{formatStatus(row.status)}</span>
                        {row.status === "confirmed" && <CheckCircle2 className="w-3 h-3 text-[#10B981]" />}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPackingListId(row.packingListId);
                          setIsModalOpen(true);
                        }}
                        className="bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold px-3.5 py-1 rounded-md transition-colors shadow-xs cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !error && packingLists.length > 0 && (
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-6 h-6 rounded-[4px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                      page === p
                        ? "border border-[#6366F1] text-[#6366F1] bg-white shadow-xs"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      <PackingListDetailModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPackingListId(null);
        }}
        packingListId={selectedPackingListId}
      />
    </div>
  );
}
