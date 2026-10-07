import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getDashboardApi, getDashboardFiltersApi } from "../api/projects.api";
import type { DashboardQueryParams } from "../types/projects.types";
import StatsOverview from "../components/cards/StatCard";
import DashboardDonutChart from "../components/charts/DashboardDonutChart";
import Timeline from "../components/common/Timeline";
import RecentActivity from "../components/common/RecentActivity";
import ExportIcon from "../assets/exportIcon.svg";
import SuccessModal from "../components/common/SuccessModal";
import CustomSelect from "../components/common/CustomSelect";
import {
  ClockPlus,
  CalendarPlus,
  CalendarCheck2,
  FileText,
  Truck,
  Compass,
  TrendingUp,
} from "lucide-react";
import {
  ActiveConstructionSites,
  UpcomingDeadlines,
  FreightCarriers,
} from "../components/dashboard";
import { formatDateDisplay, formatStatusLabel } from "../utils/dashboard.utils";

export default function Dashboard() {
  const [successOpen, setSuccessOpen] = useState(false);

  // Filters state
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Date picker dropdown state
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(e.target as Node)
      ) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fetch dashboard filters
  const { data: filtersResponse, isLoading: isFiltersLoading } = useQuery({
    queryKey: ["dashboard-filters"],
    queryFn: getDashboardFiltersApi,
  });

  const filterData = filtersResponse?.data?.data;
  const filterProjects = filterData?.projects || [];
  const filterBuildings = filterData?.buildings || [];
  const filterStatuses = filterData?.statuses || [];

  // Options for project dropdown
  const projectOptions = useMemo(() => {
    const list = filterProjects.map((p) => ({
      label: `${p.projectName} (${p.jobId})`,
      value: p._id,
    }));
    return [{ label: "All Projects", value: "" }, ...list];
  }, [filterProjects]);

  // Options for buildings dropdown (filtered by selected project if any)
  const buildingOptions = useMemo(() => {
    const available = selectedProject
      ? filterBuildings.filter((b) => b.leadId === selectedProject)
      : filterBuildings;

    const list = available.map((b) => ({
      label: b.name || `Building ${b.buildingNumber}`,
      value: b._id,
    }));
    return [{ label: "All Buildings", value: "" }, ...list];
  }, [filterBuildings, selectedProject]);

  // Options for status dropdown
  const statusOptions = useMemo(() => {
    const list = filterStatuses.map((st) => ({
      label: formatStatusLabel(st),
      value: st,
    }));
    return [{ label: "All Statuses", value: "" }, ...list];
  }, [filterStatuses]);

  // Query params for dashboard API
  const queryParams = useMemo(() => {
    const params: DashboardQueryParams = {};
    if (selectedProject) params.projectId = selectedProject;
    if (selectedBuilding) params.buildingId = selectedBuilding;
    if (selectedStatus) params.status = selectedStatus;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return params;
  }, [selectedProject, selectedBuilding, selectedStatus, fromDate, toDate]);

  // 2. Fetch dashboard data
  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ["dashboard", queryParams],
    queryFn: () => getDashboardApi(queryParams),
  });

  const dashboardData = dashboardResponse?.data?.data;
  const projectStats = dashboardData?.projectStats;
  const deliveryOverview = dashboardData?.deliveryOverview;
  const materialOverview = dashboardData?.materialRequestOverview;
  const activeSitesList = dashboardData?.activeSites || [];
  const upcomingDeadlinesList = dashboardData?.upcomingDeadlines || [];
  const projectTimelineList = dashboardData?.projectTimelineOverall || [];
  const freightCarriers = dashboardData?.freightCarriers;

  const handleResetFilters = () => {
    setSelectedProject("");
    setSelectedBuilding("");
    setSelectedStatus("");
    setFromDate("");
    setToDate("");
    setDateDropdownOpen(false);
  };

  const handleDatePreset = (
    preset: "today" | "last7" | "last30" | "month" | "clear",
  ) => {
    if (preset === "clear") {
      setFromDate("");
      setToDate("");
    } else if (preset === "today") {
      const today = dayjs().format("YYYY-MM-DD");
      setFromDate(today);
      setToDate(today);
    } else if (preset === "last7") {
      setFromDate(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
      setToDate(dayjs().format("YYYY-MM-DD"));
    } else if (preset === "last30") {
      setFromDate(dayjs().subtract(30, "day").format("YYYY-MM-DD"));
      setToDate(dayjs().format("YYYY-MM-DD"));
    } else if (preset === "month") {
      setFromDate(dayjs().startOf("month").format("YYYY-MM-DD"));
      setToDate(dayjs().endOf("month").format("YYYY-MM-DD"));
    }
    setDateDropdownOpen(false);
  };

  // KPI cards
  const stats = [
    {
      key: "total",
      title: "Total Projects",
      value: isLoading ? "..." : (projectStats?.total ?? 0),
      iconBg: "#FA5A16",
      iconsvg: <ClockPlus size={18} className="text-white" strokeWidth={2.2} />,
      trend: {
        value: `${projectStats?.totalChangePctVsYesterday ?? 0}%`,
        label: "by Yesterday",
        isUp: (projectStats?.totalChangePctVsYesterday ?? 0) >= 0,
      },
    },
    {
      key: "ontrack",
      title: "On Track",
      value: isLoading ? "..." : (projectStats?.onTrack ?? 0),
      iconBg: "#18181B",
      iconsvg: <ClockPlus size={18} className="text-white" strokeWidth={2.2} />,
      trend: {
        value: `${projectStats?.onTrackPct ?? 0}%`,
        label: "on track",
        isUp: true,
      },
    },
    {
      key: "delayed",
      title: "Delayed",
      value: isLoading ? "..." : (projectStats?.delayed ?? 0),
      iconBg: "#2563EB",
      iconsvg: (
        <CalendarPlus size={18} className="text-white" strokeWidth={2.2} />
      ),
      trend: {
        value: `${projectStats?.delayedPct ?? 0}%`,
        label: "delayed",
        isUp: false,
      },
    },
    {
      key: "completed",
      title: "Completed",
      value: isLoading ? "..." : (projectStats?.completed ?? 0),
      iconBg: "#E91E63",
      iconsvg: (
        <CalendarCheck2 size={18} className="text-white" strokeWidth={2.2} />
      ),
      trend: {
        value: `${projectStats?.completedPct ?? 0}%`,
        label: "completed",
        isUp: (projectStats?.completedPct ?? 0) >= 0,
      },
    },
    {
      key: "rate",
      title: "Completion Rate",
      value: isLoading ? "..." : `${projectStats?.completionRate ?? 0}%`,
      iconBg: "#FA5A16",
      iconsvg: <ClockPlus size={18} className="text-white" strokeWidth={2.2} />,
      trend: {
        value: projectStats?.completionRateLabel || "Average Completion",
        label: "",
        isUp: true,
      },
    },
    {
      key: "deadlines",
      title: "Upcoming Deadlines",
      value: isLoading ? "..." : (projectStats?.upcomingDeadlines ?? 0),
      iconBg: "#EF4444",
      iconsvg: <ClockPlus size={18} className="text-white" strokeWidth={2.2} />,
      valueColor: "text-red-500",
      trend: { value: "Next", label: "30 days", isUp: true },
    },
  ];

  // Delivery Overview Donut
  const deliveryData = [
    {
      value: deliveryOverview?.delivered ?? 0,
      displayValue: `${deliveryOverview?.deliveredPct ?? 0}%`,
      name: "Delivered",
      color: "#1D51A4",
    },
    {
      value: deliveryOverview?.inTransit ?? 0,
      displayValue: `${deliveryOverview?.inTransitPct ?? 0}%`,
      name: "In Transit",
      color: "#F59E0B",
    },
    {
      value: deliveryOverview?.outForDelivery ?? 0,
      displayValue: `${deliveryOverview?.outForDeliveryPct ?? 0}%`,
      name: "Out for Delivery",
      color: "#EC4899",
    },
    {
      value: deliveryOverview?.delayed ?? 0,
      displayValue: `${deliveryOverview?.delayedPct ?? 0}%`,
      name: "Delayed",
      color: "#EF4444",
    },
  ];

  // Material Request Overview Donut
  const materialData = [
    {
      value: materialOverview?.approved ?? 0,
      displayValue: `${materialOverview?.approvedPct ?? 0}%`,
      name: "Approved",
      color: "#1D51A4",
    },
    {
      value: materialOverview?.pendingApproval ?? 0,
      displayValue: `${materialOverview?.pendingApprovalPct ?? 0}%`,
      name: "Pending Approval",
      color: "#F59E0B",
    },
    {
      value: materialOverview?.rejected ?? 0,
      displayValue: `${materialOverview?.rejectedPct ?? 0}%`,
      name: "Rejected",
      color: "#EC4899",
    },
    {
      value: materialOverview?.urgent ?? 0,
      displayValue: `${
        materialOverview?.total
          ? Math.round(
              ((materialOverview.urgent ?? 0) / materialOverview.total) * 1000,
            ) / 10
          : 0
      }%`,
      name: "Urgent Requests",
      color: "#EF4444",
    },
  ];

  // Project Timeline (Overall)
  const timelineSteps = useMemo(() => {
    if (projectTimelineList.length > 0) {
      return projectTimelineList.map((step) => ({
        title: step.label,
        date: step.date ? dayjs(step.date).format("DD/MM/YYYY") : "14/01/2024",
        status: (step.status?.toLowerCase() === "completed"
          ? "completed"
          : step.status?.toLowerCase() === "inprogress"
            ? "inprogress"
            : "upcoming") as "completed" | "inprogress" | "upcoming",
      }));
    }
    return [
      { title: "Planning", date: "14/01/2024", status: "completed" as const },
      { title: "Design", date: "14/01/2024", status: "completed" as const },
      {
        title: "Procurement",
        date: "14/01/2024",
        status: "completed" as const,
      },
      { title: "Execution", date: "14/01/2024", status: "inprogress" as const },
      { title: "Handover", date: "14/01/2024", status: "upcoming" as const },
    ];
  }, [projectTimelineList]);

  // Recent Activity (at most 5 activities, directly from API without fallback)
  const activities = useMemo(() => {
    const list = dashboardData?.recentActivity || [];
    return list.slice(0, 5).map((item, idx) => {
      let iconBg = "#E8F1FD";
      let icon = (
        <FileText size={18} className="text-blue-500" strokeWidth={2} />
      );

      if (item.type === "audit") {
        iconBg = "#F1EAFA";
        icon = (
          <Compass size={18} className="text-purple-500" strokeWidth={2} />
        );
      } else if (item.type === "production") {
        iconBg = "#FFF0E6";
        icon = (
          <TrendingUp size={18} className="text-orange-500" strokeWidth={2} />
        );
      } else if (item.type === "order" || item.type === "delivery") {
        iconBg = "#E8F8F0";
        icon = <Truck size={18} className="text-emerald-500" strokeWidth={2} />;
      }

      return {
        id: item.refId || `act-${idx}`,
        type: item.type,
        description: item.message,
        timestamp: item.occurredAt
          ? dayjs(item.occurredAt).format("hh:mm:ss A")
          : "-",
        iconBg,
        icon,
      };
    });
  }, [dashboardData]);

  // Date range label
  const dateRangeButtonLabel = useMemo(() => {
    if (fromDate && toDate) {
      return `${formatDateDisplay(fromDate)} - ${formatDateDisplay(toDate)}`;
    }
    if (fromDate) {
      return `From ${formatDateDisplay(fromDate)}`;
    }
    if (toDate) {
      return `Until ${formatDateDisplay(toDate)}`;
    }
    return "Date: Default (Today)";
  }, [fromDate, toDate]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Construction Department Performance
          </p>
        </div>
        <button
          onClick={() => setSuccessOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-md shadow-sm transition-colors text-sm flex items-center gap-2"
        >
          <img
            src={ExportIcon}
            alt=""
            className="w-4 h-4 brightness-0 invert"
          />
          Export Report
        </button>
      </div>

      {/* Stats Section */}
      <StatsOverview stats={stats} isLoading={isLoading} />

      {/* Filters Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-nowrap items-center gap-4">
        {/* Project Filter */}
        <div className="w-full xl:w-auto xl:flex-1 min-w-[200px]">
          <CustomSelect
            title="All Projects"
            options={projectOptions}
            value={selectedProject}
            onChange={(val) => {
              setSelectedProject(val);
              if (val && selectedBuilding) {
                const b = filterBuildings.find(
                  (item) => item._id === selectedBuilding,
                );
                if (b && b.leadId !== val) {
                  setSelectedBuilding("");
                }
              }
            }}
            width="100%"
            searchable
            loading={isFiltersLoading}
          />
        </div>

        {/* Building Filter */}
        <div className="w-full xl:w-auto xl:flex-1 min-w-[180px]">
          <CustomSelect
            title="All Buildings"
            options={buildingOptions}
            value={selectedBuilding}
            onChange={(val) => {
              setSelectedBuilding(val);
              if (val && !selectedProject) {
                const b = filterBuildings.find((item) => item._id === val);
                if (b?.leadId) {
                  setSelectedProject(b.leadId);
                }
              }
            }}
            width="100%"
            searchable
            loading={isFiltersLoading}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full xl:w-auto xl:flex-1 min-w-[180px]">
          <CustomSelect
            title="All Statuses"
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            width="100%"
            searchable
            loading={isFiltersLoading}
          />
        </div>

        {/* Date Range Selector with Popover */}
        <div
          ref={dateDropdownRef}
          className="relative w-full xl:w-auto xl:flex-1 min-w-[220px]"
        >
          <button
            type="button"
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            className={`bg-white border rounded text-xs sm:text-sm font-medium flex items-center justify-between w-full h-[40px] px-4 shadow-sm hover:bg-gray-50 transition-colors ${
              fromDate || toDate
                ? "border-blue-500 text-blue-700 font-semibold"
                : "border-gray-200 text-gray-700"
            }`}
          >
            <span className="truncate">{dateRangeButtonLabel}</span>
            <svg
              className={`w-4 h-4 ml-2 shrink-0 ${fromDate || toDate ? "text-blue-500" : "text-gray-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          {dateDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-xl z-50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Filter by Date
                </span>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => handleDatePreset("clear")}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear Dates
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDatePreset("today")}
                  className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("last7")}
                  className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("last30")}
                  className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("month")}
                  className="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium transition-colors"
                >
                  This Month
                </button>
              </div>

              {/* Custom Date Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setDateDropdownOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset / Restart Filter Button */}
        <button
          onClick={handleResetFilters}
          title="Reset all filters"
          className="xl:ml-auto flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded border border-gray-200 bg-white shadow-sm w-full sm:w-auto justify-center sm:justify-start hover:bg-gray-50 h-[40px]"
        >
          Restart
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Delivery Overview Donut */}
        <DashboardDonutChart
          title="Delivery Overview"
          total={deliveryOverview?.total ?? 0}
          data={deliveryData}
          subtitle={
            deliveryOverview?.scope === "today"
              ? "Today's Deliveries"
              : "Total Deliveries"
          }
        />

        {/* Material Request Overview Donut */}
        <DashboardDonutChart
          title="Material Request Overview"
          total={materialOverview?.total ?? 0}
          data={materialData}
          subtitle={`${materialOverview?.pendingApproval ?? 0} Pending`}
        />

        {/* Active Construction Sites Table */}
        <ActiveConstructionSites
          sites={activeSitesList}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <UpcomingDeadlines
          deadlines={upcomingDeadlinesList}
          isLoading={isLoading}
        />

        {/* Project Timeline (Overall) */}
        <Timeline steps={timelineSteps} />

        {/* Freight Carriers Table */}
        <FreightCarriers
          freightCarriers={freightCarriers}
          isLoading={isLoading}
        />

        {/* Recent Activity */}
        <RecentActivity activities={activities} />
      </div>

      <SuccessModal
        open={successOpen}
        title="Report Exported Successfully"
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}
