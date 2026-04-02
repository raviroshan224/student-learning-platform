"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import { useState, Suspense } from "react";

import { loginSchema, type LoginFormData } from "@/lib/validators/auth.schema";
import { ROUTES } from "@/lib/constants/routes";
import { CONFIG } from "@/lib/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/features/auth/hooks/useAuthActions";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: loginMutation, isPending } = useLogin();

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
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <BookOpen className="h-6 w-6 text-[var(--color-primary-600)]" />
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your {CONFIG.APP_NAME} account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
            <Input
              type="email"
              placeholder="you@student.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
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

          <div className="flex items-center justify-end">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-[var(--color-primary-600)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting || isPending}>
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.REGISTER} className="text-[var(--color-primary-600)] font-medium hover:underline">
            Sign up free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-[var(--radius-lg)] bg-[var(--muted)]" />}>
      <LoginForm />
    </Suspense>
  );
}
