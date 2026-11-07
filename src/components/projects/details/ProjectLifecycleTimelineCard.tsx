import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjectTimelineApi } from "@/api/projects.api";
import dayjs from "dayjs";

interface ProjectLifecycleTimelineCardProps {
  projectId?: string;
  leadId?: string;
}

export const ProjectLifecycleTimelineCard: React.FC<ProjectLifecycleTimelineCardProps> = ({
  projectId,
  leadId,
}) => {
  const effectiveLeadId = leadId || projectId;
  const [showGranularSteps, setShowGranularSteps] = useState(false);

  const { data: timelineResponse, isLoading, isError } = useQuery({
    queryKey: ["project-timeline", effectiveLeadId],
    queryFn: () => getProjectTimelineApi(effectiveLeadId!),
    enabled: Boolean(effectiveLeadId),
    retry: 1,
  });

  const timelineData = timelineResponse?.data?.data;
  const overallPhases =
    timelineData?.projectTimelineOverall?.length
      ? timelineData.projectTimelineOverall
      : timelineData?.timeline || [];
  const granularSteps = timelineData?.steps || [];
  const progressPct = timelineData?.overallProgressPct ?? 0;
  const currentStep = timelineData?.currentStepLabel;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-3 w-full bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // If not found, not in construction scope, or no data returned
  if (isError || !timelineData || overallPhases.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      {/* Top Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Project Lifecycle Timeline
          </h2>
          {currentStep && (
            <p className="text-xs text-gray-500 mt-1">
              Current Phase:{" "}
              <span className="font-semibold text-gray-700">{currentStep}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 hidden sm:block">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Overall Progress</span>
              <span className="font-bold text-gray-900">{progressPct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
            {progressPct}% Complete
          </span>
        </div>
      </div>

      {/* 5-Phase Horizontal Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
        {overallPhases.map((phase, idx) => {
          const statusLower = (phase.status || "upcoming").toLowerCase();
          const isCompleted = statusLower === "completed";
          const isInProgress =
            statusLower === "inprogress" || statusLower === "in_progress";

          const formattedDate = phase.date
            ? dayjs(phase.date).format("DD/MM/YYYY")
            : "-";

          return (
            <div
              key={phase.key || idx}
              className={`p-3.5 rounded-lg border transition-colors flex flex-col justify-between ${
                isInProgress
                  ? "border-orange-300 bg-orange-50/30"
                  : isCompleted
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-gray-900">
                  {phase.label}
                </span>
                {isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} className="text-white" />
                  </div>
                ) : isInProgress ? (
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                    <Clock size={10} strokeWidth={3} className="text-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-300 bg-white shrink-0" />
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-auto">
                <span>{formattedDate}</span>
                <span
                  className={`font-semibold capitalize ${
                    isCompleted
                      ? "text-green-600"
                      : isInProgress
                      ? "text-orange-600"
                      : "text-gray-400"
                  }`}
                >
                  {isCompleted
                    ? "Completed"
                    : isInProgress
                    ? "In Progress"
                    : "Upcoming"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Granular Steps Toggle (Optional) */}
      {granularSteps.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowGranularSteps((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <span>
              {showGranularSteps ? "Hide" : "View"} Granular Lifecycle Steps ({granularSteps.length})
            </span>
            {showGranularSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showGranularSteps && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
              {granularSteps.map((step, idx) => {
                const sStatus = (step.status || "").toLowerCase();
                const isStepDone = sStatus === "completed" || sStatus === "done";
                return (
                  <div
                    key={step.key || idx}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded bg-gray-50 border border-gray-100"
                  >
                    <span className="font-medium text-gray-800">
                      {step.label || step.name || `Step ${idx + 1}`}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isStepDone ? "text-emerald-600" : "text-gray-400"
                      }`}
                    >
                      {step.date ? dayjs(step.date).format("DD/MM/YYYY") : step.status || "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

