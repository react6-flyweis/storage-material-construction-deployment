import {
  Info,
  Truck,
  Package,
  CheckSquare,
  ChevronDown,
  Download,
  MapPin,
  Calendar,
  User,
  Clock,
  QrCode,
  Search,
  Filter,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getDeliveriesApi,
  getDeliveryFiltersApi,
  exportDeliveriesApi,
  markDeliveryReceivedApi,
  markDeliveryPartialApi,
} from "../api/projects.api";
import type { DeliveriesQueryParams } from "../types/projects.types";
import { downloadFileFromResponse } from "../lib/downloadUtils";
import ProjectSelector from "../components/common/ProjectSelector";
import CustomSelect from "../components/common/CustomSelect";
import UpdateSiteContactModal from "../components/common/UpdateSiteContactModal";
import ScanQRCodeModal from "../components/common/ScanQRCodeModal";
import BundleDetailsModal from "../components/common/BundleDetailsModal";
import DeliveryDetailsModal from "../components/materials/DeliveryDetailsModal";
import AddDeliveryDrawer from "../components/materials/AddDeliveryDrawer";
import MarkPartialModal from "../components/materials/MarkPartialModal";

const formatStatusText = (status?: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function DeliveryTracking() {
  // Pagination & sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("Latest");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [materialTypeFilter, setMaterialTypeFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [transporterFilter, setTransporterFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // UI state
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [updateContactOpen, setUpdateContactOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedProjectId, setScannedProjectId] = useState<string | undefined>();
  const [resultOpen, setResultOpen] = useState(false);
  const [scannedBundleId, setScannedBundleId] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<{ id: string; number: string } | null>(null);
  const [selectedContactDelivery, setSelectedContactDelivery] = useState<{
    id: string;
    number: string;
    projectName?: string;
  } | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch dropdown filter choices
  const { data: filtersResponse } = useQuery({
    queryKey: ["deliveryFilters"],
    queryFn: getDeliveryFiltersApi,
    staleTime: 5 * 60 * 1000,
  });

  const filterOptions = filtersResponse?.data?.data;

  // Build current query params
  const queryParams: DeliveriesQueryParams = useMemo(() => {
    const p: DeliveriesQueryParams = {
      page,
      limit,
      sortBy: sortBy || undefined,
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter) {
      p.status = statusFilter;
      p.deliveryStatus = statusFilter;
    }
    if (projectFilter) {
      p.leadId = projectFilter;
      p.projectId = projectFilter;
    }
    if (materialTypeFilter.trim()) p.materialType = materialTypeFilter.trim();
    if (destinationFilter.trim()) p.siteDestination = destinationFilter.trim();
    if (transporterFilter.trim()) p.transporter = transporterFilter.trim();
    if (driverFilter.trim()) p.driver = driverFilter.trim();
    if (startDateFilter) p.startDate = startDateFilter;
    if (endDateFilter) p.endDate = endDateFilter;
    return p;
  }, [
    page,
    limit,
    sortBy,
    debouncedSearch,
    statusFilter,
    projectFilter,
    materialTypeFilter,
    destinationFilter,
    transporterFilter,
    driverFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const queryClient = useQueryClient();

  const { data: deliveriesData, isLoading, isError, error } = useQuery({
    queryKey: ["deliveries", queryParams],
    queryFn: () => getDeliveriesApi(queryParams),
  });

  const markReceivedMutation = useMutation({
    mutationFn: markDeliveryReceivedApi,
    onSuccess: () => {
      toast.success("Delivery marked as received");
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to mark as received");
    },
  });

  const markPartialMutation = useMutation({
    mutationFn: ({ deliveryId, notes }: { deliveryId: string; notes?: string }) =>
      markDeliveryPartialApi(deliveryId, { notes }),
    onSuccess: () => {
      toast.success("Delivery marked as partially received");
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to mark partial");
    },
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await exportDeliveriesApi(queryParams);
      downloadFileFromResponse(res, "construction-deliveries.xlsx");
      toast.success("Deliveries exported successfully");
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || "Failed to export deliveries");
    } finally {
      setIsExporting(false);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setProjectFilter("");
    setMaterialTypeFilter("");
    setDestinationFilter("");
    setTransporterFilter("");
    setDriverFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setSortBy("Latest");
    setPage(1);
  };

  // Active filter count (excluding default page/limit/sortBy)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch.trim()) count++;
    if (statusFilter) count++;
    if (projectFilter) count++;
    if (materialTypeFilter.trim()) count++;
    if (destinationFilter.trim()) count++;
    if (transporterFilter.trim()) count++;
    if (driverFilter.trim()) count++;
    if (startDateFilter) count++;
    if (endDateFilter) count++;
    return count;
  }, [
    debouncedSearch,
    statusFilter,
    projectFilter,
    materialTypeFilter,
    destinationFilter,
    transporterFilter,
    driverFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const apiResponseData = deliveriesData?.data?.data;
  const apiStats = apiResponseData?.stats;
  const deliveriesList = apiResponseData?.deliveries || [];
  const total = apiResponseData?.total ?? deliveriesList.length;
  const totalPages = Math.ceil(total / limit) || 1;

  // Dropdown options
  const statusOptions = useMemo(() => {
    const rawStatuses = filterOptions?.deliveryStatuses || [
      "scheduled",
      "confirmed",
      "in_transit",
      "staged",
      "ready",
      "delivered",
      "bidding_sent",
      "carrier_selected",
    ];
    return [
      { label: "All Statuses", value: "" },
      ...rawStatuses.map((s) => ({
        label: formatStatusText(s),
        value: s,
      })),
    ];
  }, [filterOptions?.deliveryStatuses]);

  const sortOptions = useMemo(() => {
    const rawSorts = filterOptions?.sortBy || ["Latest", "Oldest", "Weight", "DeliveryDate"];
    return rawSorts.map((s) => ({ label: s, value: s }));
  }, [filterOptions?.sortBy]);

  const destinationOptions = useMemo(() => {
    const dests = filterOptions?.siteDestinations || [];
    return [
      { label: "All Destinations", value: "" },
      ...dests.map((d) => ({ label: d, value: d })),
    ];
  }, [filterOptions?.siteDestinations]);

  const transporterOptions = useMemo(() => {
    const trans = filterOptions?.transporters || [];
    return [
      { label: "All Transporters", value: "" },
      ...trans.map((t) => ({ label: t, value: t })),
    ];
  }, [filterOptions?.transporters]);

  const driverOptions = useMemo(() => {
    const drivers = filterOptions?.drivers || [];
    return [
      { label: "All Drivers", value: "" },
      ...drivers.map((d) => ({ label: d, value: d })),
    ];
  }, [filterOptions?.drivers]);

  const stats = [
    { label: "In Transit", value: apiStats?.inTransit ?? 0, icon: Truck, bg: "bg-[#1D51A4]", sub: "Arriving at Plant" },
    { label: "Staged", value: apiStats?.staged ?? 0, icon: Package, bg: "bg-[#3AB449]", sub: "At Plant/Yard" },
    { label: "Ready", value: apiStats?.ready ?? 0, icon: CheckSquare, bg: "bg-[#F97316]", sub: "For Departure" },
    { label: "Total Today", value: apiStats?.totalToday ?? 0, icon: Package, bg: "bg-[#4B5563]", sub: "All Deliveries" },
  ];

  const deliveries = deliveriesList.map((item) => {
    const badges = [];

    // Map API status to UI labels and bg
    let statusLabel = item.status || "-";
    let statusBg = "bg-gray-400 text-white";

    if (item.status === "in_transit") {
      statusLabel = "In Transit to Plant";
      statusBg = "bg-[#1D51A4] text-white";
    } else if (item.status === "staged") {
      statusLabel = "Staged at Plant";
      statusBg = "bg-[#3AB449] text-white";
    } else if (item.status === "ready") {
      statusLabel = "Ready for Departure";
      statusBg = "bg-[#F97316] text-white";
    } else if (item.status === "confirmed") {
      statusLabel = "Confirmed";
      statusBg = "bg-emerald-500 text-white";
    } else if (item.status === "delivered") {
      statusLabel = "Delivered";
      statusBg = "bg-gray-500 text-white";
    } else if (item.status === "bidding_sent") {
      statusLabel = "Bidding Sent";
      statusBg = "bg-blue-400 text-white";
    } else if (item.status === "carrier_selected") {
      statusLabel = "Carrier Selected";
      statusBg = "bg-purple-500 text-white";
    } else {
      statusLabel = formatStatusText(item.status);
    }

    badges.push({ label: statusLabel, bg: statusBg });

    // Show ETA badge if deliveryTime or timings exist
    if (item.schedule?.deliveryTime) {
      badges.push({
        label: `ETA ${item.schedule.deliveryTime}`,
        bg: "bg-[#FEFCE8] text-yellow-700",
        icon: Clock,
      });
    } else if (item.schedule?.timings) {
      badges.push({
        label: item.schedule.timings,
        bg: "bg-[#FEFCE8] text-yellow-700",
        icon: Clock,
      });
    }

    // Format load weight
    const formattedWeight = item.loadWeight
      ? `${Number(item.loadWeight).toLocaleString()} lbs`
      : "-";

    // Format pickup date/time
    let pickupStr = "-";
    if (item.schedule?.pickupDate) {
      const pDate = new Date(item.schedule.pickupDate);
      const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      const formattedDate = pDate.toLocaleDateString("en-US", dateOptions);
      pickupStr = `${formattedDate}${item.schedule.pickupTime ? `, ${item.schedule.pickupTime}` : ""}`;
    }

    // Format delivery date/time
    let deliveryStr = "-";
    if (item.schedule?.deliveryDate) {
      const dDate = new Date(item.schedule.deliveryDate);
      const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      const formattedDate = dDate.toLocaleDateString("en-US", dateOptions);
      deliveryStr = `${formattedDate}${item.schedule.deliveryTime ? `, ${item.schedule.deliveryTime}` : ""}`;
    }

    // Determine carrier info
    const carrierName = item.carrier?.email || item.carrier?.driverName || "-";
    const driverName = item.carrier?.driverName || "-";
    const truckId = item.carrier?.truckNumber || "-";
    const phone = item.carrier?.driverPhone || item.carrier?.phone || "-";

    return {
      deliveryId: item.deliveryId,
      status: item.status,
      id: item.deliveryNumber || "-",
      title: item.materialType || item.description || "Delivery",
      subtitle: item.project?.projectName || item.project?.jobId || "-",
      leadId: item.project?.leadId || "",
      badges,
      material: {
        qty: formattedWeight,
        area: item.stagingArea || "-",
      },
      schedule: {
        arrival: deliveryStr,
        departure: pickupStr,
      },
      carrier: {
        name: carrierName,
        address: item.deliveryLocation || "-",
      },
      truck: {
        id: truckId,
        driver: driverName,
        phone: phone,
      },
      notes: item.notes || "-",
    };
  });

  return (
    <div className="mx-auto pb-10 space-y-6">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Delivery Tracking
          </h1>
          <p className="text-[13px] font-bold text-gray-500">
            Read-only view of deliveries routed through plant/yard/warehouse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} rounded-xl p-4 text-white flex justify-between items-center shadow-lg shadow-blue-200/20`}
          >
            <div>
              <p className="text-[9px] font-bold opacity-70 uppercase mb-0.5 tracking-wider">
                {stat.label}
              </p>
              {isLoading ? (
                <div className="h-8 w-12 bg-white/20 rounded animate-pulse my-0.5" />
              ) : (
                <h3 className="text-2xl font-bold mb-0.5 tracking-tight">{stat.value}</h3>
              )}
              <p className="text-[9px] font-bold opacity-60 italic">{stat.sub}</p>
            </div>
            <div className="p-2.5 bg-white/20 rounded-lg">
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search delivery #, material, description, location..."
            className="w-full h-11 pl-10 pr-9 bg-white border border-gray-100 rounded-xl text-xs sm:text-sm font-semibold outline-none shadow-sm focus:border-blue-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter dropdown */}
          <CustomSelect
            title="Filter by Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            width="170px"
          />

          {/* Sort By selector */}
          <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm relative h-[40px] min-w-[150px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Sort:
            </span>
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
            <ChevronDown className="w-3.5 h-3.5 text-gray-900 absolute right-3 pointer-events-none" />
          </div>

          {/* Toggle Advanced Filters Drawer */}
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-2 px-4 h-[40px] rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
              isFilterExpanded || activeFiltersCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset Filters button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              title="Reset all filters"
              className="flex items-center gap-1.5 px-3 h-[40px] rounded-xl text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {isFilterExpanded && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Advanced Filters
            </h4>
            <button
              onClick={() => setIsFilterExpanded(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Project Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project</label>
              <ProjectSelector
                value={projectFilter}
                onChange={(val) => {
                  setProjectFilter(val);
                  setPage(1);
                }}
                showAllOption
                width="100%"
              />
            </div>

            {/* Material Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Material Type</label>
              <input
                type="text"
                placeholder="e.g. Steel, Roof Panels"
                value={materialTypeFilter}
                onChange={(e) => {
                  setMaterialTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[40px] px-3.5 bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none shadow-sm focus:border-blue-500 transition-all"
              />
            </div>

            {/* Site Destination */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Site Destination</label>
              {destinationOptions.length > 1 ? (
                <CustomSelect
                  title="All Destinations"
                  options={destinationOptions}
                  value={destinationFilter}
                  onChange={(val) => {
                    setDestinationFilter(val);
                    setPage(1);
                  }}
                  width="100%"
                  searchable
                />
              ) : (
                <input
                  type="text"
                  placeholder="Filter site location..."
                  value={destinationFilter}
                  onChange={(e) => {
                    setDestinationFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-[40px] px-3.5 bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none shadow-sm focus:border-blue-500 transition-all"
                />
              )}
            </div>

            {/* Transporter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transporter</label>
              {transporterOptions.length > 1 ? (
                <CustomSelect
                  title="All Transporters"
                  options={transporterOptions}
                  value={transporterFilter}
                  onChange={(val) => {
                    setTransporterFilter(val);
                    setPage(1);
                  }}
                  width="100%"
                  searchable
                />
              ) : (
                <input
                  type="text"
                  placeholder="Carrier / Transporter..."
                  value={transporterFilter}
                  onChange={(e) => {
                    setTransporterFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-[40px] px-3.5 bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none shadow-sm focus:border-blue-500 transition-all"
                />
              )}
            </div>

            {/* Driver */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Driver / Contact</label>
              {driverOptions.length > 1 ? (
                <CustomSelect
                  title="All Drivers"
                  options={driverOptions}
                  value={driverFilter}
                  onChange={(val) => {
                    setDriverFilter(val);
                    setPage(1);
                  }}
                  width="100%"
                  searchable
                />
              ) : (
                <input
                  type="text"
                  placeholder="Driver name..."
                  value={driverFilter}
                  onChange={(e) => {
                    setDriverFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-[40px] px-3.5 bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none shadow-sm focus:border-blue-500 transition-all"
                />
              )}
            </div>

            {/* Delivery Date: Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Date From</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[40px] px-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none shadow-sm focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>

            {/* Delivery Date: End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery Date To</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[40px] px-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold outline-none shadow-sm focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>

            {/* Reset actions in drawer */}
            <div className="flex items-end">
              <button
                onClick={resetAllFilters}
                className="w-full h-[40px] px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active:</span>
          {debouncedSearch && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium">
              Search: "{debouncedSearch}"
              <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSearch("")} />
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-medium">
              Status: {formatStatusText(statusFilter)}
              <X className="w-3 h-3 cursor-pointer hover:text-emerald-900" onClick={() => setStatusFilter("")} />
            </span>
          )}
          {projectFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-medium">
              Project Filtered
              <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => setProjectFilter("")} />
            </span>
          )}
          {materialTypeFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium">
              Material: {materialTypeFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" onClick={() => setMaterialTypeFilter("")} />
            </span>
          )}
          {destinationFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-medium">
              Destination: {destinationFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-amber-900" onClick={() => setDestinationFilter("")} />
            </span>
          )}
          {transporterFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg text-xs font-medium">
              Carrier: {transporterFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-sky-900" onClick={() => setTransporterFilter("")} />
            </span>
          )}
          {driverFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-medium">
              Driver: {driverFilter}
              <X className="w-3 h-3 cursor-pointer hover:text-rose-900" onClick={() => setDriverFilter("")} />
            </span>
          )}
          {(startDateFilter || endDateFilter) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-lg text-xs font-medium">
              Date: {startDateFilter || "Any"} to {endDateFilter || "Any"}
              <X
                className="w-3 h-3 cursor-pointer hover:text-teal-900"
                onClick={() => {
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
              />
            </span>
          )}
          <button
            onClick={resetAllFilters}
            className="text-xs font-bold text-gray-400 hover:text-red-500 underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-[#EFF6FF] border border-blue-100 rounded-[18px] p-4 flex items-start gap-3 shadow-sm">
        <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
          <Info className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-900 mb-0.5 uppercase tracking-tight">
            Read-Only Access
          </h4>
          <p className="text-[11px] font-bold text-blue-700 leading-relaxed opacity-80">
            This is a read-only view for plant coordination. You can view deliveries routed through the plant/yard/warehouse but cannot modify delivery information.
          </p>
        </div>
      </div>

      {/* Delivery Cards */}
      <div className="space-y-6">
        {isLoading ? (
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-[20px] shadow-sm border border-gray-50 overflow-hidden p-4 sm:p-6 animate-pulse"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
                <div className="flex items-start gap-4 w-full">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="h-5 w-48 bg-gray-200 rounded" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-4 bg-gray-200 rounded" />
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="h-9 w-28 bg-gray-200 rounded-lg self-start lg:self-auto w-full lg:w-auto" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[1, 2, 3, 4].map((col) => (
                  <div key={col} className="space-y-3">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="h-2 w-10 bg-gray-200 rounded" />
                          <div className="h-3.5 w-24 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="bg-white rounded-[20px] p-12 text-center border border-red-50 shadow-sm">
            <Package className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-red-900 mb-1">Failed to load deliveries</h3>
            <p className="text-xs text-red-500">{(error as any)?.message || "Please refresh or try again later."}</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 text-center border border-gray-50 shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-gray-900 mb-1">No Deliveries Found</h3>
            <p className="text-xs text-gray-500">
              {activeFiltersCount > 0
                ? "Try adjusting your search query or filter options."
                : "There are no deliveries scheduled or tracked currently."}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          deliveries.map((item, i) => (
            <div
              key={item.deliveryId || i}
              className="bg-white rounded-[20px] shadow-sm border border-gray-50 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                {/* Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#1D51A4] rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">
                          {item.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item?.badges?.map((badge, j) => {
                            const Icon = badge.icon;
                            return (
                              <span
                                key={j}
                                className={`${badge.bg} text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1`}
                              >
                                {Icon && <Icon className="w-2.5 h-2.5" />}
                                {badge.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="hidden sm:inline text-gray-200">|</span>
                        <p className="text-[10px] font-bold text-gray-900 leading-none">ID: {item.id}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDetailId(item.deliveryId);
                      setDetailsOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 rounded-lg text-[9px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-all shadow-sm w-full lg:w-auto"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                      Material Details
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Quantity</p>
                          <p className="text-[13px] font-bold text-gray-900">{item.material.qty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                            Staging Area
                          </p>
                          <p className="text-[13px] font-bold text-gray-900">{item.material.area}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                      Schedule
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Arrival</p>
                          <p className="text-[13px] font-bold text-gray-900">{item.schedule.arrival}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Departure</p>
                          <p className="text-[13px] font-bold text-gray-900">{item.schedule.departure}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                      Carrier & Route
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Carrier</p>
                          <p className="text-[13px] font-bold text-gray-900 leading-tight">{item.carrier.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Destination</p>
                          <p className="text-[13px] font-bold text-gray-900 leading-tight">{item.carrier.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">Notes</h5>
                      <div className="bg-[#FFFBEB] border border-yellow-100 rounded-xl p-3.5">
                        <p className="text-[11px] font-bold text-yellow-800 leading-tight">{item.notes}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Truck</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">{item.truck.id}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Driver</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">{item.truck.driver}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                            <p className="text-[8px] font-bold text-gray-900 leading-none">{item.truck.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {item.status !== "delivered" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => markReceivedMutation.mutate(item.deliveryId)}
                      disabled={markReceivedMutation.isPending}
                      className="bg-[#10B981] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      {markReceivedMutation.isPending ? "Marking..." : "Mark as Received"}
                    </button>
                    <button
                      onClick={() => {
                        setScannedProjectId(item.leadId);
                        setScanOpen(true);
                      }}
                      className="bg-[#F97316] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Scan QR Code
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDelivery({ id: item.deliveryId, number: item.id });
                        setPartialOpen(true);
                      }}
                      disabled={markPartialMutation.isPending}
                      className="bg-[#1D51A4] text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {markPartialMutation.isPending ? "Marking..." : "Partial Received"}
                    </button>
                  </div>
                )}

                {/* Links Footer */}
                <div className="flex items-center gap-3 border-t border-gray-50 pt-6">
                  <button
                    onClick={() => {
                      setSelectedContactDelivery({
                        id: item.deliveryId,
                        number: item.id,
                        projectName: item.subtitle,
                      });
                      setUpdateContactOpen(true);
                    }}
                    className="flex items-center gap-2 text-[9px] font-bold text-[#8B5CF6] border border-purple-50 rounded-lg px-4 py-2 uppercase tracking-wider hover:bg-purple-50 transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    Update Site Contact
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {!isLoading && !isError && total > 0 && (
        <div className="px-4 sm:px-6 py-4 bg-white rounded-2xl border border-gray-50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Show</span>
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
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Deliveries (Total: {total})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className={`p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${
                page === 1 ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                let pNum: number;
                if (totalPages <= 5) {
                  pNum = idx + 1;
                } else if (page <= 3) {
                  pNum = idx + 1;
                } else if (page >= totalPages - 2) {
                  pNum = totalPages - 4 + idx;
                } else {
                  pNum = page - 2 + idx;
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === pNum
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className={`p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${
                page >= totalPages ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <UpdateSiteContactModal
        open={updateContactOpen}
        onClose={() => {
          setUpdateContactOpen(false);
          setSelectedContactDelivery(null);
        }}
        deliveryId={selectedContactDelivery?.id}
        deliveryNumber={selectedContactDelivery?.number}
        projectName={selectedContactDelivery?.projectName}
      />
      <ScanQRCodeModal
        open={scanOpen}
        onClose={() => {
          setScanOpen(false);
          setScannedProjectId(undefined);
        }}
        projectId={scannedProjectId}
        onScanSuccess={(bundleId) => {
          setScannedBundleId(bundleId);
          setResultOpen(true);
        }}
      />
      <BundleDetailsModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        bundleId={scannedBundleId}
        onBack={() => {
          setResultOpen(false);
          setScanOpen(true);
        }}
      />
      <DeliveryDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedDetailId(null);
        }}
        deliveryId={selectedDetailId}
      />
      <AddDeliveryDrawer open={addDeliveryOpen} onClose={() => setAddDeliveryOpen(false)} />
      <MarkPartialModal
        open={partialOpen}
        onClose={() => {
          setPartialOpen(false);
          setSelectedDelivery(null);
        }}
        deliveryId={selectedDelivery?.id || ""}
        deliveryNumber={selectedDelivery?.number || ""}
        onConfirm={(notes) => {
          if (selectedDelivery) {
            markPartialMutation.mutate(
              { deliveryId: selectedDelivery.id, notes },
              {
                onSuccess: () => {
                  setPartialOpen(false);
                  setSelectedDelivery(null);
                },
              }
            );
          }
        }}
        isPending={markPartialMutation.isPending}
      />
    </div>
  );
}
