export type NotificationType =
  | "task"
  | "delivery"
  | "drawing"
  | "payment"
  | "meeting"
  | "material_request"
  | "lead"
  | "quotation"
  | "invoice"
  | "freight_bid"
  | "chat"
  | "system"
  | "escalation"
  | "followup"
  | string;

export type NotificationPriority = "high" | "medium" | "low" | string;

export interface NotificationItem {
  _id: string;
  userId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  refId?: string | null;
  refModel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  highPriority: number;
  today: number;
}

export interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  read?: string; // "true" | "false"
}

export interface NotificationsListData {
  notifications: NotificationItem[];
  total: number;
  stats: NotificationStats;
  page: number;
  limit: number;
}

export interface NotificationsListResponse {
  success: boolean;
  message: string;
  data: NotificationsListData;
}

export interface UnreadNotificationCountResponse {
  success: boolean;
  message: string;
  data: {
    count?: number;
    unread?: number;
  } | number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
