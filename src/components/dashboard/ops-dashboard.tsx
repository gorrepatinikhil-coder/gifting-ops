"use client";

import Link from "next/link";
import {
  ChefHat,
  Package,
  ClipboardCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  XCircle,
  ShieldCheck,
  MapPin,
  PackageCheck,
  FileText,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface OpsDashboardProps {
  data: {
    userName: string;
    role: string;
    stats: {
      activeOrders: number;
      pendingQC: number;
      pendingDispatch: number;
      inventoryAlerts: number;
    };
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      clientName: string;
      status: string;
      deliveryDate: Date;
      totalAmount: number;
      isRushOrder?: boolean;
    }>;
  };
}

type StatDef = {
  title: string;
  getValue: (stats: OpsDashboardProps["data"]["stats"]) => string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
};

type ActionDef = {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

type RoleConfig = {
  title: string;
  subtitle: string;
  stats: StatDef[];
  actions: ActionDef[];
  relevantStatuses: string[];
};

const ROLE_CONFIG: Record<string, RoleConfig> = {
  CHEF_OPS: {
    title: "Kitchen & Ops Dashboard",
    subtitle: "Assembly floor overview",
    stats: [
      {
        title: "Orders in Kitchen",
        getValue: (s) => s.activeOrders,
        icon: ChefHat,
        iconColor: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-50 dark:bg-purple-950/40",
      },
      {
        title: "Assembled Today",
        getValue: () => 48,
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      },
      {
        title: "Low Stock Alerts",
        getValue: (s) => s.inventoryAlerts,
        icon: AlertTriangle,
        iconColor: "text-orange-600 dark:text-orange-400",
        iconBg: "bg-orange-50 dark:bg-orange-950/40",
      },
      {
        title: "Batches Running",
        getValue: () => 3,
        icon: Package,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-950/40",
      },
    ],
    actions: [
      { label: "Kitchen Schedule", href: "/production", icon: ChefHat, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
      { label: "Check Store", href: "/inventory", icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
      { label: "Vendor Orders", href: "/vendors", icon: Truck, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
      { label: "QC Queue", href: "/qc", icon: ClipboardCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
      { label: "Sample Requests", href: "/samples", icon: FlaskConical, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
    ],
    relevantStatuses: ["IN_PRODUCTION"],
  },
  PRODUCTION: {
    title: "Production Dashboard",
    subtitle: "Today's batch schedule",
    stats: [
      {
        title: "Orders in Kitchen",
        getValue: (s) => s.activeOrders,
        icon: ChefHat,
        iconColor: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-50 dark:bg-purple-950/40",
      },
      {
        title: "Assembled Today",
        getValue: () => 48,
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      },
      {
        title: "Low Stock Alerts",
        getValue: (s) => s.inventoryAlerts,
        icon: AlertTriangle,
        iconColor: "text-orange-600 dark:text-orange-400",
        iconBg: "bg-orange-50 dark:bg-orange-950/40",
      },
      {
        title: "Batches Running",
        getValue: () => 3,
        icon: Package,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-950/40",
      },
    ],
    actions: [
      { label: "Today's Batches", href: "/production", icon: ChefHat, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
      { label: "Check Ingredients", href: "/inventory", icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
      { label: "Mark Complete", href: "/production", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    ],
    relevantStatuses: ["IN_PRODUCTION"],
  },
  PACKING: {
    title: "Packing Line Dashboard",
    subtitle: "Hamper packing queue",
    stats: [
      {
        title: "Units to Pack",
        getValue: () => 120,
        icon: Package,
        iconColor: "text-orange-600 dark:text-orange-400",
        iconBg: "bg-orange-50 dark:bg-orange-950/40",
      },
      {
        title: "Packed Today",
        getValue: () => 48,
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      },
      {
        title: "In QC Queue",
        getValue: (s) => s.pendingQC,
        icon: ClipboardCheck,
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-950/40",
      },
      {
        title: "Rush Items",
        getValue: () => 4,
        icon: Zap,
        iconColor: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-50 dark:bg-red-950/40",
      },
    ],
    actions: [
      { label: "Packing Queue", href: "/packing", icon: Package, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
      { label: "Rush Items", href: "/packing", icon: Zap, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" },
      { label: "View Checklist", href: "/packing", icon: ClipboardCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
      { label: "QC Handoff", href: "/qc", icon: ShieldCheck, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
    ],
    relevantStatuses: ["PACKING"],
  },
  QC: {
    title: "QC Inspection Dashboard",
    subtitle: "Quality control queue",
    stats: [
      {
        title: "In QC Queue",
        getValue: (s) => s.pendingQC,
        icon: ClipboardCheck,
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-950/40",
      },
      {
        title: "Passed Today",
        getValue: () => 8,
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      },
      {
        title: "Failed Today",
        getValue: () => 2,
        icon: XCircle,
        iconColor: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-50 dark:bg-red-950/40",
      },
      {
        title: "Pass Rate",
        getValue: () => "80%",
        icon: ShieldCheck,
        iconColor: "text-teal-600 dark:text-teal-400",
        iconBg: "bg-teal-50 dark:bg-teal-950/40",
      },
    ],
    actions: [
      { label: "Open QC Queue", href: "/qc", icon: ClipboardCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
      { label: "Failed Units", href: "/qc", icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" },
      { label: "QC Log", href: "/qc", icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
      { label: "Dispatch Ready", href: "/dispatch", icon: Truck, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
    ],
    relevantStatuses: ["QC_PENDING"],
  },
  DISPATCH: {
    title: "Dispatch & Delivery Dashboard",
    subtitle: "Today's delivery schedule",
    stats: [
      {
        title: "Ready to Dispatch",
        getValue: (s) => s.pendingDispatch,
        icon: Truck,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-950/40",
      },
      {
        title: "Out for Delivery",
        getValue: () => 3,
        icon: MapPin,
        iconColor: "text-violet-600 dark:text-violet-400",
        iconBg: "bg-violet-50 dark:bg-violet-950/40",
      },
      {
        title: "Delivered Today",
        getValue: () => 1,
        icon: PackageCheck,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      },
      {
        title: "Rush Orders",
        getValue: () => 2,
        icon: Zap,
        iconColor: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-50 dark:bg-red-950/40",
      },
    ],
    actions: [
      { label: "Create Challan", href: "/dispatch", icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
      { label: "View Routes", href: "/dispatch", icon: MapPin, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
      { label: "Record POD", href: "/dispatch", icon: PackageCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
      { label: "Track Orders", href: "/orders", icon: Truck, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
    ],
    relevantStatuses: ["QC_PASSED", "DISPATCHED"],
  },
};

export function OpsDashboard({ data }: OpsDashboardProps) {
  const { userName, role, stats, recentOrders } = data;
  const firstName = userName.split(" ")[0];

  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.CHEF_OPS;

  const filteredOrders = recentOrders.filter((o) =>
    config.relevantStatuses.includes(o.status)
  );
  const displayOrders = filteredOrders.length > 0 ? filteredOrders : recentOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {config.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {config.subtitle} — Hello, {firstName}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {config.stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.getValue(stats)}
            icon={stat.icon}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
          />
        ))}
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Orders */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Active Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link href="/orders">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {displayOrders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{order.clientName}</p>
                      {order.isRushOrder && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                          RUSH
                        </Badge>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                      {formatDate(order.deliveryDate)}
                    </span>
                  </div>
                </div>
              ))}
              {displayOrders.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No active orders.
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
              {config.actions.map((action) => (
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
    </div>
  );
}
