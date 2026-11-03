import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfileApi,
  updateProfileApi,
  changePasswordApi,
  updateNotificationSettingsApi,
} from "./profile.api";
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateNotificationSettingsRequest,
} from "./profile.types";

export const PROFILE_QUERY_KEY = ["profile"] as const;

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfileApi,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateProfileApi(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedProfile);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => changePasswordApi(payload),
  });
}

export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationSettingsRequest) =>
      updateNotificationSettingsApi(payload),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          notificationSettings: updatedSettings,
        };
      });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
