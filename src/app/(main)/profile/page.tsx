"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Camera, ChevronRight, ClipboardList, Bookmark, Clock, FileText, LayoutGrid, User, LogOut, Info, Shield, HelpCircle, Search, Plus, Trash2, X, Book } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { profileSchema, changePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from "@/lib/validators/profile.schema";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        "flex items-center gap-4 px-4 py-3 hover:bg-[var(--muted)] transition-colors cursor-pointer",
        danger && "text-[var(--color-danger)]"
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
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
      reset(data); // reset form so isDirty is false
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
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" />

      {/* Profile Header */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xl">
                  {user?.name?.slice(0, 2).toUpperCase() ?? "ST"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-bold">{user?.name ?? "Student"}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">Student</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="menu">Overview</TabsTrigger>
          <TabsTrigger value="saved">Saved Courses</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview / Menu Tab */}
        <TabsContent value="menu" className="mt-4 space-y-4">
          {/* Learning */}
          <Card className="overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              <MenuItem icon={ClipboardList} label="Exam Lists" href={ROUTES.EXAMS} />
              <MenuItem icon={Bookmark} label="Saved Courses" onClick={() => setActiveTab("saved")} />
              <MenuItem icon={LayoutGrid} label="Preferred Categories" onClick={() => setActiveTab("interests")} />
            </div>
          </Card>

          {/* General Settings */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-2 px-1">General Settings</h3>
            <Card className="overflow-hidden">
              <div className="divide-y divide-[var(--border)]">
                <MenuItem icon={User} label="My Profile" onClick={() => document.querySelector<HTMLButtonElement>('[value="info"]')?.click()} />
                <MenuItem icon={LogOut} label="Logout" onClick={() => logoutMutation()} danger />
              </div>
            </Card>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-2 px-1">About Us</h3>
            <Card className="overflow-hidden">
              <div className="divide-y divide-[var(--border)]">
                <MenuItem icon={Info} label="About Us" href="#" />
                <MenuItem icon={Shield} label="Terms & Conditions" href="#" />
                <MenuItem icon={HelpCircle} label="FAQ" href="#" />
              </div>
            </Card>
          </div>
        </TabsContent>
        {/* Saved Courses Tab */}
        <TabsContent value="saved" className="mt-4">
          <SavedCoursesView />
        </TabsContent>

        {/* Preferred Categories (Interests) Tab */}
        <TabsContent value="interests" className="mt-4">
          <PreferredCategoriesView />
        </TabsContent>

        {/* Personal Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input {...register("fullName")} />
                  {errors.fullName && <p className="text-xs text-[var(--color-danger)]">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input type="tel" placeholder="0000000000" {...register("mobileNumber")} />
                  {errors.mobileNumber && <p className="text-xs text-[var(--color-danger)]">{errors.mobileNumber.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Bio (optional)</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    placeholder="Tell us about yourself..."
                    {...register("bio")}
                  />
                  {errors.bio && <p className="text-xs text-[var(--color-danger)]">{errors.bio.message}</p>}
                </div>
                <Button type="submit" loading={isUpdatingProfile} disabled={!isDirty}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Old Password</label>
                  <Input type="password" placeholder="••••••••" {...registerPassword("oldPassword")} />
                  {passwordErrors.oldPassword && <p className="text-xs text-[var(--color-danger)]">{passwordErrors.oldPassword.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" placeholder="••••••••" {...registerPassword("newPassword")} />
                  {passwordErrors.newPassword && <p className="text-xs text-[var(--color-danger)]">{passwordErrors.newPassword.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" placeholder="••••••••" {...registerPassword("confirmPassword")} />
                  {passwordErrors.confirmPassword && <p className="text-xs text-[var(--color-danger)]">{passwordErrors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" loading={isUpdatingPassword}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Saved Courses View ---
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

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Loading saved courses...</div>;

  if (!courses.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-[var(--foreground)]">
          <Bookmark className="mx-auto h-12 w-12 text-[var(--muted-foreground)]/20 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No saved courses yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">Explore our catalog and find something you love.</p>
          <Button asChild>
            <Link href={ROUTES.EXPLORE}>Browse Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {courses.map((course: any) => (
        <Card key={course.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-4 p-3">
              <div className="relative h-20 w-32 shrink-0 rounded-md overflow-hidden bg-[var(--muted)]">
                {resolveImageUrl(course.thumbnail) ? (
                  <Image
                    src={resolveImageUrl(course.thumbnail)!}
                    alt={course.title || "Course thumbnail"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--muted)]/50">
                    <Book className="h-6 w-6 text-[var(--muted-foreground)]/20" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between py-0.5">
                <div>
                  <h4 className="text-sm font-bold line-clamp-1">{course.title}</h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-1">{course.instructor?.fullName}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--color-primary-600)]">
                    Rs {course.enrollmentCost?.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10" onClick={() => removeSaved(course.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs">
                      <Link href={ROUTES.COURSE_DETAIL(course.id)}>View</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { CategorySelector } from "@/components/profile/CategorySelector";

// --- Preferred Categories View ---
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

  if (loadingPref) return <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Loading interests...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-bold">Your Interests</CardTitle>
          <CardDescription>Courses from these categories will be prioritized for you.</CardDescription>
        </div>
        {!isEditing ? (
          <Button size="sm" className="h-8 gap-1.5" onClick={() => setIsEditing(true)}>
            <Plus className="h-3.5 w-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <div className="max-h-[500px] overflow-y-auto px-1 -mx-1">
              <CategorySelector 
                categories={hierarchy || []} 
                selectedIds={selectedIds} 
                onChange={updateFavorites}
              />
            </div>
            {isUpdating && <p className="text-xs text-center text-[var(--muted-foreground)] animate-pulse">Saving changes...</p>}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 text-[var(--foreground)]">
            {preferred?.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="pl-3 pr-2 py-1.5 gap-1.5 font-semibold text-sm">
                {cat.categoryName}
              </Badge>
            ))}
            {!preferred?.length && (
              <div className="w-full text-center py-6 space-y-3">
                <p className="text-sm text-[var(--muted-foreground)] italic">No preferred categories selected yet.</p>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Set Interests</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
