import React, { useState, useMemo, useRef } from "react";
import { PlusCircle, Eye, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectConstructionTaskItem } from "./types";
import { AddConstructionTaskModal } from "./AddConstructionTaskModal";
import { ConstructionTaskDetailsModal } from "./ConstructionTaskDetailsModal";
import SuccessModal from "@/components/common/SuccessModal";
import { getProjectPhasesApi, updateProjectStepApi } from "@/api/projects.api";

interface ProjectConstructionTasksCardProps {
  projectId?: string;
  leadId?: string;
  initialTasks?: ProjectConstructionTaskItem[];
}

const formatDisplayDate = (val?: string | null) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const DEFAULT_CONSTRUCTION_TASKS: ProjectConstructionTaskItem[] = [
  {
    id: "task-const-1",
    stepKey: "site_preparation",
    title: "Site Preparation & Foundation",
    startDate: "12 April 2026",
    estEndDate: "13 April 2026",
    completedDate: "14 April 2026",
    status: "under_timeline",
    statusLabel: "Under timeline",
    statusBadgeColor: "green",
    description: "Site grading, earthwork compaction, and reinforced concrete footings completed and cured.",
    photos: [],
  },
  {
    id: "task-const-2",
    stepKey: "steel_structure_erection",
    title: "Steel Structure Erection",
    startDate: "15 April 2026",
    estEndDate: "16 April 2026",
    completedDate: "18 April 2026",
    status: "days_late",
    statusLabel: "2 Days Late",
    statusBadgeColor: "green",
    description: "Main framing, primary steel columns, and rafters erected. Delay occurred due to high wind weather conditions.",
    photos: [],
  },
  {
    id: "task-const-3",
    stepKey: "roofing_installation",
    title: "Roofing Installation",
    startDate: "15 April 2026",
    estEndDate: "18 April 2026",
    status: "delayed",
    statusLabel: "2 Days Delayed",
    statusBadgeColor: "red",
    description: "Roof purlins, standing seam insulation panels, and ridge vents currently scheduled.",
    photos: [],
  },
  {
    id: "task-const-4",
    stepKey: "secondary_framing",
    title: "Secondary Framing Installation",
    startDate: "18 April 2026",
    estEndDate: "20 April 2026",
    status: "in_progress",
    statusLabel: "In Progress",
    statusBadgeColor: "blue",
    description: "Installation of wall girts, door frames, header channels, and corner trims in progress.",
    photos: [],
  },
];

export const ProjectConstructionTasksCard: React.FC<ProjectConstructionTasksCardProps> = ({
  projectId,
  leadId,
  initialTasks,
}) => {
  const queryClient = useQueryClient();
  const effectiveLeadId = leadId || projectId;

  // Query real phases & steps from backend if available
  const { data: phasesResponse } = useQuery({
    queryKey: ["construction-phases", effectiveLeadId],
    queryFn: () => getProjectPhasesApi(effectiveLeadId!),
    enabled: Boolean(effectiveLeadId),
    retry: 1,
  });

  const tasks: ProjectConstructionTaskItem[] = useMemo(() => {
    const apiSteps = phasesResponse?.data?.data?.steps;
    if (apiSteps && apiSteps.length > 0) {
      return apiSteps.map((s, idx) => {
        const isDone = s.status === "completed" || (s.completionPct !== undefined && s.completionPct >= 100);
        return {
          id: s.stepKey || s.key || `step-${idx}`,
          stepKey: s.stepKey || s.key,
          title: s.label,
          startDate: formatDisplayDate(s.startedAt) || "15 April 2026",
          estEndDate: formatDisplayDate(s.expectedCompletion || s.completedAt) || "18 April 2026",
          completedDate: s.completedAt ? formatDisplayDate(s.completedAt) : undefined,
          status: s.status,
          statusLabel: isDone
            ? "Under timeline"
            : s.status === "delayed"
            ? "2 Days Delayed"
            : s.status === "in_progress"
            ? "In Progress"
            : s.status,
          statusBadgeColor: isDone ? "green" : s.status === "delayed" ? "red" : "blue",
          description: s.notes || "",
          photos: s.attachments?.map((a) => a.url) || [],
        };
      });
    }
    return initialTasks && initialTasks.length > 0 ? initialTasks : DEFAULT_CONSTRUCTION_TASKS;
  }, [phasesResponse, initialTasks]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const handleAddTask = () => {
    queryClient.invalidateQueries({ queryKey: ["construction-phases"] });
    queryClient.invalidateQueries({ queryKey: ["project-details"] });
  };

  const handleRemoveTask = () => {
    setDetailsModalOpen(false);
    setSelectedTaskId(null);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && e.deltaY !== 0) {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleViewAllMedia = () => {
    if (projectId) {
      window.open(`/projects/${projectId}/view-drawings`, "_blank");
    }
  };

  const [markingTaskId, setMarkingTaskId] = useState<string | null>(null);
  const [showCardSuccessModal, setShowCardSuccessModal] = useState(false);

  const handleMarkComplete = async (taskId: string) => {
    setMarkingTaskId(taskId);
    try {
      const target = tasks.find((t) => t.id === taskId);
      const stepKey = target?.stepKey || target?.id || taskId;

      if (effectiveLeadId && stepKey) {
        try {
          await updateProjectStepApi(effectiveLeadId, stepKey, {
            status: "completed",
            percentComplete: 100,
            completionPct: 100,
            endDate: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          });
        } catch (apiErr) {
          console.warn("API step update notice:", apiErr);
        }
      }

      // Invalidate queries to get fresh data from server (NO manual state mutation!)
      await queryClient.invalidateQueries({ queryKey: ["construction-phases"] });
      await queryClient.invalidateQueries({ queryKey: ["project-details"] });
      if (effectiveLeadId) {
        await queryClient.refetchQueries({ queryKey: ["construction-phases", effectiveLeadId] });
      }

      if (!detailsModalOpen) {
        setShowCardSuccessModal(true);
      }
    } finally {
      setMarkingTaskId(null);
    }
  };

  const handleOpenDetails = (task: ProjectConstructionTaskItem) => {
    setSelectedTaskId(task.id);
    setDetailsModalOpen(true);
  };

  const renderStatusBadge = (task: ProjectConstructionTaskItem) => {
    if (task.status === "delayed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EF4444] text-white select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{task.statusLabel || "Delayed"}</span>
        </span>
      );
    }

    if (task.status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stats-delayed text-white select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>{task.statusLabel || "In Progress"}</span>
        </span>
      );
    }

    if (task.status === "days_late") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981] text-white select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>{task.statusLabel || "2 Days Late"}</span>
        </span>
      );
    }

    // Default under timeline / completed
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981] text-white select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        <span>{task.statusLabel || "Under timeline"}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
          Project Construction Task
        </h3>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#485563] hover:bg-[#374151] active:bg-[#1F2937] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Add</span>
        </button>
      </div>

      {/* Task Cards Single Row with Scroll */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-0.5 scroll-smooth"
      >
        {tasks.map((task) => {
          const isCompleted =
            Boolean(task.completedDate) ||
            task.status === "completed" ||
            task.status === "under_timeline" ||
            task.status === "days_late";

          return (
            <div
              key={task.id}
              onClick={() => handleOpenDetails(task)}
              className="w-[280px] sm:w-[290px] shrink-0 bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Task Title & Dates */}
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug line-clamp-2 min-h-11">
                  {task.title}
                </h4>

                <div className="mt-2.5 space-y-1 text-xs text-gray-500 font-medium">
                  <p>Start: {task.startDate}</p>
                  <p>
                    {isCompleted ? "Est End: " : "Est: "}
                    {task.estEndDate}
                  </p>
                  {task.completedDate && (
                    <p className="text-gray-600">Completed: {task.completedDate}</p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-3.5">{renderStatusBadge(task)}</div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-4 pt-1 flex items-center gap-2">
                {/* View Details Eye Button */}
                <button
                  type="button"
                  title="View Task Details"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(task);
                  }}
                  className="w-10 h-8 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors cursor-pointer shrink-0"
                >
                  <Eye className="w-4 h-4 stroke-[1.75]" />
                </button>

                {/* Mark Complete Button (Only if not completed) */}
                {!isCompleted && (
                  <button
                    type="button"
                    disabled={markingTaskId === task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkComplete(task.id);
                    }}
                    className="flex-1 h-8 px-3 bg-[#1D4ED8] hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-75 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap gap-1.5"
                  >
                    {markingTaskId === task.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Completing...</span>
                      </>
                    ) : (
                      <span>Mark Complete</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <AddConstructionTaskModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddTask={handleAddTask}
        projectId={projectId}
        leadId={leadId}
      />

      {/* View Task Details Modal */}
      <ConstructionTaskDetailsModal
        task={selectedTask}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedTaskId(null);
        }}
        onMarkComplete={handleMarkComplete}
        onRemoveTask={handleRemoveTask}
        onViewAllMedia={handleViewAllMedia}
      />

      {/* Success Modal when marking complete from card */}
      <SuccessModal
        open={showCardSuccessModal}
        title="Mark as Completed"
        onClose={() => setShowCardSuccessModal(false)}
      />
    </div>
  );
};
