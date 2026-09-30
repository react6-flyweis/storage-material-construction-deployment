import React from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddDeliveryDrawer from "../materials/AddDeliveryDrawer";
import DeliveryDetailsModal from "../materials/DeliveryDetailsModal";
import { useQuery } from "@tanstack/react-query";
import { getCalendarApi } from "../../api/projects.api";
import type { CalendarDelivery } from "../../types/projects.types";

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
}

export default function Calendar({ leadId }: CalendarProps) {
  const navigate = useNavigate();
  const [toggle, setToggle] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = React.useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = React.useState(dayjs());
  const [selectedDate, setSelectedDate] = React.useState(dayjs());

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-deliveries", currentMonth.month() + 1, currentMonth.year(), leadId],
    queryFn: () =>
      getCalendarApi({
        month: currentMonth.month() + 1,
        year: currentMonth.year(),
        leadId: leadId || undefined,
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
  const deliveriesForSelectedDate: CalendarDelivery[] = calendarData[selectedDateStr] || [];

  return (
    <div className="space-y-3">
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

      {/* Main Grid + Sidebar Container */}
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
              const dayDeliveries: CalendarDelivery[] = item.current ? (calendarData[dateStr] || []) : [];

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.current) {
                      setSelectedDate(currentMonth.date(item.day));
                    }
                  }}
                  className={`min-h-[105px] sm:min-h-[115px] p-2 border-r border-b border-gray-200/60 last:border-r-0 cursor-pointer relative bg-white transition-colors ${
                    isSelected
                      ? "ring-2 ring-blue-600 ring-inset z-10"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        !item.current
                          ? "text-gray-300 font-normal"
                          : isSelected
                          ? "bg-blue-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold shadow-xs"
                          : "text-gray-800"
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>


                  {/* Delivery Event Bullet Items */}
                  <div className="space-y-1">
                    {item.current &&
                      dayDeliveries.slice(0, 3).map((delivery: CalendarDelivery, dIdx: number) => (
                        <div
                          key={delivery.deliveryId || dIdx}
                          className="flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors hover:bg-gray-100/70"
                          title={delivery.description || delivery.deliveryNumber}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: statusColors[delivery.status] || "#2563EB",
                            }}
                          />
                          <span className="text-[10px] sm:text-[11px] font-semibold text-gray-800 truncate">
                            {delivery.description || delivery.deliveryNumber}
                          </span>
                        </div>
                      ))}
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
              {selectedDate.format("dddd, MMMM D ,YYYY")}
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
            {isLoading ? (
              <p className="text-xs text-gray-500 text-center py-6">
                Loading deliveries...
              </p>
            ) : error ? (
              <p className="text-xs text-red-500 text-center py-6">
                Failed to load deliveries
              </p>
            ) : deliveriesForSelectedDate.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No deliveries on this date
              </p>
            ) : (
              deliveriesForSelectedDate.map((delivery: CalendarDelivery, idx: number) => (
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
                          "Building A- Front Elevation"}
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
                        backgroundColor: `${statusColors[delivery.status] || "#16A34A"}15`,
                        borderColor: `${statusColors[delivery.status] || "#16A34A"}30`,
                        borderWidth: "1px",
                      }}
                    >
                      {formatStatus(delivery.status) || "On Schedule"}
                    </span>
                  </div>
                </div>
              ))
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
      />
    </div>
  );
}
