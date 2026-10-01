import React, { useMemo, useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  PackageX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddDeliveryDrawer from "../materials/AddDeliveryDrawer";
import DeliveryDetailsModal from "../materials/DeliveryDetailsModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCalendarApi, getDeliveriesApi } from "../../api/projects.api";
import type {
  CalendarDelivery,
  ConstructionDelivery,
  Project,
} from "../../types/projects.types";

const statusColors: Record<string, string> = {
  bidding_sent: "#3B82F6",
  carrier_selected: "#F59E0B",
  confirmed: "#10B981",
  in_transit: "#8B5CF6",
  scheduled: "#EC4899",
  delivered: "#10B981",
};

const formatStatus = (status: string) => {
  if (!status) return "-";
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

interface CalendarProps {
  leadId?: string;
  projectId?: string;
  selectedProject?: Project | null;
  onClearProject?: () => void;
}

export default function Calendar({
  leadId,
  projectId,
  selectedProject,
}: CalendarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toggle, setToggle] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const isProjectSelected = Boolean(projectId || leadId);

  // 1. Fetch project-specific deliveries when a project is selected to identify delivery dates
  const {
    data: projectDeliveriesRes,
    isLoading: isLoadingProjectDeliveries,
    isFetched: isDeliveriesFetched,
  } = useQuery({
    queryKey: ["calendar-project-deliveries", projectId, leadId],
    queryFn: () =>
      getDeliveriesApi({
        projectId: projectId || undefined,
        leadId: leadId || undefined,
        limit: 100,
        sortBy: "DeliveryDate",
      }),
    enabled: isProjectSelected,
  });

  const projectDeliveries: ConstructionDelivery[] = useMemo(() => {
    return projectDeliveriesRes?.data?.data?.deliveries || [];
  }, [projectDeliveriesRes]);

  // Extract all valid delivery dates (YYYY-MM-DD) sorted ascending
  const validDeliveryDates = useMemo(() => {
    const dates = projectDeliveries
      .map((d) => d.schedule?.deliveryDate || (d as unknown as { deliveryDate?: string }).deliveryDate)
      .filter((d): d is string => Boolean(d && dayjs(d).isValid()))
      .map((d) => dayjs(d).format("YYYY-MM-DD"));
    return Array.from(new Set(dates)).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());
  }, [projectDeliveries]);

  // Target delivery date: prefer the earliest upcoming delivery (today or later);
  // fallback to the most recent delivery if all are in the past
  const targetDeliveryDate = useMemo(() => {
    if (validDeliveryDates.length === 0) return null;
    const todayStr = dayjs().format("YYYY-MM-DD");
    const upcoming = validDeliveryDates.find((d) => d >= todayStr);
    return upcoming || validDeliveryDates[validDeliveryDates.length - 1];
  }, [validDeliveryDates]);

  // Track auto-jumped project so user can freely navigate months after initial jump
  const autoJumpedProjectRef = useRef<string | null>(null);

  useEffect(() => {
    const currentKey = projectId || leadId || null;

    if (!currentKey) {
      if (autoJumpedProjectRef.current !== null) {
        autoJumpedProjectRef.current = null;
        // User switched back to "All Projects"
        const today = dayjs();
        setTimeout(() => {
          setCurrentMonth(today.startOf("month"));
          setSelectedDate(today);
        }, 0);
      }
      return;
    }

    // A project is selected
    if (autoJumpedProjectRef.current !== currentKey && isDeliveriesFetched) {
      autoJumpedProjectRef.current = currentKey;
      if (targetDeliveryDate) {
        const targetDay = dayjs(targetDeliveryDate);
        setTimeout(() => {
          setCurrentMonth(targetDay.startOf("month"));
          setSelectedDate(targetDay);
        }, 0);
      }
    }
  }, [projectId, leadId, isDeliveriesFetched, targetDeliveryDate]);

  const hasNoDeliveries =
    isProjectSelected &&
    isDeliveriesFetched &&
    !isLoadingProjectDeliveries &&
    projectDeliveries.length === 0;

  // 2. Fetch calendar data for current month/year
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "calendar-deliveries",
      currentMonth.month() + 1,
      currentMonth.year(),
      leadId,
      projectId,
    ],
    queryFn: () =>
      getCalendarApi({
        month: currentMonth.month() + 1,
        year: currentMonth.year(),
        leadId: leadId || undefined,
        projectId: projectId || undefined,
      }),
  });

  const calendarData = data?.data?.data?.calendar || {};

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();

  const days: Array<{ day: number; current: boolean; dateStr: string }> = [];
  // Previous month padding
  const prevMonth = currentMonth.subtract(1, "month");
  const prevMonthDays = prevMonth.daysInMonth();
  for (let i = 0; i < firstDayOfMonth; i++) {
    const d = prevMonthDays - firstDayOfMonth + i + 1;
    days.push({
      day: d,
      current: false,
      dateStr: prevMonth.date(d).format("YYYY-MM-DD"),
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      current: true,
      dateStr: currentMonth.date(i).format("YYYY-MM-DD"),
    });
  }
  // Next month padding to complete 7-column rows
  const remainingCells = (7 - (days.length % 7)) % 7;
  const nextMonth = currentMonth.add(1, "month");
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      current: false,
      dateStr: nextMonth.date(i).format("YYYY-MM-DD"),
    });
  }

  const selectedDateStr = selectedDate.format("YYYY-MM-DD");
  const monthDeliveries: CalendarDelivery[] = calendarData[selectedDateStr] || [];

  // Match deliveries from projectDeliveries if calendarData doesn't have it for this date
  const matchingProjectDeliveries = useMemo(() => {
    if (!isProjectSelected) return [];
    return projectDeliveries.filter((d) => {
      const dDate = d.schedule?.deliveryDate || (d as unknown as { deliveryDate?: string }).deliveryDate;
      return dDate && dayjs(dDate).format("YYYY-MM-DD") === selectedDateStr;
    });
  }, [isProjectSelected, projectDeliveries, selectedDateStr]);

  const deliveriesForSelectedDate =
    monthDeliveries.length > 0 ? monthDeliveries : matchingProjectDeliveries;

  const currentProjectName =
    selectedProject?.projectName ||
    selectedProject?.jobId ||
    "Selected Project";

  return (
    <div className="space-y-3.5">
      {/* Calendar Top Controls: Today + < Month Year > */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => {
            const today = dayjs();
            setCurrentMonth(today.startOf("month"));
            setSelectedDate(today);
          }}
          className="bg-white px-4 py-1.5 rounded-md text-xs font-semibold text-gray-800 border border-gray-200/90 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
        >
          Today
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
            className="p-1 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight select-none min-w-[120px] text-center">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
            className="p-1 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Main Grid + Sidebar Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Calendar Grid Card */}
        <div className="flex-1 w-full bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col min-w-0">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200/80 bg-white">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 bg-white">
            {days.map((item, idx) => {
              const isSelected =
                item.current &&
                currentMonth.date(item.day).isSame(selectedDate, "day");
              const dateStr = item.dateStr;
              const dayDeliveries: CalendarDelivery[] = item.current
                ? calendarData[dateStr] || []
                : [];

              // Check if selected project has deliveries on this day
              const projectDeliveriesOnDay = isProjectSelected
                ? projectDeliveries.filter((d) => {
                    const dDate =
                      d.schedule?.deliveryDate ||
                      (d as unknown as { deliveryDate?: string }).deliveryDate;
                    return dDate && dayjs(dDate).format("YYYY-MM-DD") === dateStr;
                  })
                : [];

              const hasAnyDeliveries =
                dayDeliveries.length > 0 || projectDeliveriesOnDay.length > 0;
              const isTargetDay =
                isProjectSelected &&
                targetDeliveryDate &&
                dayjs(targetDeliveryDate).format("YYYY-MM-DD") === dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.current) {
                      setSelectedDate(currentMonth.date(item.day));
                    }
                  }}
                  className={`min-h-[105px] sm:min-h-[115px] p-2 border-r border-b border-gray-200/60 last:border-r-0 cursor-pointer relative transition-all ${
                    isSelected
                      ? "ring-2 ring-blue-600 ring-inset z-10 bg-blue-50/40"
                      : isTargetDay
                      ? "bg-blue-50/50 ring-2 ring-blue-400/80 ring-dashed ring-inset z-10 hover:bg-blue-50/70"
                      : hasAnyDeliveries && isProjectSelected
                      ? "bg-blue-50/20 hover:bg-blue-50/40"
                      : item.current
                      ? "bg-white hover:bg-gray-50/50"
                      : "bg-gray-50/30"
                  }`}
                >
                  {/* Day Number and Delivery Count Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs sm:text-sm font-semibold transition-colors ${
                        !item.current
                          ? "text-gray-300 font-normal"
                          : isSelected
                          ? "bg-blue-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold shadow-xs"
                          : isTargetDay
                          ? "bg-blue-100 text-blue-800 border border-blue-400 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold shadow-2xs"
                          : hasAnyDeliveries && isProjectSelected
                          ? "text-blue-700 font-bold bg-blue-100/70 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center"
                          : "text-gray-800"
                      }`}
                    >
                      {item.day}
                    </span>

                    {/* Small tag when date has deliveries for selected project */}
                    {item.current &&
                      isProjectSelected &&
                      hasAnyDeliveries &&
                      !isSelected && (
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                          Delivery
                        </span>
                      )}
                  </div>

                  {/* Delivery Event Bullet Items */}
                  <div className="space-y-1">
                    {item.current &&
                      (dayDeliveries.length > 0
                        ? dayDeliveries
                        : projectDeliveriesOnDay
                      )
                        .slice(0, 3)
                        .map(
                          (
                            delivery: CalendarDelivery | ConstructionDelivery,
                            dIdx: number
                          ) => (
                            <div
                              key={delivery.deliveryId || dIdx}
                              className="flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors hover:bg-gray-100/70"
                              title={
                                delivery.description || delivery.deliveryNumber
                              }
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    statusColors[delivery.status] || "#2563EB",
                                }}
                              />
                              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-800 truncate">
                                {delivery.description || delivery.deliveryNumber}
                              </span>
                            </div>
                          )
                        )}
                    {item.current && dayDeliveries.length > 3 && (
                      <div className="text-[9px] font-medium text-gray-400 pl-3">
                        +{dayDeliveries.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Selected Date Deliveries */}
        <div className="w-full lg:w-[380px] bg-white rounded-xl p-5 border border-gray-200/90 shadow-2xs flex flex-col shrink-0">
          {/* Sidebar Date Header */}
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              {selectedDate.format("dddd, MMMM D, YYYY")}
            </h3>
          </div>

          {/* Subheader: Deliveries on this date + Add Delivery button */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Deliveries on this date
            </p>
            <button
              onClick={() => setToggle(true)}
              className="text-xs font-semibold text-blue-600 bg-white border border-blue-600/80 px-2.5 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Delivery</span>
            </button>
          </div>

          {/* Delivery Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-0.5">
            {isLoading || isLoadingProjectDeliveries ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500 font-medium">
                  Loading deliveries...
                </p>
              </div>
            ) : error ? (
              <p className="text-xs text-red-500 text-center py-6 font-medium">
                Failed to load deliveries
              </p>
            ) : hasNoDeliveries ? (
              <div className="py-10 px-4 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/60 my-2">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500 mb-3">
                  <PackageX className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  No Deliveries Found
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  No deliveries are currently scheduled for{" "}
                  <span className="font-semibold text-gray-700">
                    {currentProjectName}
                  </span>
                  .
                </p>
                <button
                  onClick={() => setToggle(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Delivery</span>
                </button>
              </div>
            ) : deliveriesForSelectedDate.length === 0 ? (
              <div className="py-8 px-3 text-center">
                <p className="text-xs text-gray-400 font-medium">
                  No deliveries on this date
                </p>

                {/* If selected project has deliveries on other dates, suggest jumping */}
                {isProjectSelected && validDeliveryDates.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-600 mb-2">
                      Jump to project deliveries:
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {validDeliveryDates.slice(0, 4).map((dStr) => (
                        <button
                          key={dStr}
                          onClick={() => {
                            const dDay = dayjs(dStr);
                            setCurrentMonth(dDay.startOf("month"));
                            setSelectedDate(dDay);
                          }}
                          className="text-[11px] px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors cursor-pointer border border-blue-200/60"
                        >
                          {dayjs(dStr).format("MMM D, YYYY")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              deliveriesForSelectedDate.map(
                (
                  delivery: CalendarDelivery | ConstructionDelivery,
                  idx: number
                ) => (
                  <div
                    key={delivery.deliveryId || idx}
                    onClick={() => {
                      setSelectedDeliveryId(delivery.deliveryId);
                      setShowDetails(true);
                    }}
                    className="p-3.5 rounded-lg border border-gray-200/90 bg-white shadow-2xs hover:border-blue-300 transition-colors cursor-pointer space-y-2.5"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {delivery.description || delivery.deliveryNumber}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Section/Location
                        </p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                          {delivery.project?.location ||
                            delivery.project?.projectName ||
                            "Building Site"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Delivery Date
                        </p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                          {selectedDate.format("MMM D, YYYY")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Status
                      </p>
                      <span
                        className="inline-block mt-0.5 px-2.5 py-0.5 rounded text-[11px] font-semibold"
                        style={{
                          color: statusColors[delivery.status] || "#16A34A",
                          backgroundColor: `${
                            statusColors[delivery.status] || "#16A34A"
                          }15`,
                          borderColor: `${
                            statusColors[delivery.status] || "#16A34A"
                          }30`,
                          borderWidth: "1px",
                        }}
                      >
                        {formatStatus(delivery.status) || "On Schedule"}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          {/* View All Deliveries Button */}
          <button
            onClick={() => navigate("/delivery-tracking")}
            className="w-full mt-4 py-2.5 px-4 rounded-lg border border-gray-200 text-xs font-semibold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Deliveries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <DeliveryDetailsModal
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedDeliveryId(null);
        }}
        deliveryId={selectedDeliveryId}
      />
      <AddDeliveryDrawer
        open={toggle}
        onClose={() => setToggle(false)}
        leadId={leadId}
        initialDate={selectedDate.format("YYYY-MM-DD")}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["calendar-deliveries"] });
          queryClient.invalidateQueries({
            queryKey: ["calendar-project-deliveries"],
          });
        }}
      />
    </div>
  );
}
