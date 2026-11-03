import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/react";
import bgImage from "../../assets/AuthBackgroundImg.jpg";
import { useNavigate } from "react-router-dom";
import Input from "../common/Input";
import Button from "../common/Button";
import { getApiErrorMessage } from "../../lib/api-error";
import {
  loginWithEmailSchema,
  type LoginWithEmailInput,
} from "../../schema/login.schema";
import { useLoginMutation } from "../../modules/auth/auth.hooks";

function Login() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginWithEmailInput>({
    resolver: zodResolver(loginWithEmailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync: loginMutateAsync, isPending } = useLoginMutation();

  const onSubmit = async (data: LoginWithEmailInput) => {
    clearErrors("root");
    try {
      await loginMutateAsync({
        email: data.email.trim(),
        password: data.password.trim(),
      });
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to log in");
      setError("root", { type: "server", message });
      Sentry.captureMessage("Failed sign-in attempt", {
        level: "warning",
        extra: {
          statusCode: 200,
          authProvider: "local",
          email: data.email,
          responseMessage: message,
        },
      });
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-[500px] bg-white rounded-[10px] shadow-2xl p-4 sm:p-10 md:p-12 relative z-10 mx-auto">
        <div className="text-center mb-10">
          <h1 className="md:text-2xl text-xl text-[#1d7bd8] sm:text-3xl font-medium mb-2">
            Sign In
          </h1>
          <p className="text-(--text-color-gray) text-sm sm:text-base">
            Let's build something great
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            id="email"
            label="E-mail"
            type="text"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="space-y-1">
            <Input
              id="password"
              label="Password"
              type="password"
              isPassword
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          {errors.root && (
            <p className="text-sm text-red-500 font-medium text-center">
              {errors.root.message}
            </p>
          )}

          <Button
            title="Login"
            type="submit"
            className="w-full"
            loading={isPending}
            disabled={isPending}
          />

          <div className="flex justify-end pt-2">
            <span
              onClick={() => navigate("/forgot-password")}
              className="text-sm font-normal text-[#1d7bd8] hover:opacity-80 transition-colors cursor-pointer"
            >
              Forgot Password?
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
