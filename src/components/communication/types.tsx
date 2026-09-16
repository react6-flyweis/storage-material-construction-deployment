import React from "react";
import { Megaphone, BarChart2, Hammer, Factory, DollarSign, UsersRound } from "lucide-react";
import type { ChatUser } from "@/api/teamChat.api";

export interface ActiveChatState {
  type: "direct" | "group";
  id: string; // userId or groupId
  name: string;
  role?: string;
  avatar?: string;
  category?: string;
  membersCount?: number;
  members?: ChatUser[];
  color?: string;
}

export const getDepartmentIcon = (category?: string): React.ReactElement => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("project")) {
    return <Megaphone size={18} className="text-white" />;
  }
  if (cat.includes("plant") || cat.includes("manufacturing")) {
    return <Factory size={18} className="text-white" />;
  }
  if (cat.includes("finance") || cat.includes("account") || cat.includes("costing")) {
    return <DollarSign size={18} className="text-white" />;
  }
  if (cat.includes("construction")) {
    return <Hammer size={18} className="text-white" />;
  }
  if (cat.includes("sales") || cat.includes("market")) {
    return <BarChart2 size={18} className="text-white" />;
  }
  return <UsersRound size={18} className="text-white" />;
};

export const formatMessageTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatMessageDateHeader = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};
