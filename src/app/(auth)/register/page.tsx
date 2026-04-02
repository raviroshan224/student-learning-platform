"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import { useState } from "react";

import { registerSchema, type RegisterFormData } from "@/lib/validators/auth.schema";
import { ROUTES } from "@/lib/constants/routes";
import { CONFIG } from "@/lib/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      hasConfirmedToTerms: true, // Default to true for simplicity
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
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <BookOpen className="h-6 w-6 text-[var(--color-primary-600)]" />
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Start your learning journey on {CONFIG.APP_NAME}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name</label>
            <Input placeholder="Jane Doe" autoComplete="name" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-[var(--color-danger)]">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Mobile Number</label>
            <Input type="tel" placeholder="0000000000" autoComplete="tel" {...register("mobileNumber")} />
            {errors.mobileNumber && <p className="text-xs text-[var(--color-danger)]">{errors.mobileNumber.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                className="pr-10"
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-[var(--color-danger)]">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <input 
              type="checkbox" 
              id="terms" 
              className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
              {...register("hasConfirmedToTerms")}
            />
            <label htmlFor="terms" className="text-sm text-[var(--muted-foreground)]">
              I agree to the <a href="#" className="underline">Terms and Conditions</a>
            </label>
            {errors.hasConfirmedToTerms && (
              <p className="text-xs text-[var(--color-danger)] block w-full">{errors.hasConfirmedToTerms.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting || isPending}>
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link href={ROUTES.LOGIN} className="text-[var(--color-primary-600)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
