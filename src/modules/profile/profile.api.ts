import { axiosInstance } from "@/api/axiosInstance";
import { useAuthStore } from "@/store/authStore";
import type {
  UserProfile,
  GetProfileApiResponse,
  UpdateProfileRequest,
  UpdateProfileApiResponse,
  ChangePasswordRequest,
  ChangePasswordApiResponse,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsApiResponse,
  NotificationSettings,
} from "./profile.types";

/**
 * Fetch current user profile (includes notificationSettings)
 * GET /api/profile
 */
export async function getProfileApi(): Promise<UserProfile> {
  const response = await axiosInstance.get<GetProfileApiResponse | UserProfile>(
    "/profile"
  );
  const raw = response.data as any;
  const profile = raw?.data?.profile || raw?.profile || raw?.data || raw;
  return profile as UserProfile;
}

/**
 * Update current user profile
 * PUT /api/profile
 * Send only fields to change (at least one): name, email, phone, mobile, avatar
 */
export async function updateProfileApi(
  payload: UpdateProfileRequest
): Promise<UserProfile> {
  const cleanPayload: Record<string, string> = {};
  if (payload.name !== undefined) cleanPayload.name = payload.name;
  if (payload.email !== undefined) cleanPayload.email = payload.email;
  if (payload.phone !== undefined) cleanPayload.phone = payload.phone;
  if (payload.mobile !== undefined) cleanPayload.mobile = payload.mobile;
  if (payload.avatar !== undefined) cleanPayload.avatar = payload.avatar;
  if (payload.location !== undefined) cleanPayload.location = payload.location;

  const response = await axiosInstance.put<UpdateProfileApiResponse | UserProfile>(
    "/profile",
    cleanPayload
  );
  const raw = response.data as any;
  const profile = (raw?.data?.profile || raw?.profile || raw?.data || raw) as UserProfile;

  // Sync auth store if user session exists
  if (profile) {
    const state = useAuthStore.getState();
    if (state.token && state.refreshToken && state.user) {
      state.setAuth(state.token, state.refreshToken, {
        ...state.user,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      });
    }
  }

  return profile;
}

/**
 * Change current user password
 * PUT /api/profile/password
 * Body: { currentPassword, newPassword }
 */
export async function changePasswordApi(
  payload: ChangePasswordRequest
): Promise<ChangePasswordApiResponse> {
  try {
    const response = await axiosInstance.put<ChangePasswordApiResponse>(
      "/profile/password",
      payload
    );
    return response.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr?.response?.status === 404) {
      const fallbackResponse = await axiosInstance.put<ChangePasswordApiResponse>(
        "/auth/change-password",
        payload
      );
      return fallbackResponse.data;
    }
    throw err;
  }
}

/**
 * Update notification toggles
 * PUT /api/profile/notification-settings
 * Allowed keys: twoFactorAuth, emailNotification, smsNotification,
 * dashboardNotifications, weeklyEmailReports, systemAlerts, loginAlertsViaMail
 */
export async function updateNotificationSettingsApi(
  payload: UpdateNotificationSettingsRequest
): Promise<NotificationSettings> {
  const response = await axiosInstance.put<
    UpdateNotificationSettingsApiResponse | NotificationSettings
  >("/profile/notification-settings", payload);

  const raw = response.data as any;
  const notificationSettings = (raw?.data?.notificationSettings ||
    raw?.notificationSettings ||
    raw?.data ||
    raw) as NotificationSettings;

  return notificationSettings;
}
