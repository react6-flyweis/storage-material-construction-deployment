import React from "react";
import { CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectTaskItem } from "./types";

interface ProjectTasksCardProps {
  tasks: ProjectTaskItem[];
}

export const ProjectTasksCard: React.FC<ProjectTasksCardProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) return null;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "done") {
      return (
        <Badge
          variant="success"
          className="bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-2.5 py-0.5 text-xs font-semibold gap-1"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Completed</span>
        </Badge>
      );
    }
    if (s === "in_progress" || s === "work_in_progress") {
      return (
        <Badge className="bg-amber-50 text-amber-600 border border-amber-200/50 px-2.5 py-0.5 text-xs font-semibold gap-1">
          <Clock className="w-3 h-3" />
          <span>In Progress</span>
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-50 text-gray-600 border border-gray-200/50 px-2.5 py-0.5 text-xs font-semibold gap-1">
        <Clock className="w-3 h-3" />
        <span className="capitalize">{status.replace(/_/g, " ")}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "high" || p === "urgent") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded">
          <AlertCircle className="w-3 h-3" />
          <span className="capitalize">{priority}</span>
        </span>
      );
    }
    if (p === "low") {
      return (
        <span className="inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded capitalize">
          {priority}
        </span>
      );
    }
    return (
      <span className="inline-block text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded capitalize">
        {priority || "Medium"}
      </span>
    );
  };

  return (
    <Card className="p-5 sm:p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Project Tasks ({tasks.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{task.title}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    Due:{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {task.assignedTo && (
                  <span>
                    Assigned:{" "}
                    <span className="font-medium text-gray-700">
                      {task.assignedTo}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {getPriorityBadge(task.priority)}
              {getStatusBadge(task.status)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
