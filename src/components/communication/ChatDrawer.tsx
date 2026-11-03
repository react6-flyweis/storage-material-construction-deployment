import React, { useState } from "react";
import { X, Image as ImageIcon, FileText, Download, Loader2, UserPlus, UserMinus } from "lucide-react";
import type { TeamAttachment } from "@/types/communication";
import type { ChatGroupDetails, ChatUser } from "@/api/teamChat.api";
import { type ActiveChatState, getDepartmentIcon } from "./types";
import { useUpdateGroupMembersMutation } from "@/modules/team-chat/team-chat.hooks";
import { toast } from "react-hot-toast";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeChat: ActiveChatState;
  drawerTab: "Members" | "Files";
  setDrawerTab: (tab: "Members" | "Files") => void;
  groupDetails?: ChatGroupDetails;
  isLoadingGroupDetails?: boolean;
  sharedFiles: TeamAttachment[];
  currentUserRole?: string;
  currentUserId?: string;
  allUsers?: ChatUser[];
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  activeChat,
  drawerTab,
  setDrawerTab,
  groupDetails,
  isLoadingGroupDetails,
  sharedFiles,
  currentUserRole,
  currentUserId,
  allUsers = [],
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAddUserId, setSelectedAddUserId] = useState("");
  const updateMembersMutation = useUpdateGroupMembersMutation();

  if (!isOpen) return null;

  const groupMembers = groupDetails?.members || [];
  const adminIds = new Set((groupDetails?.admins || []).map((a) => a._id));
  const memberCount = groupMembers.length || activeChat.membersCount || 0;
  const isCurrentUserAdmin = currentUserRole?.toLowerCase() === "admin";

  const nonMembers = allUsers.filter(
    (u) => !groupMembers.some((m) => m._id === u._id)
  );

  const handleAddMember = async () => {
    if (!selectedAddUserId) return;
    try {
      await updateMembersMutation.mutateAsync({
        groupId: activeChat.id,
        addMemberIds: [selectedAddUserId],
      });
      toast.success("Member added");
      setSelectedAddUserId("");
      setShowAddMember(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add member";
      toast.error(msg);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === currentUserId) {
      if (!confirm("Are you sure you want to leave this group?")) return;
    }
    try {
      await updateMembersMutation.mutateAsync({
        groupId: activeChat.id,
        removeMemberIds: [memberId],
      });
      toast.success("Member removed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove member";
      toast.error(msg);
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 lg:relative w-72 lg:w-80 border-l border-gray-200 bg-white flex flex-col shadow-2xl lg:shadow-none z-20 animate-in slide-in-from-right duration-300">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {activeChat.type === "group" ? "Group Details" : "User Info"}
        </span>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-6 text-center border-b border-gray-100">
        <div
          className={`w-16 h-16 ${
            activeChat.color || "bg-[#4285F4]"
          } rounded-2xl mx-auto flex items-center justify-center text-white shadow-md mb-3 overflow-hidden font-bold text-xl`}
        >
          {activeChat.type === "group" ? (
            getDepartmentIcon(activeChat.category)
          ) : activeChat.avatar ? (
            <img
              src={activeChat.avatar}
              alt={activeChat.name}
              className="w-full h-full object-cover"
            />
          ) : (
            activeChat.name.charAt(0).toUpperCase()
          )}
        </div>
        <h3 className="text-base font-bold text-[#051321]">{activeChat.name}</h3>
        <p className="text-xs text-[#637381] mt-0.5">
          {activeChat.type === "group"
            ? `${memberCount} members`
            : activeChat.role || "Staff Member"}
        </p>
      </div>

      {/* Drawer Tabs */}
      <div className="flex border-b border-gray-100 px-4">
        <button
          className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors cursor-pointer ${
            drawerTab === "Members" ? "text-[#4285F4]" : "text-gray-400"
          }`}
          onClick={() => setDrawerTab("Members")}
        >
          {activeChat.type === "group" ? `Members (${memberCount})` : "Details"}
          {drawerTab === "Members" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4285F4]" />
          )}
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors cursor-pointer ${
            drawerTab === "Files" ? "text-[#4285F4]" : "text-gray-400"
          }`}
          onClick={() => setDrawerTab("Files")}
        >
          Shared Files ({sharedFiles.length})
          {drawerTab === "Files" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4285F4]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {drawerTab === "Members" ? (
          activeChat.type === "group" ? (
            isLoadingGroupDetails ? (
              <div className="p-6 text-center text-xs text-gray-400">
                <Loader2 className="animate-spin h-5 w-5 mx-auto mb-2 text-blue-500" />
                Loading members...
              </div>
            ) : (
              <div className="space-y-3">
                {/* Admin Add Member Control */}
                {isCurrentUserAdmin && (
                  <div className="mb-3">
                    {!showAddMember ? (
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <UserPlus size={15} />
                        <span>Add Member</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
                        <select
                          value={selectedAddUserId}
                          onChange={(e) => setSelectedAddUserId(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {nonMembers.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowAddMember(false)}
                            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddMember}
                            disabled={!selectedAddUserId || updateMembersMutation.isPending}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {groupMembers.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-6">
                    No members found
                  </div>
                ) : (
                  groupMembers.map((member) => {
                    const isAdmin = adminIds.has(member._id);
                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group/item"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#051321] truncate">
                              {member.name}
                            </p>
                            <p className="text-[10px] text-gray-400 capitalize truncate">
                              {member.role || "Staff"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                              Admin
                            </span>
                          )}
                          {isCurrentUserAdmin && member._id !== currentUserId && (
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              title="Remove member"
                              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                            >
                              <UserMinus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Role:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {activeChat.role || "Staff"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          )
        ) : sharedFiles.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-10">
            No files shared in this chat yet
          </div>
        ) : (
          <div className="space-y-2">
            {sharedFiles.map((file, fIdx) => (
              <a
                key={fIdx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {file.type?.startsWith("image/") ? (
                  <ImageIcon size={18} className="text-blue-500 shrink-0" />
                ) : (
                  <FileText size={18} className="text-emerald-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {file.name}
                  </p>
                  {file.size && (
                    <p className="text-[10px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <Download size={14} className="text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
