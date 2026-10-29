import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { getProjectsApi } from "../../api/projects.api";
import type { Project } from "../../types/projects.types";
import { useSearch } from "../../context/SearchContext";
import { cn } from "@/lib/utils";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function formatStatus(status?: string): string {
  if (!status) return "In Progress";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getStatusBadgeClassName(status?: string): string {
  const s = status?.toLowerCase() || "";
  if (
    [
      "completed",
      "delivered",
      "deal_closed",
      "approved",
      "ready_for_delivery",
    ].includes(s)
  ) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
  }
  if (
    [
      "in_progress",
      "work_in_progress",
      "fabrication_started",
      "in_transit",
      "production_planning",
      "quality_inspection",
    ].includes(s)
  ) {
    return "bg-blue-50 text-blue-700 border border-blue-200/60";
  }
  if (
    [
      "scheduled",
      "pending",
      "material_check",
      "packing_bundling",
    ].includes(s)
  ) {
    return "bg-amber-50 text-amber-700 border border-amber-200/60";
  }
  if (["canceled", "cancelled", "rejected"].includes(s)) {
    return "bg-red-50 text-red-700 border border-red-200/60";
  }
  return "bg-gray-100 text-gray-700 border border-gray-200";
}

interface HeaderSearchProps {
  className?: string;
}

export function HeaderSearch({ className }: HeaderSearchProps) {
  const { search, setSearch } = useSearch();
  const [searchTerm, setSearchTerm] = useState(search);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Sync with SearchContext if changed externally
  useEffect(() => {
    setSearchTerm((prev) => (prev !== search ? search : prev));
  }, [search]);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const trimmedDebouncedSearch = debouncedSearch.trim();

  const { data, isLoading } = useQuery({
    queryKey: ["header-projects-search", trimmedDebouncedSearch],
    queryFn: () =>
      getProjectsApi({
        search: trimmedDebouncedSearch,
        page: 1,
        limit: 8,
      }),
    enabled: Boolean(trimmedDebouncedSearch),
    staleTime: 30000,
  });

  const projects: Project[] = trimmedDebouncedSearch
    ? data?.data?.data?.projects ?? []
    : [];

  const isDebouncing = searchTerm.trim() !== debouncedSearch.trim();
  const showLoading = isLoading || isDebouncing;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearch(value);
    if (!isOpen && value.trim()) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearch("");
    setIsOpen(false);
  };

  const handleSelectProject = (project: Project) => {
    setIsOpen(false);
    setSearchTerm("");
    setSearch("");
    const targetId = project._id || project.leadId;
    if (!targetId) return;

    navigate(`/projects/${targetId}`, {
      state: {
        projectId: targetId,
        projectCode: project.jobId,
        projectName:
          project.projectName ||
          `${project.buildingType || "Project"} - ${project.location || "Site"}`,
        location: project.location,
        buildingType: project.buildingType,
        status: project.lifecycleStatus
          ? project.lifecycleStatus.replace(/_/g, " ")
          : "In Progress",
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && projects.length > 0 && isOpen) {
      e.preventDefault();
      handleSelectProject(projects[0]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-[220px] sm:max-w-[280px] lg:max-w-[360px]",
        className
      )}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search projects..."
          className="h-[38px] pl-9 pr-8 bg-gray-50 border-gray-200 text-sm focus-visible:bg-white transition-colors rounded-[8px]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-[280px] sm:min-w-[340px]">
          {showLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span>Searching projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">
              No projects found
            </div>
          ) : (
            <div>
              <div className="px-3.5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80 border-b border-gray-100">
                Projects
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {projects.map((project) => {
                  const projectName =
                    project.projectName ||
                    `${project.buildingType || "Project"} - ${project.location || "Site"}`;
                  const locationInfo = [project.buildingType, project.location]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <li key={project._id || project.jobId}>
                      <button
                        type="button"
                        onClick={() => handleSelectProject(project)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 transition-colors flex flex-col gap-1 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {projectName}
                          </span>
                          {project.lifecycleStatus && (
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                                getStatusBadgeClassName(project.lifecycleStatus)
                              )}
                            >
                              {formatStatus(project.lifecycleStatus)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {project.jobId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 shrink-0">
                              #{project.jobId}
                            </span>
                          )}
                          <span className="truncate">
                            {locationInfo || "Construction Site"}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSearch;
