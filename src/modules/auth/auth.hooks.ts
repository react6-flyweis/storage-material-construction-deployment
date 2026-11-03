import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation, useSearchParams, type To } from "react-router-dom";
import {
  loginWithEmailApi,
  forgotPasswordApi,
  verifyOtpApi,
  resetPasswordApi,
} from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import type { LoginWithEmailInput } from "@/schema/login.schema";
import type { AuthResponse } from "@/types/auth.types";

export function useLoginMutation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: LoginWithEmailInput) => {
      const response = await loginWithEmailApi(payload);
      const responseData = response.data as AuthResponse;

      if (!responseData?.success || !responseData?.data) {
        throw new Error(responseData?.message || "Failed to log in");
      }

      const { accessToken, refreshToken, role } = responseData.data;

      if (role !== "construction") {
        throw new Error(
          "Access denied. Only construction roles are authorized to sign in."
        );
      }

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response from server. Token is missing.");
      }

      return responseData.data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      const from = (location.state as { from?: To } | null)?.from;
      const redirect = searchParams.get("redirect");
      const isAuthPath = (target?: To | null) => {
        if (!target) return true;
        const path = typeof target === "string" ? target : target.pathname;
        return path === "/login" || path === "/";
      };

      const destination =
        (!isAuthPath(from) ? from : null) ||
        (!isAuthPath(redirect) ? redirect : null) ||
        "/dashboard";

      navigate(destination, { replace: true });
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string; role?: string }) => {
      const response = await forgotPasswordApi({
        email: payload.email,
        role: payload.role || "construction",
      });
      return response.data as {
        success: boolean;
        message: string;
        data?: unknown;
      };
    },
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string; otp: string }) => {
      const response = await verifyOtpApi(payload);
      return response.data as {
        success: boolean;
        message?: string;
        data?: { resetToken?: string };
      };
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { resetToken: string; newPassword: string }) => {
      const response = await resetPasswordApi(payload);
      return response.data as {
        success: boolean;
        message?: string;
        data?: unknown;
      };
    },
  });
}
