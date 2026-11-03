import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsersProvider,
  getConversationsProvider,
  getUnreadCountProvider,
  getDirectMessagesProvider,
  getGroupMessagesProvider,
  getGroupDetailsProvider,
  createGroupProvider,
  updateGroupMembersProvider,
  type ChatUser,
  type ChatConversation,
  type UnreadCountResponse,
  type MessagesResponse,
  type ChatGroupDetails,
} from "@/api/teamChat.api";

export const chatQueryKeys = {
  all: ["team-chat"] as const,
  users: (search?: string) => ["team-chat", "users", search] as const,
  conversations: () => ["team-chat", "conversations"] as const,
  unreadCount: () => ["team-chat", "unread-count"] as const,
  directMessages: (userId: string, page = 1, limit = 50) =>
    ["team-chat", "messages", "direct", userId, page, limit] as const,
  groupMessages: (groupId: string, page = 1, limit = 50) =>
    ["team-chat", "messages", "group", groupId, page, limit] as const,
  groupDetails: (groupId: string) => ["team-chat", "group-details", groupId] as const,
};

export function useChatUsersQuery(search?: string) {
  return useQuery<ChatUser[]>({
    queryKey: chatQueryKeys.users(search),
    queryFn: () => getUsersProvider(search),
  });
}

export function useChatConversationsQuery() {
  return useQuery<ChatConversation[]>({
    queryKey: chatQueryKeys.conversations(),
    queryFn: () => getConversationsProvider(),
  });
}

export function useChatUnreadCountQuery(options?: { refetchInterval?: number }) {
  return useQuery<UnreadCountResponse>({
    queryKey: chatQueryKeys.unreadCount(),
    queryFn: () => getUnreadCountProvider(),
    refetchInterval: options?.refetchInterval ?? 15000,
  });
}

export function useDirectMessagesQuery(
  userId: string,
  options?: { page?: number; limit?: number; enabled?: boolean }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const isEnabled = options?.enabled !== undefined ? options.enabled : Boolean(userId);

  return useQuery<MessagesResponse>({
    queryKey: chatQueryKeys.directMessages(userId, page, limit),
    queryFn: () => getDirectMessagesProvider({ userId, page, limit }),
    enabled: isEnabled,
  });
}

export function useGroupMessagesQuery(
  groupId: string,
  options?: { page?: number; limit?: number; enabled?: boolean }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const isEnabled = options?.enabled !== undefined ? options.enabled : Boolean(groupId);

  return useQuery<MessagesResponse>({
    queryKey: chatQueryKeys.groupMessages(groupId, page, limit),
    queryFn: () => getGroupMessagesProvider({ groupId, page, limit }),
    enabled: isEnabled,
  });
}

export function useGroupDetailsQuery(groupId: string, enabled = true) {
  return useQuery<ChatGroupDetails>({
    queryKey: chatQueryKeys.groupDetails(groupId),
    queryFn: () => getGroupDetailsProvider(groupId),
    enabled: enabled && Boolean(groupId),
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, memberIds }: { name: string; memberIds: string[] }) =>
      createGroupProvider({ name, memberIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount() });
    },
  });
}

export function useUpdateGroupMembersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      groupId: string;
      members?: string[];
      addMemberIds?: string[];
      removeMemberIds?: string[];
    }) => updateGroupMembersProvider(params),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.groupDetails(groupId) });
    },
  });
}
