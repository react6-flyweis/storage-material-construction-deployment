import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotificationsProvider,
  getUnreadNotificationCountProvider,
  markNotificationReadProvider,
  markAllNotificationsReadProvider,
  deleteNotificationProvider,
} from "@/api/notifications.api";
import type { NotificationsQueryParams } from "@/types/notifications.types";

export function useNotificationsQuery(
  params?: NotificationsQueryParams,
  options?: { refetchInterval?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: () => getNotificationsProvider(params),
    refetchInterval: options?.refetchInterval ?? 15000,
    enabled: options?.enabled ?? true,
  });
}

export function useUnreadNotificationCountQuery(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await getUnreadNotificationCountProvider();
      const raw = res?.data;
      if (typeof raw === "number") {
        return raw;
      }
      if (raw && typeof raw === "object") {
        return raw.count ?? raw.unread ?? 0;
      }
      return 0;
    },
    refetchInterval: options?.refetchInterval ?? 15000,
    enabled: options?.enabled ?? true,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationReadProvider(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsReadProvider(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotificationProvider(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
