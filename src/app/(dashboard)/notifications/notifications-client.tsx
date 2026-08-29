"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, BellOff, CheckCheck, AlertTriangle, Info, Zap, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

type NotificationType = "ORDER_DELAYED" | "QC_FAIL" | "VENDOR_LATE" | "ADVANCE_PENDING" | "BALANCE_DUE" | "RUSH_ORDER" | "MODIFICATION_ALERT" | "GENERAL";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: Date;
  orderId?: string | null;
  order?: { orderNumber: string; clientName: string } | null;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  ORDER_DELAYED: AlertTriangle,
  QC_FAIL: AlertTriangle,
  VENDOR_LATE: Package,
  ADVANCE_PENDING: DollarSign,
  BALANCE_DUE: DollarSign,
  RUSH_ORDER: Zap,
  MODIFICATION_ALERT: Info,
  GENERAL: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  ORDER_DELAYED: "text-red-500 bg-red-50 dark:bg-red-950/30",
  QC_FAIL: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
  VENDOR_LATE: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
  ADVANCE_PENDING: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  BALANCE_DUE: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  RUSH_ORDER: "text-red-500 bg-red-50 dark:bg-red-950/30",
  MODIFICATION_ALERT: "text-gray-500 bg-gray-50 dark:bg-gray-950/30",
  GENERAL: "text-gray-500 bg-gray-50 dark:bg-gray-950/30",
};

export function NotificationsClient({ notifications, currentUser }: { notifications: Notification[]; currentUser: { id: string } }) {
  const router = useRouter();
  const unread = notifications.filter((n) => !n.isRead);

  const markAllRead = async () => {
    const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
    if (res.ok) { toast.success("All marked as read."); router.refresh(); }
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            {unread.length > 0 ? `${unread.length} unread` : "All caught up!"}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" />Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications" description="Notifications about orders, payments, QC, and more will appear here." />
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const Icon = NOTIFICATION_ICONS[n.type];
            const colorClass = NOTIFICATION_COLORS[n.type];

            const content = (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-colors cursor-pointer",
                  n.isRead ? "hover:bg-muted/40" : "bg-brand-50/50 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-brand-200/50 dark:border-brand-800/30"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-semibold", !n.isRead && "text-foreground")}>{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  {n.order && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.order.clientName} • {n.order.orderNumber}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );

            return n.link ? <Link href={n.link} key={n.id}>{content}</Link> : <div key={n.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
