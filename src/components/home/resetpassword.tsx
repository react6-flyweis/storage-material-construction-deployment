import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPasswordMutation } from "@/modules/auth/auth.hooks";
import { AuthLayout } from "@/components/auth-layout";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error";

interface ResetPasswordState {
  resetToken?: string;
  email?: string;
}

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResetPasswordState | null;

  // Retrieve resetToken from router state or query parameters (?token=...)
  const queryParams = new URLSearchParams(location.search);
  const resetToken = state?.resetToken || queryParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPasswordMutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setErrorMessage(null);

    if (!resetToken) {
      setErrorMessage(
        "Missing reset token. Please request a new OTP verification.",
      );
      return;
    }

    try {
      const response = await resetPasswordMutation.mutateAsync({
        resetToken,
        newPassword: data.newPassword,
      });

      if (!response.success) {
        setErrorMessage(
          response.message || "Failed to reset password. Please try again.",
        );
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "An error occurred while resetting password. Please try again.",
        ),
      );
    }
  };

  return (
    <AuthLayout
      title={isSuccess ? "Password Reset Successfully" : "Set New Password"}
      subtitle={
        isSuccess
          ? "Your password has been updated. You can now sign in with your new password."
          : "Please enter a new password for your account"
      }
    >
      {isSuccess ? (
        <div className="text-center my-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="mt-8">
            <Button
              onClick={() => navigate("/login", { replace: true })}
              className="h-12 w-full bg-[#1d7bd8] text-base font-medium text-white hover:bg-[#1668b8] cursor-pointer"
            >
              Proceed to Sign In
            </Button>
          </div>
        </div>
      ) : (
        <>
          {!resetToken ? (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
              <p className="font-medium">Reset Token Missing</p>
              <p className="mt-1 text-xs text-amber-700">
                Please complete the OTP verification step to get a valid reset session.
              </p>
              <Link
                to="/forgot-password"
                className="mt-3 inline-block rounded bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
              >
                Go to Forgot Password
              </Link>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="my-6 space-y-6">
            <div>
              <Label
                htmlFor="newPassword"
                className="text-sm font-medium text-gray-700"
              >
                New Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...register("newPassword")}
                  className="h-12 rounded-lg border-gray-200 pl-10 pr-10 placeholder:text-gray-400"
                  disabled={!resetToken}
                />
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.newPassword ? (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  {...register("confirmPassword")}
                  className="h-12 rounded-lg border-gray-200 pl-10 pr-10 placeholder:text-gray-400"
                  disabled={!resetToken}
                />
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending || !resetToken}
              className="h-12 w-full bg-[#1d7bd8] text-base font-medium text-white hover:bg-[#1668b8] cursor-pointer"
            >
              {resetPasswordMutation.isPending
                ? "Resetting Password..."
                : "Reset Password"}
            </Button>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#1d7bd8] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
