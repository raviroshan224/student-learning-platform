"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Camera, ChevronRight, ClipboardList, Bookmark, Clock, FileText, LayoutGrid, User, LogOut, Info, Shield, HelpCircle, Search, Plus, Trash2, X, Book } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { profileSchema, changePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from "@/lib/validators/profile.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import { useLogout, useUpdateProfile, useUpdatePassword, useUploadProfilePicture } from "@/features/auth/hooks/useAuthActions";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/services/api/profile.service";
import { CategoriesService } from "@/services/api/categories.service";
import { resolveImageUrl } from "@/lib/utils/course";
import { CategorySelector } from "@/components/profile/CategorySelector";

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

function MenuItem({ icon: Icon, label, href, onClick, danger }: MenuItemProps) {
  const content = (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--muted)] transition-colors cursor-pointer",
        danger && "text-[var(--color-danger)]"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "text-[var(--color-danger)]" : "text-[var(--muted-foreground)]")} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
      {children}
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("menu");

  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutateAsync: updatePasswordMutation, isPending: isUpdatingPassword } = useUpdatePassword();
  const { mutateAsync: uploadPictureMutation, isPending: isUploadingPicture } = useUploadProfilePicture();
  const { mutate: logoutMutation } = useLogout();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? user?.name ?? "",
      email: user?.email ?? "",
      mobileNumber: user?.mobileNumber ?? user?.phone ?? "",
      bio: user?.bio ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation(data);
      reset(data);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const e = err.response.data.errors;
        if (e.field && e.message) {
          setError(e.field as keyof ProfileFormData, { message: e.message });
        } else {
          Object.keys(e).forEach((key) => {
            setError(key as keyof ProfileFormData, { message: e[key] });
          });
        }
      }
    }
  };

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    try {
      await updatePasswordMutation({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const e = err.response.data.errors;
        if (e.field && e.message) {
          setPasswordError(e.field as keyof ChangePasswordFormData, { message: e.message });
        } else {
          Object.keys(e).forEach((key) => {
            setPasswordError(key as keyof ChangePasswordFormData, { message: e[key] });
          });
        }
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadPictureMutation(file);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Profile</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <Avatar className="h-16 w-16 border-2 border-[var(--border)]">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xl font-bold">
                {user?.name
                  ? user.name.split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                  : "ST"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPicture}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50 border-2 border-white"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">{user?.name ?? "Student"}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{user?.email}</p>
            <span className="inline-block mt-1.5 text-xs font-semibold bg-[var(--color-primary-50)] text-[var(--color-primary-600)] px-2.5 py-0.5 rounded-full">
              Student
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--muted)] p-1 rounded-xl flex overflow-x-auto gap-1 w-full">
          {[
            { value: "menu", label: "Overview" },
            { value: "saved", label: "Saved Courses" },
            { value: "interests", label: "Interests" },
            { value: "info", label: "Personal Info" },
            { value: "security", label: "Security" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-lg text-sm font-medium whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[var(--color-primary-600)] data-[state=active]:shadow-sm text-[var(--muted-foreground)]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview / Menu Tab */}
        <TabsContent value="menu" className="mt-5 space-y-4">
          {/* Learning */}
          <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
            <MenuItem icon={ClipboardList} label="Exam Lists" href={ROUTES.EXAMS} />
            <MenuItem icon={Bookmark} label="Saved Courses" onClick={() => setActiveTab("saved")} />
            <MenuItem icon={LayoutGrid} label="Preferred Categories" onClick={() => setActiveTab("interests")} />
          </div>

          {/* Settings */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 px-1 uppercase tracking-wide">General Settings</p>
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
              <MenuItem icon={User} label="My Profile" onClick={() => document.querySelector<HTMLButtonElement>('[value="info"]')?.click()} />
              <MenuItem icon={LogOut} label="Logout" onClick={() => logoutMutation()} danger />
            </div>
          </div>

          {/* About */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 px-1 uppercase tracking-wide">About Us</p>
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
              <MenuItem icon={Info} label="About Us" href="#" />
              <MenuItem icon={Shield} label="Terms & Conditions" href="#" />
              <MenuItem icon={HelpCircle} label="FAQ" href="#" />
            </div>
          </div>
        </TabsContent>

        {/* Saved Courses */}
        <TabsContent value="saved" className="mt-5">
          <SavedCoursesView />
        </TabsContent>

        {/* Interests */}
        <TabsContent value="interests" className="mt-5">
          <PreferredCategoriesView />
        </TabsContent>

        {/* Personal Info */}
        <TabsContent value="info" className="mt-5">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Personal Information</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">Update your personal details</p>
            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 max-w-md">
              <FieldGroup label="Full Name" error={errors.fullName?.message}>
                <Input className="rounded-lg border-[var(--border)]" {...register("fullName")} />
              </FieldGroup>
              <FieldGroup label="Email address" error={errors.email?.message}>
                <Input type="email" className="rounded-lg border-[var(--border)]" {...register("email")} />
              </FieldGroup>
              <FieldGroup label="Mobile Number" error={errors.mobileNumber?.message}>
                <Input type="tel" placeholder="0000000000" className="rounded-lg border-[var(--border)]" {...register("mobileNumber")} />
              </FieldGroup>
              <FieldGroup label="Bio (optional)" error={errors.bio?.message}>
                <textarea
                  className="w-full min-h-[80px] rounded-lg border border-[var(--border)] bg-white p-3 text-sm resize-y focus:outline-none focus:border-[var(--color-primary-600)] transition-colors"
                  placeholder="Tell us about yourself..."
                  {...register("bio")}
                />
              </FieldGroup>
              <Button
                type="submit"
                className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg"
                loading={isUpdatingProfile}
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-5">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Change Password</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">Keep your account secure with a strong password</p>
            <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4 max-w-md">
              <FieldGroup label="Current Password" error={passwordErrors.oldPassword?.message}>
                <Input type="password" placeholder="••••••••" className="rounded-lg border-[var(--border)]" {...registerPassword("oldPassword")} />
              </FieldGroup>
              <FieldGroup label="New Password" error={passwordErrors.newPassword?.message}>
                <Input type="password" placeholder="••••••••" className="rounded-lg border-[var(--border)]" {...registerPassword("newPassword")} />
              </FieldGroup>
              <FieldGroup label="Confirm New Password" error={passwordErrors.confirmPassword?.message}>
                <Input type="password" placeholder="••••••••" className="rounded-lg border-[var(--border)]" {...registerPassword("confirmPassword")} />
              </FieldGroup>
              <Button
                type="submit"
                className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg"
                loading={isUpdatingPassword}
              >
                Update Password
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Saved Courses View ────────────────────────────────────────────────────────
function SavedCoursesView() {
  const qc = useQueryClient();

  const { data: qResult, isLoading } = useQuery({
    queryKey: ["profile-saved-courses"],
    queryFn: () => ProfileService.getSavedCourses({ limit: 50 }),
  });

  const courses = qResult?.data || [];

  const { mutate: removeSaved } = useMutation({
    mutationFn: (courseId: string) => ProfileService.deleteSavedCourse(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-saved-courses"] });
      toast.success("Course removed from saved items");
    },
    onError: () => toast.error("Failed to remove course"),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--muted)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-4">
          <Bookmark className="h-8 w-8 text-[var(--color-primary-600)]/40" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">No saved courses yet</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">Explore our catalog and save courses you like</p>
        <Button asChild className="bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg">
          <Link href={ROUTES.EXPLORE}>Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course: any) => (
        <div key={course.id} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--color-primary-600)] transition-colors">
          <div className="flex gap-4 p-3.5">
            <div className="relative h-20 w-32 shrink-0 rounded-lg overflow-hidden bg-[var(--muted)]">
              {resolveImageUrl(course.thumbnail) ? (
                <Image
                  src={resolveImageUrl(course.thumbnail)!}
                  alt={course.title || "Course thumbnail"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-primary-50)]">
                  <Book className="h-6 w-6 text-[var(--color-primary-600)]/30" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
              <div>
                <h4 className="text-sm font-bold line-clamp-1 text-[var(--foreground)]">{course.title}</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{course.instructor?.fullName}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--color-primary-600)]">
                  Rs {course.enrollmentCost?.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeSaved(course.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-red-50 hover:border-red-200 text-[var(--muted-foreground)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href={ROUTES.COURSE_DETAIL(course.id)}
                    className="flex items-center px-3 h-8 text-xs font-semibold rounded-lg border border-[var(--color-primary-600)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Preferred Categories View ─────────────────────────────────────────────────
function PreferredCategoriesView() {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: preferred, isLoading: loadingPref } = useQuery({
    queryKey: ["profile-categories"],
    queryFn: () => ProfileService.getPreferredCategories(),
  });

  const { data: hierarchy } = useQuery({
    queryKey: ["all-categories-hierarchy"],
    queryFn: () => CategoriesService.hierarchy(),
    enabled: isEditing,
  });

  const { mutate: updateFavorites, isPending: isUpdating } = useMutation({
    mutationFn: (ids: string[]) => ProfileService.updatePreferredCategories(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-categories"] });
      setIsEditing(false);
      toast.success("Interests updated");
    },
    onError: () => toast.error("Failed to update interests"),
  });

  const selectedIds = preferred?.map(p => p.id) || [];

  if (loadingPref) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-full bg-[var(--muted)] animate-pulse w-24 inline-block mr-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-[var(--foreground)]">Your Interests</h3>
        {!isEditing ? (
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg"
            onClick={() => setIsEditing(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Edit
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg">Cancel</Button>
        )}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-5">Courses from these categories will be prioritized for you.</p>

      {isEditing ? (
        <div className="space-y-4">
          <div className="max-h-[500px] overflow-y-auto pr-1">
            <CategorySelector
              categories={hierarchy || []}
              selectedIds={selectedIds}
              onChange={updateFavorites}
            />
          </div>
          {isUpdating && <p className="text-xs text-center text-[var(--muted-foreground)] animate-pulse">Saving changes...</p>}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {preferred?.map((cat) => (
            <span
              key={cat.id}
              className="inline-block bg-[var(--color-primary-50)] text-[var(--color-primary-600)] text-sm font-semibold px-3 py-1.5 rounded-full border border-[var(--color-primary-100)]"
            >
              {cat.categoryName}
            </span>
          ))}
          {!preferred?.length && (
            <div className="w-full text-center py-8 space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">No preferred categories selected yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-[var(--color-primary-600)] text-[var(--color-primary-600)] rounded-lg"
              >
                Set Interests
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
