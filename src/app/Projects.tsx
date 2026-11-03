import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Calendar from "../components/calendar/Calendar";
import {
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import MaterialRequestDetailsModal from "../components/materials/MaterialRequestDetailsModal";
import AddDeliveryDrawer from "../components/materials/AddDeliveryDrawer";
import { useQuery } from "@tanstack/react-query";
import { getProjectsApi } from "../api/projects.api";
import type { Project } from "../types/projects.types";
import ProjectSelector from "../components/common/ProjectSelector";

const getStatusDisplay = (status?: string) => {
  if (!status)
    return <span className="text-gray-400 font-medium text-sm">-</span>;

  const s = status.toLowerCase();
  let color = "text-amber-500";
  let label = status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (
    ["completed", "delivered", "deal_closed", "ready_for_delivery"].includes(s)
  ) {
    color = "text-emerald-500";
    if (s === "delivered" || s === "deal_closed") label = "Completed";
  } else if (["canceled", "cancelled", "rejected"].includes(s)) {
    color = "text-red-500";
    label = "Canceled";
  } else if (
    [
      "work_in_progress",
      "in_progress",
      "fabrication_started",
      "material_check",
      "production_planning",
    ].includes(s)
  ) {
    color = "text-amber-500";
    if (s === "in_progress" || s === "work_in_progress")
      label = "Work in Progress";
  } else {
    color = "text-amber-500";
  }

  return <span className={`text-sm font-medium ${color}`}>{label}</span>;
};

const getPriorityBadge = (priority?: string, status?: string) => {
  let p = (priority || "").toLowerCase();

  // If priority isn't provided by backend, infer sensible default from status
  if (!p) {
    if (
      [
        "fabrication_started",
        "quality_inspection",
        "ready_for_delivery",
      ].includes(status || "")
    ) {
      p = "high";
    } else if (
      ["initial_contact", "requirements_gathered", "negotiation"].includes(
        status || "",
      )
    ) {
      p = "low";
    } else {
      p = "medium";
    }
  }

  let className = "bg-[#FEF3C7] text-[#D97706]";
  let label = "Medium";

  if (p === "urgent" || p === "high") {
    className = "bg-[#FEE2E2] text-[#EF4444]";
    label = p === "urgent" ? "Urgent" : "High";
  } else if (p === "low") {
    className = "bg-[#EFF6FF] text-[#3B82F6]";
    label = "Low";
  } else {
    className = "bg-[#FEF3C7] text-[#D97706]";
    label = "Medium";
  }

  return (
    <span
      className={`inline-block min-w-[68px] text-center px-3 py-0.5 rounded text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
};

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "project">(
    searchParams.get("tab") === "project" ? "project" : "calendar",
  );
  const [toggle, setToggle] = useState(false);

  // Pagination state (default limit 10 to match reference UI)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedCalendarProjectId, setSelectedCalendarProjectId] =
    useState<string>(searchParams.get("projectId") || "");
  const [selectedProjectObj, setSelectedProjectObj] = useState<Project | null>(
    null,
  );

  // Query for paginated projects list with hasDelivery=true
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", page, limit, true],
    queryFn: () =>
      getProjectsApi({
        page,
        limit,
        hasDelivery: true,
      }),
    enabled: activeTab === "project",
  });

  // Query for calendar dropdown projects list (all projects so user can view any project)
  const { data: dropdownData } = useQuery({
    queryKey: ["projects-dropdown"],
    queryFn: () => getProjectsApi({ page: 1, limit: 100 }),
    enabled: activeTab === "calendar",
  });

  const projectsResponse = data?.data?.data;
  const projects = projectsResponse?.projects || [];
  const total = projectsResponse?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const dropdownProjects = dropdownData?.data?.data?.projects || [];
  const selectedProjObj =
    selectedProjectObj ||
    dropdownProjects.find(
      (p: Project) =>
        p._id === selectedCalendarProjectId ||
        p.leadId === selectedCalendarProjectId,
    ) ||
    null;
  const leadIdToPass =
    selectedProjObj?.leadId || selectedCalendarProjectId || "";

  const handleViewProject = (project: Project) => {
    const targetId = project._id || project.leadId;
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Projects and Calendar
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Construction Department Performance
          </p>
        </div>
        <div className="flex items-center">
          <div className="bg-[#F3F4F6] p-1 rounded-md flex gap-1">
            <button
              onClick={() => {
                setActiveTab("calendar");
                setSearchParams({ tab: "calendar" });
              }}
              className={`px-7 py-2 rounded text-sm font-medium transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => {
                setActiveTab("project");
                setSearchParams({ tab: "project" });
              }}
              className={`px-7 py-2 rounded text-sm font-medium transition-all cursor-pointer ${
                activeTab === "project"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Project
            </button>
          </div>
        </div>
      </div>

      {activeTab === "calendar" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">Project</span>
            <ProjectSelector
              value={selectedCalendarProjectId}
              onChange={(val, proj) => {
                setSelectedCalendarProjectId(val);
                setSelectedProjectObj(proj || null);
                if (val) {
                  setSearchParams({ tab: "calendar", projectId: val });
                } else {
                  setSearchParams({ tab: "calendar" });
                }
              }}
              showAllOption
              width="320px"
            />
          </div>
          <button
            onClick={() => setToggle(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-base leading-none font-normal">+</span> Add
            Delivery
          </button>
        </div>
      )}

      {activeTab === "calendar" ? (
        <div className="min-h-150">
          <Calendar
            leadId={leadIdToPass}
            projectId={selectedCalendarProjectId}
            selectedProject={selectedProjObj}
            onClearProject={() => {
              setSelectedCalendarProjectId("");
              setSelectedProjectObj(null);
              setSearchParams({ tab: "calendar" });
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Project List Card - crisp, clean, not rounded */}
          <div className="bg-white rounded-md shadow-2xs border border-gray-200/80 overflow-hidden">
            <div className="px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">Project List</h2>
            </div>

            <div className="overflow-x-auto scroll-hide">
              <table className="w-full text-left min-w-200">
                <thead className="bg-[#EAECEF] border-b border-gray-200/80">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-700">
                      Project ID
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-700">
                      Project / Site
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-700">
                      Priority
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-700 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-gray-500 font-medium"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Loading projects...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-sm text-red-500 font-medium"
                      >
                        Failed to load projects. Please try again.
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-gray-500 font-medium"
                      >
                        No projects found.
                      </td>
                    </tr>
                  ) : (
                    projects.map((project: Project) => (
                      <tr
                        key={project._id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Project ID */}
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                          {project.jobId}
                        </td>

                        {/* Project / Site */}
                        <td className="px-6 py-4">
                          <div
                            onClick={() => handleViewProject(project)}
                            className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {project.projectName ||
                              `${project.buildingType || "Project"} - ${
                                project.location || "Site"
                              }`}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {project.location || "Construction Site A"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusDisplay(project.lifecycleStatus)}
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(
                            project.priority,
                            project.lifecycleStatus,
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedCalendarProjectId(project._id);
                                setSelectedProjectObj(project);
                                setActiveTab("calendar");
                                setSearchParams({
                                  tab: "calendar",
                                  projectId: project._id,
                                });
                              }}
                              className="px-3 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                              title="View in Calendar"
                            >
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>Calendar</span>
                            </button>
                            <button
                              onClick={() => handleViewProject(project)}
                              className="px-4 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Separate Pagination Card */}
          <div className="bg-white rounded-md shadow-2xs border border-gray-200/80 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <span>Showing</span>
              <div className="relative inline-flex items-center">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="appearance-none bg-white border border-gray-200 rounded pl-3 pr-7 py-1 text-xs font-medium text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
              </div>
              <span>Results</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center gap-1.5">
                      {showEllipsis && (
                        <span className="text-gray-400 text-xs px-0.5">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-all cursor-pointer ${
                          page === p
                            ? "border border-purple-500 text-purple-600 bg-white"
                            : "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AddDeliveryDrawer
        open={toggle}
        onClose={() => setToggle(false)}
        leadId={leadIdToPass || undefined}
      />

      <MaterialRequestDetailsModal
        open={showDetails}
        projectId={selectedProjectId}
        onClose={() => {
          setShowDetails(false);
          setSelectedProjectId(null);
        }}
      />
    </div>
  );
}
