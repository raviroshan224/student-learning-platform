"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useState } from "react";

import { registerSchema, type RegisterFormData } from "@/lib/validators/auth.schema";
import { ROUTES } from "@/lib/constants/routes";
import { CONFIG } from "@/lib/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/features/auth/hooks/useAuthActions";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: registerMutation, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      hasConfirmedToTerms: true,
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation(data);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const e = err.response.data.errors;
        if (e.field && e.message) {
          setError(e.field as keyof RegisterFormData, { message: e.message });
        } else {
          Object.keys(e).forEach((key) => {
            setError(key as keyof RegisterFormData, { message: e[key] });
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Create your account</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Start your learning journey on {CONFIG.APP_NAME}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Full Name</label>
          <Input
            placeholder="Jane Doe"
            autoComplete="name"
            className="rounded-lg border-[var(--border)]"
            {...register("fullName")}
          />
          {errors.fullName && <p className="text-xs text-[var(--color-danger)]">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Email address</label>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="rounded-lg border-[var(--border)]"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Mobile Number</label>
          <Input
            type="tel"
            placeholder="0000000000"
            autoComplete="tel"
            className="rounded-lg border-[var(--border)]"
            {...register("mobileNumber")}
          />
          {errors.mobileNumber && <p className="text-xs text-[var(--color-danger)]">{errors.mobileNumber.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Min 6 characters"
              className="pr-10 rounded-lg border-[var(--border)]"
              autoComplete="new-password"
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
          {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Confirm Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="rounded-lg border-[var(--border)]"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-[var(--color-danger)]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2 py-1">
          <input
            type="checkbox"
            id="terms"
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-600)]"
            {...register("hasConfirmedToTerms")}
          />
          <label htmlFor="terms" className="text-sm text-[var(--muted-foreground)]">
            I agree to the{" "}
            <a href="#" className="text-[var(--color-primary-600)] hover:underline">Terms and Conditions</a>
          </label>
        </div>
        {errors.hasConfirmedToTerms && (
          <p className="text-xs text-[var(--color-danger)]">{errors.hasConfirmedToTerms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg h-11 text-sm font-semibold"
          loading={isSubmitting || isPending}
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="text-[var(--color-primary-600)] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
