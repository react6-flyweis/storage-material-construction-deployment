import { useSearchParams } from "react-router-dom";
import type { StatItem } from "../components/cards/StatCard";
import StatsOverview from "../components/cards/StatCard";
import TaskBoard from "../components/common/TaskBoard";
import DailyWorkLogsView from "../components/worklogs/DailyWorkLogsView";
import FolderIcon from "../assets/activeproject.svg";
import MoneyIcon from "../assets/righttick.svg";
import BoxIcon from "../assets/clockicon.svg";
import ShieldIcon from "../assets/safetyscoreicon.svg";
import { useQuery } from "@tanstack/react-query";
import { getTasksApi } from "../api/projects.api";
import { CheckSquare, CalendarDays } from "lucide-react";

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "work-logs" ? "Daily Work Logs" : "Task Board";

  const handleTabChange = (tab: "Task Board" | "Daily Work Logs") => {
    if (tab === "Daily Work Logs") {
      searchParams.set("tab", "work-logs");
    } else {
      searchParams.delete("tab");
    }
    setSearchParams(searchParams, { replace: true });
  };

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
      {/* Top Header with Tab Switcher */}
      <div className="flex md:flex-row flex-col gap-3 md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {currentTab === "Task Board" ? "Task Board & Management" : "Daily Work Logs"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {currentTab === "Task Board"
              ? "Manage project tasks, board columns, and assignees."
              : "Daily site diary entries tracking progress, field photos, and issues."}
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex bg-[#F3F4F6] w-fit rounded-[10px] p-1 h-11 border border-[#E5E7EB] shrink-0">
          <button
            onClick={() => handleTabChange("Task Board")}
            className={`px-4 sm:px-5 py-1.5 rounded-[8px] text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              currentTab === "Task Board"
                ? "bg-white text-[#1D51A4] shadow-xs"
                : "text-[#6B7280] hover:text-gray-900"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Board</span>
          </button>

          <button
            onClick={() => handleTabChange("Daily Work Logs")}
            className={`px-4 sm:px-5 py-1.5 rounded-[8px] text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              currentTab === "Daily Work Logs"
                ? "bg-white text-[#1D51A4] shadow-xs"
                : "text-[#6B7280] hover:text-gray-900"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Daily Work Logs</span>
          </button>
        </div>
      </div>

      {/* Render Current Tab Content */}
      {currentTab === "Task Board" ? (
        <div className="space-y-6">
          <StatsOverview
            stats={stats}
            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            isLoading={isLoading}
          />
          <TaskBoard tasks={tasksList} isLoading={isLoading} />
        </div>
      ) : (
        <DailyWorkLogsView hideHeaderButton />
      )}
    </div>
  );
}
