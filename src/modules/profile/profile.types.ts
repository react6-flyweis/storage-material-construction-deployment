export type UserRole =
  | "admin"
  | "sales"
  | "account"
  | "plant"
  | "construction"
  | string;

export interface NotificationSettings {
  twoFactorAuth?: boolean;
  emailNotification?: boolean;
  smsNotification?: boolean;
  dashboardNotifications?: boolean;
  weeklyEmailReports?: boolean;
  systemAlerts?: boolean;
  loginAlertsViaMail?: boolean;
  [key: string]: boolean | undefined;
}

export const DEFAULT_NOTIFICATION_SETTINGS: Required<NotificationSettings> = {
  twoFactorAuth: false,
  emailNotification: true,
  smsNotification: false,
  dashboardNotifications: true,
  weeklyEmailReports: false,
  systemAlerts: true,
  loginAlertsViaMail: true,
};

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  location?: string;
  isActive: boolean;
  isMainAdmin?: boolean;
  notificationSettings?: NotificationSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetProfileApiResponse {
  success: boolean;
  message: string;
  data: {
    profile: UserProfile;
    user?: UserProfile;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
  location?: string;
}

export interface UpdateProfileApiResponse {
  success: boolean;
  message: string;
  data: {
    profile: UserProfile;
    user?: UserProfile;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordApiResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export type UpdateNotificationSettingsRequest = Partial<NotificationSettings>;

export interface UpdateNotificationSettingsApiResponse {
  success: boolean;
  message: string;
  data: {
    notificationSettings: NotificationSettings;
  };
}
