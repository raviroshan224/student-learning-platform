import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Pass a ReactNode (e.g. a Link+Button) or a simple { label, onClick } object */
  action?: React.ReactNode | { label: string; onClick: () => void };
}

function isActionObject(a: unknown): a is { label: string; onClick: () => void } {
  return typeof a === "object" && a !== null && "label" in a && "onClick" in a;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
          <Icon className="h-8 w-8 text-[var(--muted-foreground)]" />
        </div>
      )}
      <h3 className="mb-1 text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-[var(--muted-foreground)]">{description}</p>
      )}
      {action && (
        isActionObject(action) ? (
          <Button onClick={action.onClick} size="sm">{action.label}</Button>
        ) : (
          <div className="mt-2">{action}</div>
        )
      )}
    </div>
  );
}
