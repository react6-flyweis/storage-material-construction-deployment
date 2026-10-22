import React, { useState, useMemo, useRef } from "react";
import { PlusCircle, Eye, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectConstructionTaskItem } from "./types";
import { AddConstructionTaskModal } from "./AddConstructionTaskModal";
import { ConstructionTaskDetailsModal } from "./ConstructionTaskDetailsModal";
import SuccessModal from "@/components/common/SuccessModal";
import {
  getProjectTimelineTasksApi,
  completeConstructionTaskApi,
  deleteConstructionTaskApi,
} from "@/api/projects.api";

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

export const ProjectConstructionTasksCard: React.FC<ProjectConstructionTasksCardProps> = ({
  projectId,
  leadId,
  initialTasks,
}) => {
  const queryClient = useQueryClient();
  const effectiveLeadId = leadId || projectId;

  // Query real timeline tasks from backend as per API documentation
  const { data: timelineResponse, isLoading } = useQuery({
    queryKey: ["timeline-tasks", effectiveLeadId],
    queryFn: () => getProjectTimelineTasksApi(effectiveLeadId!),
    enabled: Boolean(effectiveLeadId),
    retry: 1,
  });

  const tasks: ProjectConstructionTaskItem[] = useMemo(() => {
    const rawTimelineTasks = timelineResponse?.data?.data?.timelineTasks;
    if (rawTimelineTasks && Array.isArray(rawTimelineTasks)) {
      if (rawTimelineTasks.length === 0) {
        return [];
      }
      // Sort client-side by startDate asc as specified in documentation
      const sorted = [...rawTimelineTasks].sort((a, b) => {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return timeA - timeB;
      });

      return sorted.map((t, idx) => {
        const isDone = t.status === "done" || Boolean(t.completedDate || t.completedAt);
        const estDate = t.estimatedEndDate || t.dueDate;
        const compDate = t.completedDate || t.completedAt;

        return {
          id: t._id || t.id || `task-${idx}`,
          _id: t._id,
          title: t.title,
          startDate: formatDisplayDate(t.startDate) || "-",
          estEndDate: formatDisplayDate(estDate) || "-",
          estimatedEndDate: t.estimatedEndDate,
          dueDate: t.dueDate,
          completedDate: compDate ? formatDisplayDate(compDate) : undefined,
          completedAt: t.completedAt,
          status: t.status,
          statusLabel: t.timelineBadge?.label || (isDone ? "Under timeline" : "In Progress"),
          statusBadgeColor:
            t.timelineBadge?.tone === "danger"
              ? "red"
              : t.timelineBadge?.tone === "info"
              ? "blue"
              : "green",
          timelineBadge: t.timelineBadge,
          timelineStatusLine: t.timelineStatusLine,
          onTimeStatus: t.onTimeStatus,
          onTime: t.onTime,
          daysLateOrEarly: t.daysLateOrEarly,
          daysPastDue: t.daysPastDue,
          canMarkComplete: t.canMarkComplete ?? (!isDone && t.status !== "done"),
          description: t.description || t.workDescription || "",
          workDescription: t.workDescription,
          photos: t.attachments || [],
          attachments: t.attachments || [],
        };
      });
    }

    if (initialTasks && initialTasks.length > 0) {
      return initialTasks;
    }

    return [];
  }, [timelineResponse, initialTasks]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const handleAddTask = () => {
    queryClient.invalidateQueries({ queryKey: ["timeline-tasks"] });
    if (effectiveLeadId) {
      queryClient.invalidateQueries({ queryKey: ["timeline-tasks", effectiveLeadId] });
    }
    queryClient.invalidateQueries({ queryKey: ["project-details"] });
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await deleteConstructionTaskApi(taskId);
      await queryClient.invalidateQueries({ queryKey: ["timeline-tasks"] });
      if (effectiveLeadId) {
        await queryClient.refetchQueries({ queryKey: ["timeline-tasks", effectiveLeadId] });
      }
      await queryClient.invalidateQueries({ queryKey: ["project-details"] });
    } catch (err) {
      console.error("Failed to remove construction task:", err);
    } finally {
      setDetailsModalOpen(false);
      setSelectedTaskId(null);
    }
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
    const targetId = effectiveLeadId || projectId;
    if (targetId) {
      window.open(`/projects/${targetId}/view-drawings`, "_blank");
    }
  };

  const [markingTaskId, setMarkingTaskId] = useState<string | null>(null);
  const [showCardSuccessModal, setShowCardSuccessModal] = useState(false);

  const handleMarkComplete = async (taskId: string) => {
    setMarkingTaskId(taskId);
    try {
      await completeConstructionTaskApi(taskId, {
        completedAt: new Date().toISOString(),
      });

      // Invalidate queries to get fresh data from server (NO manual state mutation!)
      await queryClient.invalidateQueries({ queryKey: ["timeline-tasks"] });
      if (effectiveLeadId) {
        await queryClient.refetchQueries({ queryKey: ["timeline-tasks", effectiveLeadId] });
      }
      await queryClient.invalidateQueries({ queryKey: ["project-details"] });

      if (!detailsModalOpen) {
        setShowCardSuccessModal(true);
      }
    } catch (err) {
      console.error("Failed to mark construction task complete:", err);
    } finally {
      setMarkingTaskId(null);
    }
  };

  const handleOpenDetails = (task: ProjectConstructionTaskItem) => {
    setSelectedTaskId(task.id);
    setDetailsModalOpen(true);
  };

  const renderStatusBadge = (task: ProjectConstructionTaskItem) => {
    const badge = task.timelineBadge;
    const tone = badge?.tone?.toLowerCase();
    const label = badge?.label || task.statusLabel || "In Progress";

    if (
      tone === "danger" ||
      task.status === "delayed" ||
      label.toLowerCase().includes("delay")
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EF4444] text-white select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{label}</span>
        </span>
      );
    }

    if (
      tone === "info" ||
      task.status === "in_progress" ||
      label.toLowerCase().includes("progress")
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stats-delayed text-white select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>{label}</span>
        </span>
      );
    }

    // Default under timeline or N days late (success tone)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981] text-white select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        <span>{label}</span>
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

      {/* Task Cards Single Row with Scroll or Empty State */}
      {isLoading ? (
        <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-0.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-[280px] sm:w-[290px] h-48 shrink-0 bg-gray-50 rounded-2xl border border-gray-200 animate-pulse p-5"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <p className="text-sm font-semibold text-gray-700">
            No construction timeline tasks yet
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Add tasks to track site progress on the construction timeline.
          </p>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#485563] hover:bg-[#374151] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white" />
            <span>Add Task</span>
          </button>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-0.5 scroll-smooth"
        >
          {tasks.map((task) => {
            const isCompleted =
              Boolean(task.completedDate) ||
              task.status === "done" ||
              task.status === "completed" ||
              task.status === "under_timeline" ||
              task.status === "days_late";

            const canMarkComplete =
              task.canMarkComplete ?? (!isCompleted && task.status !== "done");

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
                      <p className="text-gray-600">
                        Completed: {task.completedDate}
                      </p>
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

                  {/* Mark Complete Button (Only if canMarkComplete is true) */}
                  {canMarkComplete && (
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
      )}

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
