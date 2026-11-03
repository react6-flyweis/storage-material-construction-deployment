import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getWorkLogsApi } from "../../api/projects.api";
import type { WorkLogItem } from "../../types/projects.types";
import ProjectSelector from "../common/ProjectSelector";
import DailyLogModel from "../dailyLogModel";
import WorkLogDetailModal from "./WorkLogDetailModal";
import SuccessModal from "../common/SuccessModal";
import PhotoLightboxModal from "./PhotoLightboxModal";
import { Search, X, RotateCcw, Loader2, Plus, Image as ImageIcon } from "lucide-react";

interface DailyWorkLogsViewProps {
  initialLeadId?: string;
  hideHeaderButton?: boolean;
}

export default function DailyWorkLogsView({
  initialLeadId,
  hideHeaderButton = false,
}: DailyWorkLogsViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read leadId from prop or URL query parameter
  const queryLeadId = searchParams.get("leadId") || "";
  const [projectFilter, setProjectFilter] = useState<string>(
    initialLeadId || queryLeadId || ""
  );

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeLogDetail, setActiveLogDetail] = useState<WorkLogItem | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const handleProjectFilterChange = (leadId: string) => {
    setProjectFilter(leadId);
    setPage(1);

    if (leadId) {
      searchParams.set("leadId", leadId);
    } else {
      searchParams.delete("leadId");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleClearFilters = () => {
    setProjectFilter("");
    setSearchQuery("");
    setPage(1);
    searchParams.delete("leadId");
    setSearchParams(searchParams, { replace: true });
  };

  // Query work logs from backend GET /construction/work-logs
  const {
    data: responseData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["work-logs", projectFilter, page, limit],
    queryFn: () =>
      getWorkLogsApi({
        leadId: projectFilter || undefined,
        page,
        limit,
      }),
  });

  const total: number = responseData?.data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Client-side quick filter on logs by text query
  const filteredLogs = useMemo(() => {
    const rawLogs = responseData?.data?.data?.logs || [];
    if (!searchQuery.trim()) return rawLogs;
    const q = searchQuery.toLowerCase().trim();

    return rawLogs.filter((log) => {
      const desc = log.description?.toLowerCase() || "";
      const issues = log.issues?.toLowerCase() || "";
      const projName =
        typeof log.leadId === "object" && log.leadId !== null
          ? log.leadId.projectName?.toLowerCase() || ""
          : "";
      const jobId =
        typeof log.leadId === "object" && log.leadId !== null
          ? log.leadId.jobId?.toLowerCase() || ""
          : "";
      const taskTitle =
        typeof log.taskId === "object" && log.taskId !== null
          ? log.taskId.title.toLowerCase()
          : "";
      const loggerName =
        typeof log.loggedBy === "object" && log.loggedBy !== null
          ? (log.loggedBy.name || log.loggedBy.email || "").toLowerCase()
          : typeof log.loggedBy === "string"
          ? log.loggedBy.toLowerCase()
          : "";

      return (
        desc.includes(q) ||
        issues.includes(q) ||
        projName.includes(q) ||
        jobId.includes(q) ||
        taskTitle.includes(q) ||
        loggerName.includes(q)
      );
    });
  }, [responseData, searchQuery]);

  const hasActiveFilters = Boolean(projectFilter || searchQuery);

  const openPhotosModal = (photos: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setLightboxPhotos(photos);
      setLightboxOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      {!hideHeaderButton && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Daily Work Logs
            </h1>
            <p className="text-gray-500 font-medium mt-0.5 text-xs sm:text-[13px]">
              Daily site diary entries tracking progress, field activities, issues, and photos.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#3AB449] hover:bg-[#329f40] text-white px-5 py-2 rounded-[8px] text-sm font-normal flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Daily Work Log</span>
          </button>
        </div>
      )}

      {/* Filters Section (Connected with API leadId filter) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-7 py-2 text-xs font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Project
            </label>
            <ProjectSelector
              value={projectFilter}
              onChange={handleProjectFilterChange}
              showAllOption
              width="100%"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleClearFilters}
              className="text-[11px] font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors py-1 px-2 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Table Section (Identical to Materials.tsx) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Daily Work Logs ({total})
          </h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#3AB449] hover:bg-[#329f40] text-white px-4 py-1.5 rounded-[8px] text-xs font-normal flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Log</span>
          </button>
        </div>

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Linked Task</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Work Description</th>
                <th className="px-5 py-3">Photos</th>
                <th className="px-5 py-3">Issues / Notes</th>
                <th className="px-5 py-3">Logged By</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading daily work logs...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-red-500 font-medium">
                    Error loading work logs.
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 font-medium">
                    No daily work logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const projectName =
                    typeof log.leadId === "object" && log.leadId !== null
                      ? log.leadId.projectName || "—"
                      : "—";

                  const jobId =
                    typeof log.leadId === "object" && log.leadId !== null
                      ? log.leadId.jobId
                      : undefined;

                  const taskTitle =
                    typeof log.taskId === "object" && log.taskId !== null
                      ? log.taskId.title
                      : null;

                  const authorName =
                    typeof log.loggedBy === "object" && log.loggedBy !== null
                      ? log.loggedBy.name || log.loggedBy.email || "Field Team"
                      : typeof log.loggedBy === "string"
                      ? log.loggedBy
                      : "Field Team";

                  const progress = typeof log.progress === "number" ? log.progress : 0;
                  const photos = log.photos || [];

                  const d = new Date(log.date);
                  const formattedDate = !isNaN(d.getTime())
                    ? d.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : log.date;

                  return (
                    <tr
                      key={log._id}
                      className="text-[12px] hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Project */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-700 leading-tight">
                          {projectName}
                        </p>
                        {jobId && (
                          <p className="text-[10px] text-gray-400 font-medium">
                            #{jobId}
                          </p>
                        )}
                      </td>

                      {/* Task */}
                      <td className="px-5 py-3.5">
                        {taskTitle ? (
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] truncate max-w-[160px] inline-block">
                            {taskTitle}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            General
                          </span>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-3.5 font-bold text-gray-700 whitespace-nowrap">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          {progress}%
                        </span>
                      </td>

                      {/* Work Description */}
                      <td className="px-5 py-3.5">
                        <p className="text-gray-600 max-w-[260px] truncate">
                          {log.description || "—"}
                        </p>
                      </td>

                      {/* Photos */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {photos.length > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => openPhotosModal(photos, e)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Issues / Notes */}
                      <td className="px-5 py-3.5">
                        {log.issues ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] truncate max-w-[180px] inline-block">
                            {log.issues}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Logged By */}
                      <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">
                        {authorName}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveLogDetail(log)}
                          className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination (Identical to Materials.tsx) */}
        {total > 0 && (
          <div className="p-4 sm:p-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <span className="text-sm font-medium text-gray-400">Showing</span>
              <select
                disabled
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-gray-700"
              >
                <option>{limit}</option>
              </select>
              <span className="text-sm font-medium text-gray-400">Results</span>
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        pageNum === page
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Daily Work Log Modal */}
      <DailyLogModel
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultLeadId={projectFilter}
        onSubmit={(data) => {
          setIsCreateModalOpen(false);
          setSuccessMsg(
            data?.task
              ? `Daily work log for "${data.task}" was submitted successfully.`
              : "Daily work log was submitted successfully."
          );
          setIsSuccessOpen(true);
          refetch();
        }}
      />

      {/* View Work Log Detail Modal */}
      <WorkLogDetailModal
        open={activeLogDetail !== null}
        onClose={() => setActiveLogDetail(null)}
        log={activeLogDetail}
      />

      {/* Lightbox for Photos */}
      <PhotoLightboxModal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={lightboxPhotos}
      />

      {/* Success Modal */}
      <SuccessModal
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="Work Log Recorded"
        description={successMsg}
      />
    </div>
  );
}
