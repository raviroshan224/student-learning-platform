import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().optional(),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  avatar: z.string().url().optional(),
});


export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
