import { LiveClassCard } from "./LiveClassCard";

interface LiveClassesListProps {
  classes: any[];
  variant?: "small" | "full";
  emptyMessage?: string;
}

export function LiveClassesList({ classes, variant = "small", emptyMessage = "No live classes available" }: LiveClassesListProps) {
  if (classes.length === 0) {
    return (
      <div className="py-10 text-center text-[var(--muted-foreground)]">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`flex ${variant === 'small' ? 'gap-3 overflow-x-auto pb-2 scrollbar-hide' : 'flex-col gap-4'}`}>
      {classes.map((lc: any) => (
        <LiveClassCard key={lc.id} lc={lc} variant={variant} />
      ))}
    </div>
  );
}
