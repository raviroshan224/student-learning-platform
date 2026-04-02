"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import client from "@/services/api/client";

type Step = 1 | 2 | 3;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2 – OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3 – new password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // ── Step 1: submit email ──────────────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    try {
      await client.post("/auth/forgot/password", { email });
      toast.success("OTP sent to your email.");
      setCountdown(60);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to send OTP.");
    } finally {
      setEmailLoading(false);
    }
  }

  // ── Step 2: OTP input helpers ─────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleOtpSubmit() {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    setOtpLoading(true);
    try {
      await client.post("/auth/verify/otp", { email, otp: code });
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Invalid OTP.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await client.post("/auth/forgot/password", { email });
      toast.success("OTP resent.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  }

  // ── Step 3: new password ──────────────────────────────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");

    let valid = true;
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      valid = false;
    }
    if (!valid) return;

    setPasswordLoading(true);
    try {
      await client.post("/auth/reset/password", {
        email,
        otp: otp.join(""),
        password,
        confirmPassword,
      });
      toast.success("Password reset successfully.");
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to reset password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // ── Step 1 UI ─────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
            <KeyRound className="h-6 w-6 text-[var(--color-primary-600)]" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we will send you a one-time code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-xs text-[var(--color-danger)]">{emailError}</p>
              )}
            </div>
            <Button type="submit" className="w-full" loading={emailLoading} disabled={emailLoading}>
              Send OTP
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
            <Link href={ROUTES.LOGIN} className="text-[var(--color-primary-600)] hover:underline">
              Back to Login
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Step 2 UI ─────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
            <KeyRound className="h-6 w-6 text-[var(--color-primary-600)]" />
          </div>
          <CardTitle className="text-2xl">Enter OTP</CardTitle>
          <CardDescription>
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[var(--foreground)]">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
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

          <Button
            className="w-full"
            onClick={handleOtpSubmit}
            loading={otpLoading}
            disabled={otpLoading}
          >
            Verify OTP
          </Button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Resend OTP in{" "}
                <span className="font-medium text-[var(--color-primary-600)]">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-[var(--color-primary-600)] hover:underline disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>

          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mx-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change email
          </button>
        </CardContent>
      </Card>
    );
  }

  // ── Step 3 UI ─────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <KeyRound className="h-6 w-6 text-[var(--color-primary-600)]" />
        </div>
        <CardTitle className="text-2xl">New Password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">New Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {passwordError && (
              <p className="text-xs text-[var(--color-danger)]">{passwordError}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmError && (
              <p className="text-xs text-[var(--color-danger)]">{confirmError}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={passwordLoading} disabled={passwordLoading}>
            Reset Password
          </Button>
        </form>

        <button
          onClick={() => setStep(2)}
          className="mt-4 flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mx-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse h-80 rounded-[var(--radius-lg)] bg-[var(--muted)]" />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
