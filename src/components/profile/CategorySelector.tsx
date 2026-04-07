"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CategoryHierarchyItem } from "@/types/models/category";
import { resolveImageUrl } from "@/lib/utils/course";

interface CategorySelectorProps {
  categories: CategoryHierarchyItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CategorySelector({ categories, selectedIds, onChange }: CategorySelectorProps) {
  const [openIds, setOpenIds] = useState<string[]>(
    categories.length > 0 ? [categories[0].parentCategory.id] : []
  );

  const toggleSection = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  if (!categories?.length) return null;

  return (
    <div className="space-y-4">
      {categories.map((group) => {
        const parent = group.parentCategory;
        const children = group.childCategories || [];
        const isOpen = openIds.includes(parent.id);

        return (
          <div
            key={parent.id}
            className={cn(
              "border rounded-2xl overflow-hidden transition-all duration-300",
              isOpen 
                ? "border-[var(--color-primary-200)] shadow-md bg-[var(--card)]" 
                : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--color-primary-100)]"
            )}
          >
            <button
              onClick={() => toggleSection(parent.id)}
              className="flex w-full items-center justify-between p-4 md:p-5 text-left transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--muted)]/50 overflow-hidden ring-1 ring-[var(--border)]">
                  {parent.categoryImageUrl ? (
                    <Image
                      src={resolveImageUrl(parent.categoryImageUrl)!}
                      alt={parent.categoryName}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <span className="text-sm font-bold text-[var(--muted-foreground)]">
                      {parent.categoryName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--foreground)] text-base">
                    {parent.categoryName}
                  </h3>
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    {children.length} Courses Available
                  </p>
                </div>
              </div>
              <div className={cn(
                "h-8 w-8 flex items-center justify-center rounded-full transition-colors",
                isOpen ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]" : "text-[var(--muted-foreground)]"
              )}>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-6 pt-1 border-t border-[var(--color-primary-50)] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap gap-2.5 mt-3">
                  {children.map((child) => {
                    const isSelected = selectedIds.includes(child.id);
                    return (
                      <button
                        key={child.id}
                        onClick={() => toggleCategory(child.id)}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border",
                          isSelected
                            ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--color-primary-400)] hover:bg-[var(--muted)]/30"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-all duration-300",
                            isSelected
                              ? "bg-white border-white"
                              : "border-[var(--muted-foreground)]/40"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-[var(--color-primary-600)] stroke-[4px]" />
                          )}
                        </div>
                        {child.categoryName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
