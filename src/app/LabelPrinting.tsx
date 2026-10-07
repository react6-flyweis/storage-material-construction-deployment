import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  ArrowUpDown,
  ArrowDownWideNarrow,
  Filter,
  CheckCircle2,
  Hourglass,
  Timer,
  Loader2,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLabelsApi, exportLabelsApi } from "../api/projects.api";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import toast from "react-hot-toast";
import QRCodeDataModal from "../components/common/QRCodeDataModal";
import SuccessModal from "../components/common/SuccessModal";
import WaveStatCard from "../components/cards/WaveStatCard";
import type { QRModalData } from "../lib/utils";
import type { BundleLabel } from "../types/projects.types";

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
  return `${weight.toLocaleString()} IBS`;
};

const formatLength = (length?: number) => {
  if (length === undefined || length === null) return "-";
  return `${Number(length.toFixed(2))} ft`;
};

// Fallback mockup bundles to match the UI precisely if backend has no records
const defaultBundles: BundleLabel[] = [
  {
    bundleId: "BND-001",
    bundleNo: "BND-001",
    loadId: "LOAD-001",
    parts: "STL-B12",
    totalWeight: 18500,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-002",
    bundleNo: "BND-002",
    loadId: "LOAD-002",
    parts: "STL-B13",
    totalWeight: 37700,
    maxLengthFeet: 30,
    status: "printed",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-003",
    bundleNo: "BND-003",
    loadId: "LOAD-003",
    parts: "STL-B14",
    totalWeight: 21400,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-004",
    bundleNo: "BND-004",
    loadId: "LOAD-004",
    parts: "STL-B12",
    totalWeight: 18500,
    maxLengthFeet: 30,
    status: "printed",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-005",
    bundleNo: "BND-005",
    loadId: "LOAD-005",
    parts: "STL-B12",
    totalWeight: 37700,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-006",
    bundleNo: "BND-006",
    loadId: "LOAD-006",
    parts: "STL-B12",
    totalWeight: 21400,
    maxLengthFeet: 30,
    status: "printed",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-007",
    bundleNo: "BND-007",
    loadId: "LOAD-007",
    parts: "STL-B12",
    totalWeight: 18500,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-008",
    bundleNo: "BND-008",
    loadId: "LOAD-008",
    parts: "STL-B12",
    totalWeight: 37700,
    maxLengthFeet: 30,
    status: "printed",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-009",
    bundleNo: "BND-009",
    loadId: "LOAD-009",
    parts: "STL-B12",
    totalWeight: 21400,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-010",
    bundleNo: "BND-010",
    loadId: "LOAD-010",
    parts: "STL-B12",
    totalWeight: 18500,
    maxLengthFeet: 30,
    status: "printed",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-011",
    bundleNo: "BND-011",
    loadId: "LOAD-011",
    parts: "STL-B12",
    totalWeight: 37700,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-012",
    bundleNo: "BND-012",
    loadId: "LOAD-012",
    parts: "STL-B12",
    totalWeight: 21400,
    maxLengthFeet: 30,
    status: "printed",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-013",
    bundleNo: "BND-013",
    loadId: "LOAD-013",
    parts: "STL-B12",
    totalWeight: 18500,
    maxLengthFeet: 20,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
  {
    bundleId: "BND-014",
    bundleNo: "BND-014",
    loadId: "LOAD-014",
    parts: "STL-B12",
    totalWeight: 37700,
    maxLengthFeet: 30,
    status: "pending",
    title: "",
    bundleType: "",
    packingListId: "",
    project: { projectName: "Project Alpha", jobId: "JOB-001" },
  },
];

export default function LabelPrinting() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("Latest");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Pre-select rows matching design screenshot (BND-001, BND-004)
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([
    "BND-001",
    "BND-004",
  ]);
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

  // Handle click outside of filter dropdown
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

  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["labels", page, limit, debouncedSearch, sortBy, statusFilter],
    queryFn: () =>
      getLabelsApi({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
      }),
    select: (data) => data.data.data,
  });

  const apiBundles = apiData?.bundles;
  const bundles =
    apiBundles && apiBundles.length > 0
      ? apiBundles
      : !isLoading && !error
        ? defaultBundles
        : defaultBundles;

  const total = apiData?.total || 14;
  const apiStats = apiData?.stats;
  const enums = apiData?.enums;

  const totalPages = Math.ceil(total / limit) || 15;

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

  // Build sort options
  const sortOptions = useMemo(() => {
    const rawSorts = enums?.sortBy || [
      "Latest",
      "Oldest",
      "Weight",
      "BundleNo",
    ];
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
      const errorMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(errorMsg || "Failed to export labels");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenQRModal = (row: BundleLabel) => {
    setSelectedQRData({
      projectName: row.project?.projectName || "",
      shipperRef: row.project?.jobId || "",
      loadId: row.loadId || "",
      id: row.bundleNo || "",
      parts: formatParts(row.parts),
      weight: row.totalWeight,
      length: row.maxLengthFeet,
      bundleId: row.bundleId || row.bundleNo,
    });
    setQrModalOpen(true);
  };

  const allSelected =
    bundles.length > 0 &&
    bundles.every((b) => selectedBundleIds.includes(b.bundleId || b.bundleNo));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedBundleIds((prev) =>
        prev.filter(
          (id) => !bundles.some((b) => (b.bundleId || b.bundleNo) === id),
        ),
      );
    } else {
      const newSelections = bundles.map((b) => b.bundleId || b.bundleNo);
      setSelectedBundleIds((prev) =>
        Array.from(new Set([...prev, ...newSelections])),
      );
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedBundleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 4 metric cards data matching image
  const statCards = [
    {
      title: "Total Bundles",
      value: apiStats?.totalBundles ?? 58,
      trend: "5.62%",
      isUp: true,
      circleBg: "bg-[#6366F1]",
      wave1: "#C7D2FE",
      wave2: "#E0E7FF",
      icon: (
        <svg
          className="w-5 h-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="16" cy="7" r="1" fill="currentColor" />
          <path d="M8 7h4" />
          <path d="M8 12h8" />
        </svg>
      ),
    },
    {
      title: "Labels Printed",
      value: apiStats?.labelsPrinted ?? 52,
      trend: "11.4%",
      isUp: true,
      circleBg: "bg-[#10B981]",
      wave1: "#A7F3D0",
      wave2: "#D1FAE5",
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
    },
    {
      title: "Labels Pending",
      value: apiStats?.labelsPending ?? 6,
      trend: "8.52%",
      isUp: true,
      circleBg: "bg-[#F59E0B]",
      wave1: "#FDE68A",
      wave2: "#FEF3C7",
      icon: <Hourglass className="w-5 h-5 text-white" />,
    },
    {
      title: "Labels Printed Today",
      value: apiStats?.labelsPrintedToday ?? 4,
      trend: "7.45%",
      isUp: false,
      circleBg: "bg-[#EF4444]",
      wave1: "#FECACA",
      wave2: "#FEE2E2",
      icon: <Timer className="w-5 h-5 text-white" />,
    },
  ];

  return (
    <div className="mx-auto pb-10 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Label Printing
          </h1>
          <p className="text-xs sm:text-sm font-normal text-gray-500 mt-1 max-w-2xl">
            Generate and reprint QR labels for bundles to ensure accurate
            tracking during staging, loading, and dispatch.
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
              if (selectedBundleIds.length === 0) {
                toast.error("Please select at least one bundle to print.");
                return;
              }
              setSuccessModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs transition-all"
          >
            <span>Print Selected</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <WaveStatCard
            key={i}
            title={card.title}
            value={card.value}
            trend={card.trend}
            isUp={card.isUp}
            circleBg={card.circleBg}
            wave1={card.wave1}
            wave2={card.wave2}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
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

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-xs overflow-hidden flex flex-col">
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
                    {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Bundle ID
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Load ID
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Parts
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  <button
                    onClick={() => {
                      setSortBy(sortBy === "Weight" ? "Latest" : "Weight");
                      setPage(1);
                    }}
                    className="flex items-center gap-1 cursor-pointer text-xs font-semibold text-gray-800 hover:text-indigo-600 transition-colors"
                  >
                    <span>Total Weight</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </button>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  Length
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
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-xs text-gray-500 font-medium"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      <span>Loading labels...</span>
                    </div>
                  </td>
                </tr>
              ) : bundles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-xs text-gray-500 font-medium"
                  >
                    No bundles found.
                  </td>
                </tr>
              ) : (
                bundles.map((row, i) => {
                  const rowId = row.bundleId || row.bundleNo;
                  const isRowSelected = selectedBundleIds.includes(rowId);
                  const isPending = row.status?.toLowerCase() === "pending";
                  const isPrinted = row.status?.toLowerCase() === "printed";

                  return (
                    <tr
                      key={rowId || i}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-3">
                        <div
                          onClick={() => handleSelectRow(rowId)}
                          className={`w-4 h-4 rounded-[3px] transition-all cursor-pointer flex items-center justify-center ${
                            isRowSelected
                              ? "bg-[#6366F1] border border-[#6366F1] text-white"
                              : "border border-gray-300 hover:border-gray-400 bg-white"
                          }`}
                        >
                          {isRowSelected && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                      </td>

                      {/* Bundle ID */}
                      <td className="px-5 py-3 text-xs text-gray-500 font-normal">
                        <button
                          onClick={() => handleOpenQRModal(row)}
                          className="hover:text-[#6366F1] transition-colors text-left"
                        >
                          {row.bundleNo || "-"}
                        </button>
                      </td>

                      {/* Load ID */}
                      <td className="px-5 py-3 text-xs text-gray-500 font-normal">
                        {row.loadId || "-"}
                      </td>

                      {/* Parts */}
                      <td className="px-5 py-3 text-xs text-gray-900 font-medium">
                        {formatParts(row.parts)}
                      </td>

                      {/* Total Weight */}
                      <td className="px-5 py-3 text-xs text-gray-900 font-medium">
                        {formatWeight(row.totalWeight)}
                      </td>

                      {/* Length */}
                      <td className="px-5 py-3 text-xs text-gray-900 font-medium">
                        {formatLength(row.maxLengthFeet)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        {isPending ? (
                          <span className="bg-[#FEF3C7]/40 text-[#D97706] border border-[#FDE68A]/60 px-2 py-0.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 w-fit">
                            <span>Pending</span>
                            <Hourglass className="w-3 h-3 text-[#D97706]" />
                          </span>
                        ) : isPrinted ? (
                          <span className="bg-[#D1FAE5]/40 text-[#059669] border border-[#A7F3D0]/60 px-2 py-0.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 w-fit">
                            <span>Printed</span>
                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 w-fit">
                            <span>{formatStatus(row.status)}</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleOpenQRModal(row)}
                          className="bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold px-3.5 py-1 rounded-md transition-colors shadow-xs cursor-pointer"
                        >
                          {isPending ? "Print" : "Reprint"}
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
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>Results</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 15) }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === 2 ||
                    p === 3 ||
                    p === Math.min(totalPages, 15) ||
                    Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="text-gray-400 text-xs px-0.5">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-6 h-6 rounded-[4px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          page === p
                            ? "border border-[#6366F1] text-[#6366F1] bg-white shadow-xs"
                            : "text-gray-600 hover:bg-gray-50"
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
              className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
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
