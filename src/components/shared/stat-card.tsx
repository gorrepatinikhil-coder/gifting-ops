import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor = "text-brand-600",
  iconBg = "bg-brand-50 dark:bg-brand-950/40",
  trend,
  className,
  onClick,
}: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-border/60",
        "hover:shadow-md hover:-translate-y-px hover:border-border",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide leading-none">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground truncate">{sub}</p>
            )}
            {trend && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
              )}>
                {isPositive
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />
                }
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground font-normal">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            iconBg
          )}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
