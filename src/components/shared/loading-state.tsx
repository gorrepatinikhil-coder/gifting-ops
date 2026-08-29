import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  rows?: number;
}

export function LoadingState({ className, rows = 5 }: LoadingStateProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-28 rounded-xl bg-muted animate-pulse" />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
