import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Download, ArrowUpDown, Tag, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLabelsApi, exportLabelsApi } from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import CustomSelect from "../components/common/CustomSelect";
import toast from "react-hot-toast";
import QRCodeDataModal from "../components/common/QRCodeDataModal";
import SuccessModal from "../components/common/SuccessModal";
import type { QRModalData } from "../lib/utils";


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

const formatLength = (length?: number) => {
  if (length === undefined || length === null) return "-";
  return `${Number(length.toFixed(2))} ft`;
};

export default function LabelPrinting() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Latest");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState<QRModalData | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
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
    queryKey: ["labels", page, limit, debouncedSearch, sortBy, statusFilter],
    queryFn: () =>
      getLabelsApi({
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

  // Build status options from enums or defaults
  const statusOptions = useMemo(() => {
    if (enums?.labelStatus || enums?.bundleStatus) {
      const opts = [{ label: "All Statuses", value: "" }];
      if (enums.labelStatus) {
        enums.labelStatus.forEach((s) => {
          opts.push({ label: formatStatus(s), value: s });
        });
      }
      if (enums.bundleStatus) {
        enums.bundleStatus.forEach((s) => {
          if (!opts.some((o) => o.value === s)) {
            opts.push({ label: formatStatus(s), value: s });
          }
        });
      }
      return opts;
    }
    return [
      { label: "All Statuses", value: "" },
      { label: "Pending (Not Printed)", value: "pending" },
      { label: "Printed", value: "printed" },
      { label: "Draft", value: "draft" },
      { label: "Confirmed", value: "confirmed" },
      { label: "Assigned to Truck", value: "assigned_to_truck" },
      { label: "Staged", value: "staged" },
      { label: "Loaded", value: "loaded" },
    ];
  }, [enums]);

  // Build sort options from enums or defaults
  const sortOptions = useMemo(() => {
    const rawSorts = enums?.sortBy || ["Latest", "Oldest", "Weight", "BundleNo"];
    return rawSorts.map((s) => ({ label: s, value: s }));
  }, [enums?.sortBy]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await exportLabelsApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      });
      downloadFileFromResponse(res, "bundle-labels.xlsx");
      toast.success("Labels exported successfully");
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to export labels");
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    { title: "Total Bundles", value: apiStats?.totalBundles ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Labels Printed", value: apiStats?.labelsPrinted ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Labels Pending", value: apiStats?.labelsPending ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Labels Printed Today", value: apiStats?.labelsPrintedToday ?? 0, color: "text-red-600", bg: "bg-red-50" },
  ];

  // Check if all visible bundles are selected
  const allSelected = bundles.length > 0 && bundles.every(b => selectedBundleIds.includes(b.bundleId || b.bundleNo));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedBundleIds(prev => prev.filter(id => !bundles.some(b => (b.bundleId || b.bundleNo) === id)));
    } else {
      const newSelections = bundles.map(b => b.bundleId || b.bundleNo);
      setSelectedBundleIds(prev => Array.from(new Set([...prev, ...newSelections])));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedBundleIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Label Printing</h1>
          <p className="text-sm font-medium text-gray-500 max-w-2xl">Generate and reprint QR labels for bundles to ensure accurate tracking during staging, loading, and dispatch.</p>
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
              if (selectedBundleIds.length === 0) {
                toast.error("Please select at least one bundle to print.");
                return;
              }
              setSuccessModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#6366F1] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-100 hover:opacity-90 transition-all"
          >
            Print Selected
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
                <Tag className={`w-5 h-5 ${stat.color}`} />
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
            placeholder="Search bundles, loads, or parts..."
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
      <div className="bg-white rounded-[24px] border border-gray-50 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 w-12">
                  <div
                    onClick={handleSelectAll}
                    className={`w-5 h-5 border-2 rounded-md cursor-pointer hover:border-blue-400 transition-colors ${allSelected ? "bg-[#6366F1] border-[#6366F1]" : "border-gray-200"
                      }`}
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bundle ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Load ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Parts</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 cursor-pointer group">
                    Total Weight <ArrowUpDown className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Length</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 font-medium">
                    Loading labels...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-red-500 font-medium">
                    Failed to load labels. Please try again.
                  </td>
                </tr>
              ) : bundles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 font-medium">
                    No bundles found.
                  </td>
                </tr>
              ) : (
                bundles.map((row, i) => {
                  const rowId = row.bundleId || row.bundleNo;
                  const isRowSelected = selectedBundleIds.includes(rowId);
                  return (
                    <tr key={rowId || i} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div
                          onClick={() => handleSelectRow(rowId)}
                          className={`w-5 h-5 border-2 rounded-md transition-all cursor-pointer ${isRowSelected ? "bg-[#6366F1] border-[#6366F1]" : "border-gray-200 group-hover:border-blue-400"
                            }`}
                        />
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">
                        <button
                          onClick={() => {
                            setSelectedQRData({
                              projectName: row.project?.projectName || "",
                              shipperRef: row.project?.jobId || "",
                              loadId: row.packingListId || "",
                              id: row.bundleNo || "",
                              parts: formatParts(row.parts),
                              weight: row.totalWeight,
                              length: row.maxLengthFeet,
                              bundleId: row.bundleId || row.bundleNo,
                            });
                            setQrModalOpen(true);
                          }}
                          className="hover:text-[#6366F1] transition-colors underline text-left"
                        >
                          {row.bundleNo || "-"}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-400">{row.packingListId || "-"}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{formatParts(row.parts)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">{formatWeight(row.totalWeight)}</td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500">{formatLength(row.maxLengthFeet)}</td>
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
                            setSelectedQRData({
                              projectName: row.project?.projectName || "",
                              shipperRef: row.project?.jobId || "",
                              loadId: row.packingListId || "",
                              id: row.bundleNo || "",
                              parts: formatParts(row.parts),
                              weight: row.totalWeight,
                              length: row.maxLengthFeet,
                              bundleId: row.bundleId || row.bundleNo,
                            });
                            setQrModalOpen(true);
                          }}
                          className={`
                            px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm
                            ${row.status === "pending" ? "bg-[#6366F1] text-white hover:bg-blue-800" : "bg-white border border-gray-100 text-blue-600 hover:bg-gray-50"}
                          `}
                        >
                          {row.status === "pending" ? "Print" : "Reprint"}
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
                          ? "bg-[#6366F1] text-white shadow-lg shadow-blue-100"
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
      <QRCodeDataModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        data={selectedQRData}
      />
      <SuccessModal
        open={successModalOpen}
        title={`${selectedBundleIds.length} labels printed successfully`}
        onClose={() => {
          setSuccessModalOpen(false);
          setSelectedBundleIds([]);
        }}
      />
    </div>
  );
}
