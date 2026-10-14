import React, { useState } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import Modal from "@/components/common/Modal";
import SuccessModal from "@/components/common/SuccessModal";
import type { ProjectConstructionTaskItem } from "./types";
import drawingPreview from "@/assets/drawingpreview.png";

interface ConstructionTaskDetailsModalProps {
  task: ProjectConstructionTaskItem | null;
  open: boolean;
  onClose: () => void;
  onMarkComplete?: (taskId: string) => void | Promise<void>;
  onRemoveTask?: (taskId: string) => void;
  onViewAllMedia?: () => void;
}

export const ConstructionTaskDetailsModal: React.FC<
  ConstructionTaskDetailsModalProps
> = ({ task, open, onClose, onMarkComplete, onRemoveTask, onViewAllMedia }) => {
  const [isMarkingLoading, setIsMarkingLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!task) return null;

  const isCompleted =
    Boolean(task.completedDate) ||
    task.status === "completed" ||
    task.status === "under_timeline";

  const getStatusText = () => {
    if (task.status === "delayed") {
      return task.statusLabel || "2 Days Delayed";
    }
    if (task.status === "days_late") {
      return task.statusLabel || "2 Days Late";
    }
    if (task.status === "in_progress") {
      return task.statusLabel || "In Progress";
    }
    return task.statusLabel || "Under timeline";
  };

  const getStatusTextColor = () => {
    const text = getStatusText().toLowerCase();
    if (text.includes("delay") || text.includes("late")) {
      return "text-[#DC2626]";
    }
    if (text.includes("progress")) {
      return "text-[#2563EB]";
    }
    return "text-[#16A34A]";
  };

  // 4 placeholder images matching the design screenshot
  const displayPhotos =
    task.photos && task.photos.length > 0
      ? task.photos
      : [drawingPreview, drawingPreview, drawingPreview, drawingPreview];

  const handleMarkCompleteClick = async () => {
    if (isMarkingLoading) return;
    setIsMarkingLoading(true);
    try {
      if (onMarkComplete) {
        await Promise.resolve(onMarkComplete(task.id));
      }
      // Brief smooth delay for transition
      await new Promise((resolve) => setTimeout(resolve, 600));
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to mark task complete:", err);
    } finally {
      setIsMarkingLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open && !showSuccessModal}
        onClose={onClose}
        containerClassName="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
      {/* Header */}
      <div className="flex items-center justify-between pb-5">
        <h2 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
          {task.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-800 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2]" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Banner Section: Dates + Status + Mark as Completed */}
        <div className="bg-[#F0F5FF] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-100/60">
          <div className="flex items-center flex-wrap gap-4 sm:gap-7">
            {/* Start Date */}
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 block">
                Start Date
              </span>
              <p className="text-sm sm:text-base font-bold text-[#1D4ED8] mt-0.5">
                {task.startDate || "15 April 2026"}
              </p>
            </div>

            <div className="hidden sm:block h-9 w-px bg-gray-300" />

            {/* Est End Date */}
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 block">
                Est End Date
              </span>
              <p className="text-sm sm:text-base font-bold text-[#1D4ED8] mt-0.5">
                {task.estEndDate || "18 April 2026"}
              </p>
            </div>

            <div className="hidden sm:block h-9 w-px bg-gray-300" />

            {/* Step Status */}
            <div>
              <span className="text-xs sm:text-sm font-medium text-gray-500 block">
                Step Status
              </span>
              <p
                className={`text-sm sm:text-base font-bold mt-0.5 ${getStatusTextColor()}`}
              >
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Mark as Completed Button */}
          <div>
            {!isCompleted ? (
              <button
                type="button"
                disabled={isMarkingLoading}
                onClick={handleMarkCompleteClick}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0B57D0] hover:bg-[#1557bf] active:bg-[#0842a0] disabled:opacity-75 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isMarkingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Marking as Completed...</span>
                  </>
                ) : (
                  <span>Mark as Completed</span>
                )}
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold rounded-xl text-center">
                Completed
              </div>
            )}
          </div>
        </div>

        {/* Work Description Box */}
        <div className="border border-gray-300 rounded-xl p-4 sm:p-5 min-h-[140px] bg-white">
          <p className="text-sm font-medium text-gray-500 mb-2">
            Work Description
          </p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {task.description || ""}
          </p>
        </div>

        {/* Photos Section */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3.5">
            Photos
          </h3>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {displayPhotos.slice(0, 4).map((imgSrc, idx) => (
              <div
                key={idx}
                className="w-32 sm:w-36 h-20 sm:h-22 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-xs"
              >
                <img
                  src={imgSrc}
                  alt={`Site photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {/* View All Media Button */}
            <button
              type="button"
              onClick={onViewAllMedia}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0 ml-1"
            >
              <ImageIcon className="w-4 h-4 stroke-[2]" />
              <span>View All Media</span>
            </button>
          </div>
        </div>

        {/* Footer / Remove Task */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to remove this task?")
              ) {
                onRemoveTask?.(task.id);
                onClose();
              }
            }}
            className="px-5 py-2 border border-gray-300 hover:border-red-300 text-gray-600 hover:text-red-600 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Remove Task
          </button>
        </div>
      </div>
    </Modal>

    <SuccessModal
      open={showSuccessModal}
      title="Mark as Completed"
      onClose={() => {
        setShowSuccessModal(false);
        onClose();
      }}
    />
  </>
  );
};
