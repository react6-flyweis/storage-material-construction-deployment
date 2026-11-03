import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  ArrowUpDown,
  ArrowDownWideNarrow,
  Package,
  Check,
  Filter,
  CheckCircle2,
  Hourglass,
  Timer,
} from "lucide-react";
import WaveStatCard from "../components/cards/WaveStatCard";

export default function LoadStaging() {
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Latest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter popover on outside click
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

  const stats = [
    {
      title: "Loads in Staging",
      value: "8",
      trend: "5.62%",
      isUp: true,
      theme: "purple" as const,
      icon: <Package className="w-5 h-5 text-white" />,
    },
    {
      title: "Loads Ready",
      value: "2",
      trend: "11.4%",
      isUp: true,
      theme: "green" as const,
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
    },
    {
      title: "Bundles Staged",
      value: "45",
      trend: "8.52%",
      isUp: true,
      theme: "amber" as const,
      icon: <Hourglass className="w-5 h-5 text-white" />,
    },
    {
      title: "Staging Delay",
      value: "1.2h",
      trend: "7.45%",
      isUp: false,
      theme: "red" as const,
      icon: <Timer className="w-5 h-5 text-white" />,
    },
  ];

  const loads = [
    {
      id: "LOAD-001",
      truck: "TX-4582",
      bundles: 5,
      weight: "18,500 IBS",
      project: "Riverside Complex",
      status: "Staging",
    },
    {
      id: "LOAD-002",
      truck: "TX-2345",
      bundles: 8,
      weight: "37,700 IBS",
      project: "Tech Park Dev",
      status: "Ready",
    },
    {
      id: "LOAD-003",
      truck: "TX-4582",
      bundles: 6,
      weight: "21,400 IBS",
      project: "Downtown Plaza",
      status: "Staging",
    },
    {
      id: "LOAD-004",
      truck: "TX-2345",
      bundles: 5,
      weight: "18,500 IBS",
      project: "Riverside Complex",
      status: "Ready",
    },
    {
      id: "LOAD-005",
      truck: "TX-4582",
      bundles: 8,
      weight: "37,700 IBS",
      project: "Tech Park Dev",
      status: "Staging",
    },
    {
      id: "LOAD-006",
      truck: "TX-2345",
      bundles: 6,
      weight: "21,400 IBS",
      project: "Downtown Plaza",
      status: "Ready",
    },
    {
      id: "LOAD-007",
      truck: "TX-4582",
      bundles: 3,
      weight: "18,500 IBS",
      project: "Riverside Complex",
      status: "Staging",
    },
    {
      id: "LOAD-008",
      truck: "TX-2345",
      bundles: 4,
      weight: "37,700 IBS",
      project: "Tech Park Dev",
      status: "Ready",
    },
    {
      id: "LOAD-009",
      truck: "TX-4582",
      bundles: 2,
      weight: "21,400 IBS",
      project: "Downtown Plaza",
      status: "Planning",
    },
    {
      id: "LOAD-010",
      truck: "TX-2345",
      bundles: 4,
      weight: "18,500 IBS",
      project: "Riverside Complex",
      status: "Ready",
    },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Staging", value: "Staging" },
    { label: "Ready", value: "Ready" },
    { label: "Planning", value: "Planning" },
  ];

  const sortOptions = [
    { label: "Latest", value: "Latest" },
    { label: "Oldest", value: "Oldest" },
    { label: "Weight", value: "Weight" },
  ];

  const filteredLoads = loads.filter((load) => {
    const matchesSearch =
      search === "" ||
      load.id.toLowerCase().includes(search.toLowerCase()) ||
      load.truck.toLowerCase().includes(search.toLowerCase()) ||
      load.project.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || load.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allSelected =
    filteredLoads.length > 0 &&
    filteredLoads.every((r) => selectedLoadIds.includes(r.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedLoadIds((prev) =>
        prev.filter((id) => !filteredLoads.some((r) => r.id === id)),
      );
    } else {
      setSelectedLoadIds(filteredLoads.map((r) => r.id));
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
            Load Staging
          </h1>
          <p className="text-xs sm:text-sm font-normal text-gray-500 mt-1 max-w-2xl">
            Monitor and manage material loads currently in the staging process for upcoming deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-all">
            <Upload className="w-4 h-4 text-gray-700" />
            <span>Export</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-md text-xs font-semibold shadow-xs transition-all">
            <span>Create Staging Plan</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <WaveStatCard
            key={i}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            isUp={stat.isUp}
            theme={stat.theme}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staging loads..."
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
              onChange={(e) => setSortBy(e.target.value)}
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
                    {allSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Load ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Truck</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Bundles <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Total Weight <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Project / Site</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-left">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-800 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoads.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div
                      onClick={() => handleSelectRow(row.id)}
                      className={`w-4 h-4 rounded-[3px] transition-all cursor-pointer flex items-center justify-center ${
                        selectedLoadIds.includes(row.id)
                          ? "bg-[#6366F1] border border-[#6366F1] text-white"
                          : "border border-gray-300 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {selectedLoadIds.includes(row.id) && (
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-normal">{row.id}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-900">{row.truck}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-900">{row.bundles}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-900">{row.weight}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 leading-tight">{row.project}</td>
                  <td className="px-5 py-3">
                    <span className={`
                      px-2 py-0.5 rounded-[4px] text-[11px] font-medium flex items-center gap-1.5 w-fit border
                      ${row.status === "Staging"
                        ? "bg-[#FEF3C7]/40 text-[#D97706] border-[#FDE68A]/60"
                        : row.status === "Ready"
                        ? "bg-[#D1FAE5]/40 text-[#059669] border-[#A7F3D0]/60"
                        : "bg-blue-50 text-blue-600 border-blue-100"}
                    `}>
                      <span>{row.status}</span>
                      {row.status === "Staging" && <Hourglass className="w-3 h-3 text-[#D97706]" />}
                      {row.status === "Ready" && <CheckCircle2 className="w-3 h-3 text-[#10B981]" />}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button className="bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold px-3.5 py-1 rounded-md transition-colors shadow-xs cursor-pointer">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-normal">
            <span>Showing</span>
            <select className="bg-white border border-gray-200 rounded-md px-2 py-0.5 text-xs font-medium text-gray-700 outline-none cursor-pointer">
              <option>10</option>
            </select>
            <span>Results</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 rounded-[4px] text-xs font-semibold border border-[#6366F1] text-[#6366F1] bg-white shadow-xs">
                1
              </button>
              <button className="w-6 h-6 rounded-[4px] text-xs font-semibold text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="w-6 h-6 rounded-[4px] text-xs font-semibold text-gray-600 hover:bg-gray-50">
                3
              </button>
            </div>
            <button className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-[4px] text-gray-400 hover:text-gray-700 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
