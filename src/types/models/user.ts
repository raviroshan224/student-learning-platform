export type UserRole = "student" | "instructor" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";

export interface UserPhoto {
  path: string;
}

export interface User {
  id: string;
  // API returns fullName; we keep `name` as alias for UI compatibility
  fullName: string;
  name?: string; // alias – populated from fullName in the auth hook
  email: string;
  mobileNumber?: string;
  phone?: string;  // alias for mobileNumber
  isVerified?: boolean;
  photo?: UserPhoto & { url?: string };
  avatar?: string; // alias populated from photo.path
  bio?: string;
  role?: UserRole | { id: string; name: string };
  status?: UserStatus | { id: string; name: string };
  enrolledCourses?: string[];
  createdAt?: string;
  updatedAt?: string;
  hasSelectedCategories?: boolean;
  favoriteCategories?: string[];
  savedCourses?: string[];
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
}

export interface UpdatePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  hasConfirmedToTerms: boolean;
}
