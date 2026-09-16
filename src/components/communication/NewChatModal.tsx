import React, { useState, useMemo } from "react";
import { Search, X, MessageSquarePlus, User, Loader2 } from "lucide-react";
import type { ChatUser } from "@/api/teamChat.api";
import type { ActiveChatState } from "./types";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: ChatUser[];
  isLoadingUsers: boolean;
  onSelectUser: (chat: ActiveChatState) => void;
  currentUserId?: string;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  users,
  isLoadingUsers,
  onSelectUser,
  currentUserId,
}) => {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = users.filter((u) => u._id !== currentUserId);
    if (!q) return list;
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
    );
  }, [users, search, currentUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[#051321] text-base">New Direct Message</h3>
              <p className="text-xs text-gray-500">Select a team member to start chatting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, or email..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-gray-50">
          {isLoadingUsers ? (
            <div className="p-8 text-center text-xs text-gray-400">
              <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" />
              Loading team directory...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No staff members found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  onSelectUser({
                    type: "direct",
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                  });
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/60 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-gray-200">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#051321] group-hover:text-blue-600 transition-colors truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize truncate">
                      {user.role || "Staff"} {user.department ? `• ${user.department}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-2xs">
                  Chat
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{filteredUsers.length} staff members available</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
