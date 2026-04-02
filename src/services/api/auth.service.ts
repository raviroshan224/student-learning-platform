import client from "./client";
import type { AuthTokens } from "@/types/api.types";
import type { User, UpdateProfilePayload, UpdatePasswordPayload, RegisterPayload } from "@/types/models/user";

export const AuthService = {
  login: (email: string, password: string) =>
    client.post<AuthTokens & { user: User }>("/auth/email/login", { email, password }),

  register: (payload: RegisterPayload) =>
    client.post("/auth/email/register", payload),

  verifyOtp: (email: string, otp: string) =>
    client.post("/auth/email/verify-otp", { email, otp }),

  resendOtp: (email: string) =>
    client.post("/auth/email/send-verification", { email }),

  forgotPassword: (email: string) =>
    client.post("/auth/forgot/password", { email }),

  verifyResetOtp: (email: string, otp: string) =>
    client.post("/auth/verify/otp", { email, otp }),

  resetPassword: (email: string, otp: string, password: string) =>
    client.post("/auth/reset/password", { email, otp, password }),

  logout: () =>
    client.post("/auth/logout"),

  refreshToken: (refreshToken: string) =>
    client.post<{ token: string }>("/auth/refresh", {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),

  getMe: () =>
    client.get<User>("/auth/me"),

  updateMe: (payload: UpdateProfilePayload) =>
    client.patch<User>("/auth/me", payload),

  updatePassword: (payload: UpdatePasswordPayload) =>
    client.patch("/auth/me/password", payload),

  uploadProfilePicture: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return client.post<User>("/auth/me/upload-profile-picture", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteMe: () =>
    client.delete("/auth/me"),
};
