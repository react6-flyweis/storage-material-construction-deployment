export const formatStatusLabel = (status: string) => {
  if (!status) return "";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getDeliveryStatusBadgeClass = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("track") || s.includes("on time")) {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (s.includes("delayed") || s.includes("late")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (s.includes("delivered") || s.includes("complete")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
};

export const getPriorityBadgeClass = (priority: string) => {
  const p = (priority || "").toLowerCase();
  if (p.includes("time") || p.includes("track")) {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (p.includes("delayed") || p.includes("late") || p.includes("high")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
};
