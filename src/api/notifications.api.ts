import { axiosInstance } from "./axiosInstance";
import type {
  NotificationsQueryParams,
  NotificationsListResponse,
  UnreadNotificationCountResponse,
  NotificationActionResponse,
} from "../types/notifications.types";

export async function getNotificationsProvider(
  params?: NotificationsQueryParams
): Promise<NotificationsListResponse> {
  const queryParams: Record<string, string | number> = {};

  if (params?.page !== undefined) queryParams.page = params.page;
  if (params?.limit !== undefined) queryParams.limit = params.limit;
  if (params?.type) queryParams.type = params.type;
  if (params?.priority) queryParams.priority = params.priority;
  if (params?.read !== undefined && params.read !== "") queryParams.read = params.read;

  const response = await axiosInstance.get<NotificationsListResponse>(
    "/notifications",
    { params: queryParams }
  );
  return response.data;
}

export async function getUnreadNotificationCountProvider(): Promise<UnreadNotificationCountResponse> {
  const response = await axiosInstance.get<UnreadNotificationCountResponse>(
    "/notifications/unread-count"
  );
  return response.data;
}

export async function markNotificationReadProvider(
  id: string
): Promise<NotificationActionResponse> {
  const response = await axiosInstance.put<NotificationActionResponse>(
    `/notifications/${id}/read`
  );
  return response.data;
}

export async function markAllNotificationsReadProvider(): Promise<NotificationActionResponse> {
  const response = await axiosInstance.put<NotificationActionResponse>(
    "/notifications/read-all"
  );
  return response.data;
}

export async function deleteNotificationProvider(
  id: string
): Promise<NotificationActionResponse> {
  const response = await axiosInstance.delete<NotificationActionResponse>(
    `/notifications/${id}`
  );
  return response.data;
}
