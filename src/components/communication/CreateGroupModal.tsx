import React, { useState, useMemo } from "react";
import { Search, X, Users, Check, Loader2 } from "lucide-react";
import type { ChatUser } from "@/api/teamChat.api";
import { useCreateGroupMutation } from "@/modules/team-chat/team-chat.hooks";
import { toast } from "react-hot-toast";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: ChatUser[];
  isLoadingUsers: boolean;
  currentUserId?: string;
  onGroupCreated?: (groupId: string, name: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  users,
  isLoadingUsers,
  currentUserId,
  onGroupCreated,
}) => {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const createGroupMutation = useCreateGroupMutation();

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = users.filter((u) => u._id !== currentUserId);
    if (!q) return list;
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, search, currentUserId]);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    try {
      const res = await createGroupMutation.mutateAsync({
        name: trimmed,
        memberIds: selectedIds,
      });
      toast.success("Group created successfully");
      setName("");
      setSelectedIds([]);
      onClose();
      if (res?._id && onGroupCreated) {
        onGroupCreated(res._id, trimmed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create group";
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[#051321] text-base">Create New Group</h3>
              <p className="text-xs text-gray-500">Form a team chat channel with colleagues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
          {/* Group Name input */}
          <div className="p-4 border-b border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Alpha Team, Plant Dispatch..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>

          {/* Member Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff to add..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Members Multi-select List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-gray-50">
            {isLoadingUsers ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" />
                Loading staff...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No matching staff found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleSelect(user._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#051321] truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize truncate">
                          {user.role || "Staff"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {selectedIds.length} member{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createGroupMutation.isPending || !name.trim() || selectedIds.length === 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {createGroupMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Group</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
