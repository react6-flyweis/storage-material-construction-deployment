import { useState } from "react";
import type { StatItem } from "../components/cards/StatCard";
import StatsOverview from "../components/cards/StatCard";
import TaskBoard from "../components/common/TaskBoard";
import ProgressTracker from "../components/common/ProgressTracker";
import FolderIcon from "../assets/activeproject.svg";
import MoneyIcon from "../assets/righttick.svg";
import BoxIcon from "../assets/clockicon.svg";
import ShieldIcon from "../assets/safetyscoreicon.svg";
import { useQuery } from "@tanstack/react-query";
import { getTasksApi } from "../api/projects.api";

export default function Tasks() {
  const [activeTab] = useState<"Task Management" | "Progress Tracker">(
    "Task Management",
  );

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasksApi,
  });

  const apiStats = tasksData?.data?.data?.stats;
  const tasksList = tasksData?.data?.data?.tasks || [];

  const stats: StatItem[] = [
    {
      key: "totalTasks",
      title: "Total Tasks",
      value: apiStats?.total ?? 0,
      icon: FolderIcon,
      cardBg: "#1958b7",
      iconBoxBg: "#FFFFFF",
    },
    {
      key: "completed",
      title: "Completed",
      value: apiStats?.done ?? 0,
      icon: MoneyIcon,
      cardBg: "#2ea34a",
      iconBoxBg: "#EAF7EE",
    },
    {
      key: "inProgress",
      title: "In Progress",
      value: apiStats?.inProgress ?? 0,
      icon: BoxIcon,
      cardBg: "#e5a800",
      iconBoxBg: "#FFF8EA",
    },
    {
      key: "overdue",
      title: "Overdue",
      value: apiStats?.overdue ?? 0,
      icon: ShieldIcon,
      cardBg: "#fa784c",
      iconBoxBg: "#FFF1EC",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6 flex md:flex-row flex-col gap-3 md:items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Tasks
          </h1>
          {/* <div className="flex bg-[#F3F4F6] w-fit rounded-[10px] p-1 h-11 border border-[#E5E7EB]">
            <button
              onClick={() => setActiveTab("Task Management")}
              className={`px-5 py-2 rounded-[8px] text-sm font-medium transition
                ${activeTab === "Task Management"
                  ? "bg-white text-[#1D51A4]"
                  : "text-[#6B7280]"
                }`}
            >
              Task Management
            </button>

            <button
              onClick={() => setActiveTab("Progress Tracker")}
              className={`px-5 py-2 rounded-[8px] text-sm font-medium transition
                ${activeTab === "Progress Tracker"
                  ? "bg-white text-[#1D51A4]"
                  : "text-[#6B7280]"
                }`}
            >
              Progress Tracker
            </button>
          </div> */}
        </div>
        <StatsOverview
          stats={stats}
          gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          isLoading={isLoading}
        />
      </div>
      {activeTab === "Task Management" && (
        <TaskBoard tasks={tasksList} isLoading={isLoading} />
      )}
      {activeTab === "Progress Tracker" && <ProgressTracker />}
    </div>
  );
}
