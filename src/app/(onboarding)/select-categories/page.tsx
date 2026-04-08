"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/lib/constants/routes";
import { CategoriesService } from "@/services/api/categories.service";
import { CategorySelector } from "@/components/profile/CategorySelector";
import type { CategoryHierarchyItem } from "@/types/models/category";

export default function SelectCategoriesPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const router = useRouter();
  
  const [categories, setCategories] = useState<CategoryHierarchyItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    CategoriesService.hierarchy()
      .then((cats) => {
        setCategories(cats);
      })
      .catch((err) => {
        console.error("Failed to load categories", err);
        toast.error("Failed to load categories");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    
    setSubmitting(true);
    try {
      await CategoriesService.favoriteSave(selectedIds);
      
      // Update local store state
      updateUser({
        hasSelectedCategories: true,
      });
      
      toast.success("Welcome aboard! Preferences saved.");
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to save preferences.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = user?.fullName?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "Friend";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-pulse text-[var(--foreground)]">
        <div className="space-y-3 px-2">
          <div className="h-9 w-48 bg-[var(--muted)] rounded-lg" />
          <div className="h-6 w-72 bg-[var(--muted)]/60 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--muted)]/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-80px)] text-[var(--foreground)]">
      <div className="pt-8 pb-8 space-y-2">
        <h1 className="text-2xl font-bold">
          Welcome, {firstName}!
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Select the subjects you are interested in to personalize your experience.
        </p>
      </div>

      <div className="flex-1 pb-28">
        <CategorySelector
          categories={categories}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[var(--border)] z-10">
        <div className="max-w-2xl mx-auto">
          <Button
            className="w-full h-11 font-semibold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-lg"
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || submitting}
            loading={submitting}
          >
            {selectedIds.length > 0 ? `Continue (${selectedIds.length} selected)` : "Select at least one"}
          </Button>
        </div>
      </div>
    </div>
  );
}
