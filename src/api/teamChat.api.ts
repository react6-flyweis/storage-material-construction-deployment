import { axiosInstance } from "./axiosInstance";
import type { TeamMessage, TeamAttachment } from "../types/communication";

export interface ChatUser {
  _id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  department?: string;
  status?: "Online" | "Offline" | "Away";
  unreadCount?: number;
}

export interface ChatGroupMember {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
}

export interface ChatGroupDetails {
  _id: string;
  name: string;
  avatar?: string;
  members: ChatGroupMember[];
  admins?: ChatGroupMember[];
  createdBy?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatConversation {
  type: "direct" | "group";
  userId?: string;
  groupId?: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  memberCount?: number;
  isAdmin?: boolean;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface UnreadCountResponse {
  count: number;
  total: number;
  direct: number;
  group: number;
  byConversation?: Record<string, number>;
}

export interface MessagesResponse {
  messages: TeamMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getUsersProvider(search?: string): Promise<ChatUser[]> {
  const response = await axiosInstance.get(
    `/team-chat/users${search ? `?search=${encodeURIComponent(search)}` : ""}`
  );
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.data && "users" in data.data && Array.isArray(data.data.users)) {
    return data.data.users;
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function getConversationsProvider(): Promise<ChatConversation[]> {
  const response = await axiosInstance.get("/team-chat/conversations");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.data && "conversations" in data.data && Array.isArray(data.data.conversations)) {
    return data.data.conversations;
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function getUnreadCountProvider(): Promise<UnreadCountResponse> {
  const response = await axiosInstance.get("/team-chat/unread-count");
  const raw = response.data?.data ?? response.data ?? {};
  const total = raw.count ?? raw.total ?? 0;
  return {
    count: total,
    total: total,
    direct: raw.direct ?? 0,
    group: raw.group ?? 0,
    byConversation: raw.byConversation,
  };
}

export async function getDirectMessagesProvider({
  userId,
  page = 1,
  limit = 50,
}: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<MessagesResponse> {
  const response = await axiosInstance.get(
    `/team-chat/direct/${userId}/messages?page=${page}&limit=${limit}`
  );
  const payload = (response.data && "data" in response.data ? response.data.data : response.data) ?? {};

  if (Array.isArray(payload)) {
    return {
      messages: payload,
      total: payload.length,
      page: 1,
      limit,
      hasMore: false,
    };
  }
  if ("messages" in payload && Array.isArray(payload.messages)) {
    return {
      messages: payload.messages,
      total: payload.total ?? payload.messages.length,
      page: payload.page ?? 1,
      limit: payload.limit ?? limit,
      hasMore: payload.hasMore ?? false,
    };
  }
  if ("message" in payload && payload.message) {
    return {
      messages: [payload.message],
      total: 1,
      page: 1,
      limit,
      hasMore: false,
    };
  }
  return {
    messages: [],
    total: 0,
    page: 1,
    limit,
    hasMore: false,
  };
}

export async function sendDirectMessageProvider({
  userId,
  content,
  attachments,
}: {
  userId: string;
  content?: string;
  attachments?: TeamAttachment[];
}): Promise<TeamMessage> {
  const response = await axiosInstance.post(`/team-chat/direct/${userId}/messages`, {
    content: content || "",
    attachments: attachments || [],
  });
  return response.data?.data?.message || response.data?.data || response.data;
}

export async function getGroupMessagesProvider({
  groupId,
  page = 1,
  limit = 50,
}: {
  groupId: string;
  page?: number;
  limit?: number;
}): Promise<MessagesResponse> {
  const response = await axiosInstance.get(
    `/team-chat/groups/${groupId}/messages?page=${page}&limit=${limit}`
  );
  const payload = (response.data && "data" in response.data ? response.data.data : response.data) ?? {};

  if (Array.isArray(payload)) {
    return {
      messages: payload,
      total: payload.length,
      page: 1,
      limit,
      hasMore: false,
    };
  }
  if ("messages" in payload && Array.isArray(payload.messages)) {
    return {
      messages: payload.messages,
      total: payload.total ?? payload.messages.length,
      page: payload.page ?? 1,
      limit: payload.limit ?? limit,
      hasMore: payload.hasMore ?? false,
    };
  }
  if ("message" in payload && payload.message) {
    return {
      messages: [payload.message],
      total: 1,
      page: 1,
      limit,
      hasMore: false,
    };
  }
  return {
    messages: [],
    total: 0,
    page: 1,
    limit,
    hasMore: false,
  };
}

export async function sendGroupMessageProvider({
  groupId,
  content,
  attachments,
}: {
  groupId: string;
  content?: string;
  attachments?: TeamAttachment[];
}): Promise<TeamMessage> {
  const response = await axiosInstance.post(`/team-chat/groups/${groupId}/messages`, {
    content: content || "",
    attachments: attachments || [],
  });
  return response.data?.data?.message || response.data?.data || response.data;
}

export async function createGroupProvider({
  name,
  memberIds,
}: {
  name: string;
  memberIds: string[];
}): Promise<ChatGroupDetails> {
  const response = await axiosInstance.post("/team-chat/groups", {
    name,
    memberIds,
  });
  return response.data?.data?.group || response.data?.data || response.data;
}

export async function getGroupDetailsProvider(groupId: string): Promise<ChatGroupDetails> {
  const response = await axiosInstance.get(`/team-chat/groups/${groupId}`);
  const data = response.data;
  if (data?.data && "group" in data.data && data.data.group) {
    return data.data.group;
  }
  if (data?.data) {
    return data.data as ChatGroupDetails;
  }
  return {
    _id: "",
    name: "",
    members: [],
    admins: [],
  };
}

export async function updateGroupMembersProvider({
  groupId,
  members,
  addMemberIds,
  removeMemberIds,
}: {
  groupId: string;
  members?: string[];
  addMemberIds?: string[];
  removeMemberIds?: string[];
}): Promise<void> {
  const body = addMemberIds || removeMemberIds
    ? { addMemberIds, removeMemberIds }
    : { members };
  await axiosInstance.put(`/team-chat/groups/${groupId}/members`, body);
}
