"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Camera, ChevronRight, ClipboardList, Bookmark, Clock, FileText, LayoutGrid, User, LogOut, Info, Shield, HelpCircle } from "lucide-react";
import { useRef } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Overview</TabsTrigger>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview / Menu Tab */}
        <TabsContent value="menu" className="mt-4 space-y-4">
          {/* Learning */}
          <Card className="overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              <MenuItem icon={ClipboardList} label="Exam Lists" href={ROUTES.EXAMS} />
              <MenuItem icon={Bookmark} label="Saved Courses" href={ROUTES.COURSES} />
              <MenuItem icon={Clock} label="Upcoming Classes" href={ROUTES.LIVE} />
              <MenuItem icon={FileText} label="Mock Tests" href={ROUTES.EXAMS} />
              <MenuItem icon={LayoutGrid} label="Preferred Categories" href={ROUTES.EXPLORE} />
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
