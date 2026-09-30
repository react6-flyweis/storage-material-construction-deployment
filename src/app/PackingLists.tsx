import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Download, ListChecks, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPackingListsApi, exportPackingListsApi } from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import CustomSelect from "../components/common/CustomSelect";
import PackingListDetailModal from "../components/common/PackingListDetailModal";
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
  return `${weight.toLocaleString()} LBS`;
};

export default function PackingLists() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Latest");
  const [statusFilter, setStatusFilter] = useState("confirmed");
  const [selectedPackingListId, setSelectedPackingListId] = useState<string | null>(null);
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

  const stats = [
    { title: "Total Packing List", value: apiStats?.totalPackingList ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Loads Ready For Dispatch", value: apiStats?.loadsReadyForDispatch ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Bundles Assigned", value: apiStats?.bundlesAssigned ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Leads Dispatch Today", value: apiStats?.loadsDispatchedToday ?? 0, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Packing List</h1>
          <p className="text-sm font-medium text-gray-500 max-w-2xl">View and manage packing lists for truckloads to verify bundles before loading and dispatch.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
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
                <ListChecks className={`w-5 h-5 ${stat.color}`} />
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
            placeholder="Search packing lists..."
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
            width="190px"
          />

          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center justify-between sm:justify-start gap-3 shadow-sm relative h-[40px] min-w-[160px]">
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
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Packing List</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Project / Job</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Truck</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bundles</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Weight</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm font-bold text-gray-500">Loading packing lists...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <p className="text-sm font-bold text-red-500">Error loading packing lists. Please try again later.</p>
                  </td>
                </tr>
              ) : packingLists.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <p className="text-sm font-bold text-gray-400">No packing lists found.</p>
                  </td>
                </tr>
              ) : (
                packingLists.map((row) => (
                  <tr key={row.packingListId} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="w-5 h-5 border-2 rounded-md transition-all cursor-pointer border-gray-200 group-hover:border-blue-400" />
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-900">{row.packingListNo || "-"}</td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-gray-900">{row.project?.projectName || "-"}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{row.project?.jobId || "-"}</div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-900">{row.truck || "-"}</td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-900">{row.totalBundles ?? 0}</td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-900">{formatWeight(row.totalWeight)}</td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-500">{row.destination || "-"}</td>
                    <td className="px-6 py-5">
                      <span className={`
                        px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit
                        ${row.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}
                      `}>
                        {formatStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPackingListId(row.packingListId);
                          setIsModalOpen(true);
                        }}
                        className="bg-[#1D51A4] text-white px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-sm"
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
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Results</p>
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 text-gray-300 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === p
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                      : "text-gray-400 hover:bg-white hover:text-gray-900"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 text-gray-300 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
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
