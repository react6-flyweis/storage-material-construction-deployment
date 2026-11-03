import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StatItem } from "../components/cards/StatCard";
import StatsOverview from "../components/cards/StatCard";
import NotificationBellIcon from "../assets/NotificationCardIcon";
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/modules/notifications/notifications.hooks";
import {
  getNotificationRoute,
  formatNotificationTime,
  getNotificationTypeConfig,
} from "@/modules/notifications/notifications.utils";
import type { NotificationItem } from "@/types/notifications.types";
import { CheckCheck, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const priorityStyle = (priority: string) => {
  const p = (priority || "").toLowerCase();
  if (p === "high") return "bg-[#FEE2E2] text-[#BF0000]";
  if (p === "medium") return "bg-[#FEF3C7] text-[#D97706]";
  return "bg-[#E5E7EB] text-[#4B5563]";
};

export default function Notifications() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build query params based on active filter
  const queryParams = {
    page,
    limit,
    read: activeFilter === "unread" ? "false" : undefined,
    type:
      activeFilter !== "all" && activeFilter !== "unread"
        ? activeFilter === "leads"
          ? "lead"
          : activeFilter === "tasks"
          ? "task"
          : activeFilter === "deliveries"
          ? "delivery"
          : activeFilter === "drawings"
          ? "drawing"
          : activeFilter === "materials"
          ? "material_request"
          : activeFilter === "meetings"
          ? "meeting"
          : activeFilter === "escalations"
          ? "escalation"
          : undefined
        : undefined,
  };

  const { data, isLoading } = useNotificationsQuery(queryParams);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const notifications: NotificationItem[] = data?.data?.notifications || [];
  const statsData = data?.data?.stats || { total: 0, unread: 0, highPriority: 0, today: 0 };
  const totalCount = data?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const stats: StatItem[] = [
    {
      key: "totalNotifications",
      title: "Total",
      value: statsData.total,
      iconsvg: <NotificationBellIcon color="#1D51A4" />,
    },
    {
      key: "unreadNotifications",
      title: "Unread",
      value: statsData.unread,
      iconsvg: <NotificationBellIcon color="#3AB449" />,
    },
    {
      key: "highPriorityNotifications",
      title: "High Priority",
      value: statsData.highPriority,
      iconsvg: <NotificationBellIcon color="#EAB308" />,
    },
    {
      key: "todayNotifications",
      title: "Today",
      value: statsData.today,
      iconsvg: <NotificationBellIcon color="#FD8D5B" />,
    },
  ];

  const filters = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread", count: statsData.unread },
    { label: "Tasks", value: "tasks" },
    { label: "Deliveries", value: "deliveries" },
    { label: "Materials", value: "materials" },
    { label: "Drawings", value: "drawings" },
    { label: "Meetings", value: "meetings" },
    { label: "Escalations", value: "escalations" },
  ];

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item._id);
    }
    const route = getNotificationRoute(item);
    navigate(route);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Stay updated with your latest activities, deliveries, drawings, and alerts
            </p>
          </div>
          {statsData.unread > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 border border-blue-200 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
        <StatsOverview stats={stats} />
      </div>

      {/* Filter Tabs */}
      <div
        className="
          rounded-[8px] lg:p-6 lg:px-10 p-3 border !bg-white border-[#F3F4F6]
          !shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),_0px_4px_6px_-1px_rgba(0,0,0,0.1)]
        "
      >
        <div className="flex items-center md:gap-4 gap-2 flex-wrap">
          <span className="text-[#111827] text-[17px] font-medium">Filter by:</span>

          {filters.map((item) => {
            const isActive = activeFilter === item.value;

            return (
              <button
                key={item.value}
                onClick={() => {
                  setActiveFilter(item.value);
                  setPage(1);
                }}
                className={`
                  md:px-5 px-3 py-2 min-w-[60px] rounded-[10px] text-sm font-medium transition cursor-pointer
                  ${
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F3F4F6] text-[#4B5563] hover:bg-gray-200"
                  }
                `}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className="ml-1 text-xs">({item.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      <div
        className="
          rounded-[8px] border !bg-white border-[#F3F4F6] lg:py-6 py-4
          !shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),_0px_4px_6px_-1px_rgba(0,0,0,0.1)]
        "
      >
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">
              <Loader2 className="animate-spin h-6 w-6 text-blue-500 mx-auto mb-2" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((item) => {
              const typeConfig = getNotificationTypeConfig(item.type);
              const Icon = typeConfig.icon;

              return (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex sm:gap-4 gap-3 lg:px-10 px-4 py-5 hover:bg-slate-50/70 transition cursor-pointer group ${
                    !item.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div
                    className={`w-9 min-w-9 h-9 sm:w-10 sm:min-w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.bg} ${typeConfig.text}`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-[#111827] group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(item._id);
                            }}
                            title="Mark as read"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            <CheckCheck size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(item._id);
                          }}
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[14px] text-[#4B5563] mt-1.5 leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-[12px] text-[#6B7280]">
                        {formatNotificationTime(item.createdAt)}
                      </span>

                      {item.priority && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${priorityStyle(
                            item.priority
                          )}`}
                        >
                          {item.priority} priority
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-[#374151] capitalize">
                        {typeConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center">
              <p className="text-[#6B7280] text-[15px]">No notifications found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
