"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useState, Suspense } from "react";

import { loginSchema, type LoginFormData } from "@/lib/validators/auth.schema";
import { ROUTES } from "@/lib/constants/routes";
import { CONFIG } from "@/lib/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/hooks/useAuthActions";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? undefined;
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: loginMutation, isPending } = useLogin({ redirectTo });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation(data);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const e = err.response.data.errors;
        if (e.field && e.message) {
          setError(e.field as keyof LoginFormData, { message: e.message });
        } else {
          Object.keys(e).forEach((key) => {
            setError(key as keyof LoginFormData, { message: e[key] });
          });
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center">
          <GraduationCap className="h-7 w-7 text-[var(--color-primary-600)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Sign in to your {CONFIG.APP_NAME} account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Email address</label>
          <Input
            type="email"
            placeholder="you@student.com"
            autoComplete="email"
            className="rounded-lg border-[var(--border)] focus-visible:ring-[var(--color-primary-600)]"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--foreground)]">Password</label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-[var(--color-primary-600)] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-10 rounded-lg border-[var(--border)] focus-visible:ring-[var(--color-primary-600)]"
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg h-11 text-sm font-semibold"
          loading={isSubmitting || isPending}
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.REGISTER} className="text-[var(--color-primary-600)] font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-[var(--radius-lg)] bg-white border border-[var(--border)]" />}>
      <LoginForm />
    </Suspense>
  );
}
