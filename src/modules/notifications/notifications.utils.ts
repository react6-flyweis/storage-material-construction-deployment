import type { NotificationItem } from "@/types/notifications.types";
import {
  Clock,
  AlertTriangle,
  Calendar,
  Truck,
  FileText,
  DollarSign,
  Package,
  MessageSquare,
  Bell,
  CheckSquare,
  FileSpreadsheet,
  AlertCircle,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export function getNotificationRoute(notification: NotificationItem): string {
  const model = notification.refModel?.toLowerCase() || "";
  const refId = notification.refId || "";

  if (model.includes("delivery")) {
    return "/delivery-tracking";
  }
  if (model.includes("material")) {
    return refId ? `/material-view-page?id=${refId}` : "/materials";
  }
  if (model.includes("project")) {
    return refId ? `/project-view-page?id=${refId}` : "/projects";
  }
  if (model.includes("task")) {
    return "/tasks";
  }
  if (model.includes("drawing")) {
    return "/drawing-attachment";
  }
  if (model.includes("chat") || model.includes("communication")) {
    return "/communication";
  }

  // Fallback by notification type
  const type = notification.type?.toLowerCase() || "";
  if (type === "delivery") return "/delivery-tracking";
  if (type === "material_request") return refId ? `/material-view-page?id=${refId}` : "/materials";
  if (type === "task" || type === "followup") return "/tasks";
  if (type === "drawing") return "/drawing-attachment";
  if (type === "chat") return "/communication";
  if (type === "escalation") return "/tasks";

  return "/notifications";
}

export function formatNotificationTime(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export interface NotificationTypeStyle {
  icon: LucideIcon;
  bg: string;
  text: string;
  label: string;
}

export function getNotificationTypeConfig(type: string): NotificationTypeStyle {
  const normalized = (type || "").toLowerCase();

  switch (normalized) {
    case "lead":
      return { icon: UserPlus, bg: "bg-blue-100", text: "text-blue-600", label: "Lead" };
    case "task":
      return { icon: CheckSquare, bg: "bg-purple-100", text: "text-purple-600", label: "Task" };
    case "meeting":
      return { icon: Calendar, bg: "bg-cyan-100", text: "text-cyan-600", label: "Meeting" };
    case "escalation":
      return { icon: AlertTriangle, bg: "bg-red-100", text: "text-red-600", label: "Escalation" };
    case "payment":
      return { icon: DollarSign, bg: "bg-green-100", text: "text-green-600", label: "Payment" };
    case "drawing":
      return { icon: FileSpreadsheet, bg: "bg-indigo-100", text: "text-indigo-600", label: "Drawing" };
    case "delivery":
      return { icon: Truck, bg: "bg-amber-100", text: "text-amber-600", label: "Delivery" };
    case "followup":
      return { icon: Clock, bg: "bg-yellow-100", text: "text-yellow-600", label: "Followup" };
    case "material_request":
      return { icon: Package, bg: "bg-teal-100", text: "text-teal-600", label: "Material Request" };
    case "quotation":
      return { icon: FileText, bg: "bg-emerald-100", text: "text-emerald-600", label: "Quotation" };
    case "invoice":
      return { icon: FileText, bg: "bg-blue-100", text: "text-blue-700", label: "Invoice" };
    case "freight_bid":
      return { icon: Truck, bg: "bg-orange-100", text: "text-orange-600", label: "Freight Bid" };
    case "chat":
      return { icon: MessageSquare, bg: "bg-sky-100", text: "text-sky-600", label: "Chat" };
    case "system":
      return { icon: AlertCircle, bg: "bg-gray-100", text: "text-gray-600", label: "System" };
    default:
      return { icon: Bell, bg: "bg-gray-100", text: "text-gray-600", label: type || "Notification" };
  }
}
