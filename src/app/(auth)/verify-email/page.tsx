"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import client from "@/services/api/client";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    setLoading(true);
    try {
      await client.post("/auth/email/verify-otp", { email, otp: code });
      toast.success("Email verified! Please log in.");
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await client.post("/auth/email/send-verification", { email });
      toast.success("OTP resent.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to resend.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <Mail className="h-6 w-6 text-[var(--color-primary-600)]" />
        </div>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
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
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] text-center text-lg font-bold text-[var(--foreground)] focus:border-[var(--color-primary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)]"
            />
          ))}
        </div>

        <Button className="w-full" onClick={handleVerify} loading={loading} disabled={loading}>
          Verify Email
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

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          <Link href={ROUTES.LOGIN} className="text-[var(--color-primary-600)] hover:underline">
            Back to Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse h-80 rounded-[var(--radius-lg)] bg-[var(--muted)]" />
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
