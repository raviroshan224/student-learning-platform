"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthService } from "@/services/api/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { queryKeys } from "@/services/query/keys";
import { ROUTES } from "@/lib/constants/routes";
import type { UpdateProfilePayload, UpdatePasswordPayload, RegisterPayload } from "@/types/models/user";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      AuthService.login(email, password).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      toast.success("Welcome back!");
      // Check onboarding status
      if (data.user.hasSelectedCategories === false) {
        router.push("/select-categories");
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Invalid email or password.";
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      AuthService.register(payload).then((r) => r.data),
    onSuccess: (_data, variables) => {
      toast.success("Account created! Please verify your email.");
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      toast.error(msg);
    },
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      AuthService.verifyOtp(email, otp).then((r) => r.data),
    onSuccess: () => {
      toast.success("Email verified! Please log in.");
      router.push(ROUTES.LOGIN);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Invalid OTP.";
      toast.error(msg);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => AuthService.resendOtp(email).then((r) => r.data),
    onSuccess: () => toast.success("OTP resent."),
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => AuthService.forgotPassword(email).then((r) => r.data),
    onSuccess: () => toast.success("OTP sent to your email."),
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    },
  });
}

export function useVerifyResetOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      AuthService.verifyResetOtp(email, otp).then((r) => r.data),
    onSuccess: () => toast.success("OTP verified."),
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ email, otp, password }: { email: string; otp: string; password: string }) =>
      AuthService.resetPassword(email, otp, password).then((r) => r.data),
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      router.push(ROUTES.LOGIN);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSettled: () => {
      logout();
      qc.clear();
      router.push(ROUTES.LOGIN);
    },
  });
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: () => AuthService.getMe().then((r) => {
      setUser(r.data);
      return r.data;
    }),
    // Never fire without a token — prevents the /login → GET /auth/me → 401 loop
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    // Don't retry on auth failures; the interceptor already handles token refresh
    retry: false,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      AuthService.updateMe(payload).then((r) => r.data),
    onSuccess: (user) => {
      updateUser(user);
      qc.setQueryData(queryKeys.user.me(), user);
      toast.success("Profile updated.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update profile.";
      toast.error(msg);
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      AuthService.updatePassword(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success("Password updated.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to update password.";
      toast.error(msg);
    },
  });
}

export function useUploadProfilePicture() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (file: File) =>
      AuthService.uploadProfilePicture(file).then((r) => r.data),
    onSuccess: (user) => {
      updateUser(user);
      qc.invalidateQueries({ queryKey: queryKeys.user.me() });
      toast.success("Profile picture updated.");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to upload.";
      toast.error(msg);
    },
  });
}
