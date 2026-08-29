"use client";

import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Users,
  ClipboardCheck,
  Truck,
  Package,
  BarChart2,
  CreditCard,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AdminDashboardProps {
  data: {
    userName: string;
    stats: {
      activeOrders: number;
      totalOrders: number;
      monthlyRevenue: number;
      pendingPayments: number;
      delayedOrders: number;
      totalLeads: number;
      conversionRate: number;
      inventoryAlerts: number;
      pendingQC: number;
      pendingDispatch: number;
    };
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      clientName: string;
      totalAmount: number;
      status: string;
      deliveryDate: Date;
      isRushOrder?: boolean;
      lead?: { companyName: string } | null;
    }>;
    ordersByStatus?: Array<{ status: string; _count: number }>;
  };
}

const STATUS_COLORS_PIE: Record<string, string> = {
  CONFIRMED: "#3b82f6",
  ADVANCE_PENDING: "#f59e0b",
  IN_PRODUCTION: "#8b5cf6",
  PACKING: "#a855f7",
  QC_PENDING: "#f97316",
  QC_PASSED: "#10b981",
  DISPATCHED: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  ON_HOLD: "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  ADVANCE_PENDING: "Advance Pending",
  IN_PRODUCTION: "In Production",
  PACKING: "Packing",
  QC_PENDING: "QC Pending",
  QC_PASSED: "QC Passed",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
};

const QUICK_ACTIONS = [
  { label: "New Lead", href: "/leads", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { label: "New Order", href: "/orders/new", icon: ShoppingCart, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  { label: "QC Queue", href: "/qc", icon: ClipboardCheck, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
  { label: "Dispatch Ready", href: "/dispatch", icon: Truck, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  { label: "View Reports", href: "/reports", icon: BarChart2, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  { label: "Payments", href: "/payments", icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
];

function buildPieData(
  ordersByStatus: Array<{ status: string; _count: number }> | undefined,
  recentOrders: AdminDashboardProps["data"]["recentOrders"]
): Array<{ name: string; value: number; color: string }> {
  if (ordersByStatus && ordersByStatus.length > 0) {
    return ordersByStatus
      .filter((s) => s._count > 0)
      .map((s) => ({
        name: STATUS_LABELS[s.status] ?? s.status,
        value: s._count,
        color: STATUS_COLORS_PIE[s.status] ?? "#94a3b8",
      }));
  }

  const counts: Record<string, number> = {};
  for (const order of recentOrders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS_PIE[status] ?? "#94a3b8",
    }));
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const { userName, stats, recentOrders, ordersByStatus } = data;
  const firstName = userName.split(" ")[0];

  const pieData = buildPieData(ordersByStatus, recentOrders);

  const hasDelayed = stats.delayedOrders > 0;
  const hasPendingPayments = stats.pendingPayments > 2;
  const hasInventoryAlerts = stats.inventoryAlerts > 0;
  const allClear = !hasDelayed && !hasPendingPayments && !hasInventoryAlerts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Good day, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening across operations.
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">New Order</Link>
        </Button>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={ShoppingCart}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Pending Collections"
          value={formatCurrency(stats.pendingPayments)}
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          title="Delayed Orders"
          value={stats.delayedOrders}
          icon={AlertTriangle}
          iconColor={hasDelayed ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}
          iconBg={hasDelayed ? "bg-red-50 dark:bg-red-950/40" : "bg-muted/40"}
        />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Leads"
          value={stats.totalLeads}
          icon={Users}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          title="QC Inspection Queue"
          value={stats.pendingQC}
          icon={ClipboardCheck}
          iconColor="text-teal-600 dark:text-teal-400"
          iconBg="bg-teal-50 dark:bg-teal-950/40"
        />
        <StatCard
          title="Ready for Dispatch"
          value={stats.pendingDispatch}
          icon={Truck}
          iconColor="text-cyan-600 dark:text-cyan-400"
          iconBg="bg-cyan-50 dark:bg-cyan-950/40"
        />
        <StatCard
          title="Store Alerts"
          value={stats.inventoryAlerts}
          icon={Package}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-50 dark:bg-orange-950/40"
        />
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${action.bg}`}>
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Stage — Pie Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Orders by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No order data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attention Required */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Attention Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allClear ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
                <span className="text-emerald-600 dark:text-emerald-400 text-lg leading-none mt-0.5">✓</span>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  All systems running smoothly
                </p>
              </div>
            ) : (
              <>
                {hasDelayed && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        {stats.delayedOrders} Delayed Order{stats.delayedOrders > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80">Delivery dates have passed</p>
                    </div>
                  </div>
                )}
                {hasPendingPayments && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        Pending Collections
                      </p>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                        {formatCurrency(stats.pendingPayments)} outstanding
                      </p>
                    </div>
                  </div>
                )}
                {hasInventoryAlerts && (
                  <div className="flex items-start gap-3 rounded-lg border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/30 px-4 py-3">
                    <Package className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                        {stats.inventoryAlerts} Store Alert{stats.inventoryAlerts > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Low stock items need attention</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
            <Link href="/orders">View All →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[120px_1fr_1fr_120px_140px_110px_60px] gap-3 px-6 py-2 border-b border-border/50 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order #</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Event</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rush</span>
          </div>
          <div className="divide-y divide-border/50">
            {recentOrders.slice(0, 8).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex flex-col md:grid md:grid-cols-[120px_1fr_1fr_120px_140px_110px_60px] gap-1 md:gap-3 px-6 py-3 hover:bg-muted/40 transition-colors md:items-center"
              >
                <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
                <span className="text-sm font-medium text-foreground truncate">{order.clientName}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {order.lead?.companyName ?? "—"}
                </span>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {formatCurrency(order.totalAmount)}
                </span>
                <StatusBadge status={order.status} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(order.deliveryDate)}
                </span>
                <div>
                  {order.isRushOrder ? (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 flex items-center w-fit">
                      <Zap className="w-2.5 h-2.5" />
                      Rush
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No recent orders.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
