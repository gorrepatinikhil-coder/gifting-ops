"use client";

import Link from "next/link";
import {
  Users,
  FileText,
  TrendingUp,
  Clock,
  ShoppingCart,
  FlaskConical,
  Star,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SalesDashboardProps {
  data: {
    userName: string;
    stats: {
      totalLeads: number;
      activeOrders: number;
      conversionRate: number;
      pendingPayments: number;
      monthlyRevenue: number;
    };
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      clientName: string;
      totalAmount: number;
      status: string;
      deliveryDate: Date;
      lead?: { companyName: string } | null;
    }>;
    leads: Array<{
      id: string;
      clientName: string;
      companyName: string;
      status: string;
      estimatedValue: number;
      requirement?: string;
    }>;
  };
}

const QUICK_ACTIONS = [
  { label: "New Lead", href: "/leads", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { label: "Create Quotation", href: "/quotations", icon: FileText, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  { label: "Confirm Order", href: "/orders/new", icon: ShoppingCart, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  { label: "Sample Request", href: "/samples", icon: FlaskConical, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
  { label: "Client Feedback", href: "/feedback", icon: Star, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  { label: "View Payments", href: "/payments", icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
];

export function SalesDashboard({ data }: SalesDashboardProps) {
  const { userName, stats, recentOrders, leads } = data;
  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Hello, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your sales pipeline for today</p>
        </div>
        <Button asChild>
          <Link href="/leads">New Lead</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Leads"
          value={stats.totalLeads}
          icon={Users}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          title="Quotes Pending"
          value={stats.activeOrders}
          icon={FileText}
          iconColor="text-cyan-600 dark:text-cyan-400"
          iconBg="bg-cyan-50 dark:bg-cyan-950/40"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
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
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Lead Pipeline</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link href="/leads">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {leads.slice(0, 6).map((lead) => (
                <Link
                  key={lead.id}
                  href="/leads"
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{lead.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <StatusBadge status={lead.status} />
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatCurrency(lead.estimatedValue)}
                    </span>
                  </div>
                </Link>
              ))}
              {leads.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No leads yet. Add your first lead.
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
                  key={action.href}
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
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40 transition-colors"
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
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                  {formatDate(order.deliveryDate)}
                </span>
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
