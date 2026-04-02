"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import client from "@/services/api/client";

type Step = "email" | "otp" | "password";

const emailSchema = z.object({ email: z.string().email("Enter a valid email") });
const passwordSchema = z
  .object({
    password: z.string().min(6, "Minimum 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email form
  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(emailSchema),
  });

  // Password form
  const passwordForm = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(passwordSchema),
  });

  // Countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  // Step 1: Send OTP to email
  const onEmailSubmit = async (data: { email: string }) => {
    try {
      await client.post("/auth/forgot/password", { email: data.email });
      setEmail(data.email);
      setResendCountdown(60);
      toast.success("OTP sent to your email.");
      setStep("otp");
    } catch (err: any) {
      const d = err.response?.data;
      const msg = d?.errors?.email ?? d?.errors?.message ?? d?.message ?? "Failed to send OTP.";
      emailForm.setError("email", { message: msg });
    }
  };

  // OTP input handlers
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    setOtpLoading(true);
    try {
      await client.post("/auth/verify/otp", { email, otp: code });
      toast.success("OTP verified.");
      setStep("password");
    } catch (err: any) {
      const d = err.response?.data;
      toast.error(d?.errors?.otp ?? d?.errors?.message ?? d?.message ?? "Invalid OTP.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    try {
      await client.post("/auth/forgot/password", { email });
      setResendCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.success("OTP resent.");
    } catch {
      toast.error("Failed to resend OTP.");
    }
  }

  // Step 3: Reset password
  const onPasswordSubmit = async (data: { password: string; confirmPassword: string }) => {
    const code = otp.join("");
    try {
      await client.post("/auth/reset/password", { email, otp: code, password: data.password });
      toast.success("Password reset successfully. Please log in.");
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      const d = err.response?.data;
      const msg = d?.errors?.otp ?? d?.errors?.password ?? d?.errors?.message ?? d?.message ?? "Failed to reset password.";
      passwordForm.setError("password", { message: msg });
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <KeyRound className="h-6 w-6 text-[var(--color-primary-600)]" />
        </div>
        <CardTitle className="text-2xl">
          {step === "email" && "Reset Password"}
          {step === "otp" && "Verify OTP"}
          {step === "password" && "Set New Password"}
        </CardTitle>
        <CardDescription>
          {step === "email" && "Enter your email to receive a reset code"}
          {step === "otp" && (
            <>Code sent to <span className="font-medium text-[var(--foreground)]">{email}</span></>
          )}
          {step === "password" && "Choose a strong new password"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-[var(--color-danger)]">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" loading={emailForm.formState.isSubmitting}>
              Send OTP
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              <Link href={ROUTES.LOGIN} className="text-[var(--color-primary-600)] hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] text-center text-lg font-bold text-[var(--foreground)] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
              ))}
            </div>
            <Button className="w-full" onClick={handleVerifyOtp} loading={otpLoading} disabled={otpLoading}>
              Verify OTP
            </Button>
            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Resend in <span className="font-medium text-[var(--color-primary-600)]">{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-sm text-[var(--color-primary-600)] hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
            <div className="text-center">
              <button
                onClick={() => setStep("email")}
                className="text-sm text-[var(--muted-foreground)] hover:underline"
              >
                Change email
              </button>
            </div>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  className="pr-10"
                  autoComplete="new-password"
                  {...passwordForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-[var(--color-danger)]">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-[var(--color-danger)]">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" loading={passwordForm.formState.isSubmitting}>
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
