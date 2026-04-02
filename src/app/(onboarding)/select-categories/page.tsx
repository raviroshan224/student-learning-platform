"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import client from "@/services/api/client";
import { ROUTES } from "@/lib/constants/routes";

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export default function SelectCategoriesPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .get<Category[]>("/categories/hierarchy")
      .then((r) => {
        const cats = r.data;
        setCategories(cats);
        if (cats.length > 0) setOpenSection(cats[0].id);
      })
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  function toggleCategory(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await client.post("/user-preferences/favorite-categories", {
        categoryIds: Array.from(selected),
      });
      updateUser({
        hasSelectedCategories: true,
        favoriteCategories: Array.from(selected),
      });
      toast.success("Preferences saved!");
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to save preferences.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName =
    user?.fullName?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Namaste, {firstName}! 🙏
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Select the categories you are interested in to personalise your learning.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-[var(--radius-md)] bg-[var(--background)] animate-pulse"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
          No categories available at the moment.
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenSection(openSection === cat.id ? null : cat.id)
                }
                className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-[var(--muted)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">{cat.name}</span>
                {openSection === cat.id ? (
                  <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                )}
              </button>

              {openSection === cat.id && cat.children && cat.children.length > 0 && (
                <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                  {cat.children.map((child) => {
                    const isSelected = selected.has(child.id);
                    return (
                      <button
                        key={child.id}
                        onClick={() => toggleCategory(child.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                          isSelected
                            ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                            : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--color-primary-400)]"
                        }`}
                      >
                        {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                        {child.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="sticky bottom-4">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
          loading={submitting}
        >
          Next ({selected.size} selected)
        </Button>
      </div>
    </div>
  );
}
