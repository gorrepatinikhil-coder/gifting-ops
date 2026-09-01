"use client";

import Link from "next/link";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  ShoppingCart,
  FileText,
  Check,
  Calculator,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AccountsDashboardProps {
  data: {
    userName: string;
    stats: {
      monthlyRevenue: number;
      pendingPayments: number;
      activeOrders: number;
    };
    payments: Array<{
      id: string;
      orderNumber: string;
      clientName: string;
      companyName: string;
      amount: number;
      status: string;
      dueDate: Date;
      paidAt?: Date | null;
      type: string;
    }>;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      clientName: string;
      totalAmount: number;
      status: string;
    }>;
  };
}

const QUICK_ACTIONS = [
  { label: "View Payments", href: "/payments", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  { label: "Record Payment", href: "/payments", icon: Check, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { label: "Generate Invoice", href: "/accounts", icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { label: "Overdue Follow-ups", href: "/payments", icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" },
  { label: "GST Summary", href: "/accounts", icon: Calculator, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  { label: "Reports", href: "/reports", icon: BarChart2, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800/60" },
];

export function AccountsDashboard({ data }: AccountsDashboardProps) {
  const { userName, stats, payments, recentOrders } = data;

  const overduePayments = payments.filter((p) => p.status === "OVERDUE");
  const overdueCount = overduePayments.length;
  const overdueTotal = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  const pendingList = payments.filter((p) =>
    ["PENDING", "PARTIAL", "OVERDUE"].includes(p.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Accounts &amp; Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Today&apos;s finance snapshot</p>
        </div>
        <Button asChild>
          <Link href="/payments">View Payments</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats.monthlyRevenue)}
          sub="all confirmed orders"
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Pending Collections"
          value={formatCurrency(stats.pendingPayments)}
          sub="advance & balance due"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          title="Overdue"
          value={overdueCount > 0 ? `${overdueCount} · ${formatCurrency(overdueTotal)}` : "0"}
          icon={AlertTriangle}
          iconColor={overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}
          iconBg={overdueCount > 0 ? "bg-red-50 dark:bg-red-950/40" : "bg-muted/40"}
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={ShoppingCart}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* Overdue Alert Banner */}
      {overdueCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {overdueCount} overdue payment{overdueCount > 1 ? "s" : ""} totalling{" "}
              <span className="font-bold">{formatCurrency(overdueTotal)}</span>
            </p>
          </div>
          <Button variant="destructive" size="sm" asChild>
            <Link href="/payments">View Overdue →</Link>
          </Button>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending & Overdue Payments */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Pending &amp; Overdue Payments</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link href="/payments">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {pendingList.slice(0, 6).map((payment) => (
                <Link
                  key={payment.id}
                  href="/payments"
                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{payment.orderNumber}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{payment.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </span>
                    <StatusBadge status={payment.status} />
                    <span
                      className={`text-xs whitespace-nowrap hidden sm:block ${
                        payment.status === "OVERDUE"
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {payment.dueDate ? formatDate(payment.dueDate) : "—"}
                    </span>
                  </div>
                </Link>
              ))}
              {pendingList.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No pending payments.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Recent Orders */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
            <Link href="/orders">View All →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 px-6 py-3"
              >
                <span className="font-mono text-xs text-muted-foreground w-28 flex-shrink-0">
                  {order.orderNumber}
                </span>
                <span className="text-sm font-medium text-foreground flex-1 truncate min-w-0">
                  {order.clientName}
                </span>
                <StatusBadge status={order.status} />
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
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
