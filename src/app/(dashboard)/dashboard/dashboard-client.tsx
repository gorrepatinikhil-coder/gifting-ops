"use client";

import Link from "next/link";
import {
  ShoppingCart, IndianRupee, Clock, AlertTriangle,
  TrendingUp, TrendingDown, Users, ArrowRight, Zap, CheckCircle, Package,
  ChefHat, Truck, Star, CalendarDays, BarChart3, Flame,
  Activity, CreditCard, XCircle, Timer, Eye,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeOrders: number;
  totalOrders: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  pendingPayments: number;
  pendingAmount: number;
  pendingQC: number;
  pendingDispatch: number;
  inventoryAlerts: number;
  rushOrders: number;
  conversionRate: number;
  wonLeads: number;
  totalLeads: number;
}

export interface DashboardExtendedStats {
  hamsersInProduction: number;
  batchesInProgress: number;
  qcFailedToday: number;
  awaitingDispatch: number;
  avgOrderValue: number;
  overdueAmount: number;
  nextSeasonName: string;
  nextSeasonDays: number;
  seasonOrdersConfirmed: number;
  seasonConfirmedValue: number;
  seasonPipelineLeads: number;
  seasonPipelineValue: number;
  followUpsDueToday: number;
}

export interface DashboardTodayFloor {
  unitsPacked: number;
  qcPassed: number;
  shipmentsOut: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  totalAmount: number;
  status: string;
  deliveryDate: Date | string;
  isRushOrder: boolean;
  eventType: string;
  lead?: { companyName: string } | null;
}

export interface DashboardChartEntry {
  month: string;
  revenue: number;
}

export interface DashboardStageEntry {
  name: string;
  value: number;
  color: string;
  status: string;
}

export interface DashboardDelivery {
  orderId: string;
  company: string;
  quantity: number;
  city: string;
  status: string;
  deliveryDate: Date | string;
  isRushOrder: boolean;
}

export interface DashboardAlert {
  id: string;
  severity: "high" | "info";
  title: string;
  message: string;
  link: string;
}

export interface DashboardClientProps {
  currentUser: { name: string; role: string };
  stats: DashboardStats;
  extendedStats: DashboardExtendedStats;
  todayFloor: DashboardTodayFloor;
  recentOrders: DashboardRecentOrder[];
  revenueChart: DashboardChartEntry[];
  orderStages: DashboardStageEntry[];
  upcomingDeliveries: DashboardDelivery[];
  alerts: DashboardAlert[];
}

// ── Pipeline config ──────────────────────────────────────────────────────────

const PIPELINE = [
  { status: "ADVANCE_PENDING", label: "Advance", href: "/orders" },
  { status: "CONFIRMED",       label: "Confirmed", href: "/orders" },
  { status: "IN_PRODUCTION",   label: "Kitchen",   href: "/production" },
  { status: "PACKING",         label: "Packing",   href: "/packing" },
  { status: "QC_PENDING",      label: "QC Queue",  href: "/qc" },
  { status: "QC_PASSED",       label: "Ready",     href: "/dispatch" },
  { status: "DISPATCHED",      label: "Shipped",   href: "/dispatch" },
];

// ── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "New Order",    href: "/orders/new",  icon: ShoppingCart, color: "text-brand-600 bg-brand-50 dark:bg-brand-950/40" },
  { label: "QC Queue",     href: "/qc",          icon: CheckCircle,  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  { label: "Dispatch",     href: "/dispatch",    icon: Truck,        color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  { label: "Payments",     href: "/accounts",    icon: CreditCard,   color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
  { label: "Kitchen",      href: "/production",  icon: ChefHat,      color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40" },
  { label: "Inventory",    href: "/inventory",   icon: Package,      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  { label: "Log Enquiry",  href: "/leads",       icon: Users,        color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" },
  { label: "Feedback",     href: "/feedback",    icon: Star,         color: "text-pink-600 bg-pink-50 dark:bg-pink-950/40" },
];

// ── SLA countdown helper ─────────────────────────────────────────────────────

function SLAChip({ date }: { date: Date | string }) {
  const days = daysUntil(date);
  if (days < 0)  return <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">{Math.abs(days)}d OVERDUE</span>;
  if (days === 0) return <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded animate-pulse">TODAY</span>;
  if (days === 1) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded">Tomorrow</span>;
  if (days <= 3)  return <span className="text-[10px] font-medium text-foreground/80 bg-muted px-1.5 py-0.5 rounded">in {days}d</span>;
  return <span className="text-[10px] text-muted-foreground">{formatDate(date as Date)}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardClient({
  currentUser,
  stats: s,
  extendedStats: ex,
  todayFloor,
  recentOrders,
  revenueChart,
  orderStages,
  upcomingDeliveries,
  alerts,
}: DashboardClientProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
  const firstName = currentUser.name.split(" ")[0];

  // ── Derived operational state ────────────────────────────────────────────

  const overdueAlerts = alerts.filter((a) => a.id.startsWith("overdue-"));
  const lowStockAlerts = alerts.filter((a) => a.id.startsWith("stock-"));

  // Pipeline stage lookup by status key
  const stageCountMap: Record<string, number> = {};
  for (const stage of orderStages) {
    stageCountMap[stage.status] = stage.value;
  }
  const pipelineValues = PIPELINE.map((s) => stageCountMap[s.status] ?? 0);
  const maxPipelineCount = Math.max(...pipelineValues.filter(Boolean), 0);

  // SLA: deliveries due within 3 days (sorted soonest first)
  const slaOrders = [...upcomingDeliveries]
    .map((d) => ({ ...d, days: daysUntil(d.deliveryDate) }))
    .filter((d) => d.days >= 0 && d.days <= 3)
    .sort((a, b) => a.days - b.days);

  // Urgent orders: rush + overdue deliveries from recentOrders
  const urgentOrders = [...recentOrders]
    .sort((a, b) => {
      const aRush = a.isRushOrder ? -1000 : 0;
      const bRush = b.isRushOrder ? -1000 : 0;
      const aDays = daysUntil(a.deliveryDate);
      const bDays = daysUntil(b.deliveryDate);
      return (aRush + aDays) - (bRush + bDays);
    });

  // Total critical issues count
  const criticalTotal =
    overdueAlerts.length +
    (ex.qcFailedToday > 0 ? 1 : 0) +
    (ex.overdueAmount > 0 ? 1 : 0) +
    (s.rushOrders > 0 ? 1 : 0) +
    lowStockAlerts.length;

  // Situation bar chips
  const situationChips = [
    { label: `${s.activeOrders} active`, color: "bg-muted text-muted-foreground" },
    ...(overdueAlerts.length > 0 ? [{ label: `${overdueAlerts.length} overdue`, color: "bg-red-600 text-white" }] : []),
    ...(s.rushOrders > 0 ? [{ label: `${s.rushOrders} rush`, color: "bg-amber-500 text-white" }] : []),
    ...(s.pendingQC > 0 ? [{ label: `${s.pendingQC} QC`, color: "bg-yellow-500 text-white" }] : []),
    ...(s.pendingDispatch > 0 ? [{ label: `${s.pendingDispatch} ready to ship`, color: "bg-teal-600 text-white" }] : []),
    ...(s.inventoryAlerts > 0 ? [{ label: `${s.inventoryAlerts} low stock`, color: "bg-orange-500 text-white" }] : []),
  ];

  return (
    <div className="space-y-4">

      {/* ── 1. COMMAND HEADER ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{greeting}, {firstName}</h1>
            <span className="text-sm text-muted-foreground">{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {situationChips.map((chip, i) => (
              <span key={i} className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", chip.color)}>
                {chip.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40">
            <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
              {ex.nextSeasonName} · {ex.nextSeasonDays}d
            </span>
          </div>
          <Button asChild size="sm">
            <Link href="/orders/new"><Zap className="w-3.5 h-3.5" />New Order</Link>
          </Button>
        </div>
      </div>

      {/* ── 2. CRITICAL ISSUES PANEL ───────────────────────────────────────── */}
      {criticalTotal > 0 ? (
        <div className="rounded-xl border-2 border-red-200 dark:border-red-800/60 bg-gradient-to-br from-red-50 via-orange-50/50 to-amber-50/30 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              {criticalTotal} operational issue{criticalTotal !== 1 ? "s" : ""} need immediate attention
            </p>
            <Button size="sm" variant="ghost" className="ml-auto h-6 text-xs text-red-700 hover:text-red-800 hover:bg-red-100/60 dark:text-red-400" asChild>
              <Link href="/orders">View all orders <ArrowRight className="w-3 h-3 ml-0.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">

            {/* Overdue deliveries */}
            {overdueAlerts.length > 0 && (
              <Link href="/orders" className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-red-200 dark:border-red-800/50 hover:bg-white/95 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-600" />
                  <span className="text-[9px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Overdue</span>
                </div>
                <span className="text-3xl font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{overdueAlerts.length}</span>
                <div className="space-y-0.5 mt-0.5">
                  {overdueAlerts.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-[10px] text-red-600/80 dark:text-red-400/80 truncate font-mono">{a.title.replace("Overdue: ", "")}</p>
                  ))}
                  {overdueAlerts.length > 2 && <p className="text-[10px] text-red-500/60">+{overdueAlerts.length - 2} more</p>}
                </div>
              </Link>
            )}

            {/* Rush orders in flight */}
            {s.rushOrders > 0 && (
              <Link href="/orders" className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-amber-200 dark:border-amber-800/50 hover:bg-white/95 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Rush Active</span>
                </div>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">{s.rushOrders}</span>
                <p className="text-[10px] text-amber-600/80 mt-0.5">Priority handling required</p>
              </Link>
            )}

            {/* QC failures */}
            {ex.qcFailedToday > 0 && (
              <Link href="/qc" className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-orange-200 dark:border-orange-800/50 hover:bg-white/95 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-orange-600" />
                  <span className="text-[9px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">QC Failures</span>
                </div>
                <span className="text-3xl font-black text-orange-600 dark:text-orange-400 tabular-nums leading-none">{ex.qcFailedToday}</span>
                <p className="text-[10px] text-orange-600/80 mt-0.5">Units sent back today</p>
              </Link>
            )}

            {/* Overdue payments */}
            {ex.overdueAmount > 0 && (
              <Link href="/accounts" className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-red-200 dark:border-red-800/50 hover:bg-white/95 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-red-600" />
                  <span className="text-[9px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Revenue Risk</span>
                </div>
                <span className="text-xl font-black text-red-600 dark:text-red-400 leading-none">{formatCurrency(ex.overdueAmount)}</span>
                <p className="text-[10px] text-red-600/80 mt-0.5">Payments overdue — collect now</p>
              </Link>
            )}

            {/* Low stock */}
            {lowStockAlerts.length > 0 && (
              <Link href="/inventory" className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-amber-200 dark:border-amber-800/50 hover:bg-white/95 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-amber-600" />
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Low Stock</span>
                </div>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">{lowStockAlerts.length}</span>
                <div className="space-y-0.5 mt-0.5">
                  {lowStockAlerts.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-[10px] text-amber-600/80 truncate">{a.title.replace("Low Stock: ", "")}</p>
                  ))}
                </div>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* All-clear status */
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            All systems operational — no critical issues detected
          </p>
        </div>
      )}

      {/* ── 3. LIVE PIPELINE FLOW ──────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Live Order Pipeline</CardTitle>
            <span className="text-xs text-muted-foreground">— {s.activeOrders} orders in flight</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/orders">All orders <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-stretch gap-1.5 overflow-x-auto pb-2">
            {PIPELINE.map((stage, idx) => {
              const count = stageCountMap[stage.status] ?? 0;
              const isBottleneck = count > 0 && count === maxPipelineCount && maxPipelineCount > 2;
              const isEmpty = count === 0;
              return (
                <div key={stage.status} className="flex items-center gap-1.5 flex-shrink-0">
                  {idx > 0 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/25 flex-shrink-0" />
                  )}
                  <Link
                    href={stage.href}
                    className={cn(
                      "flex flex-col items-center justify-center px-4 py-3 rounded-xl border min-w-[76px] transition-all",
                      isEmpty
                        ? "opacity-30 border-border/30 bg-muted/10 pointer-events-none cursor-default"
                        : isBottleneck
                        ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 shadow-sm shadow-amber-100 dark:shadow-amber-900/20 hover:shadow-md"
                        : "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <span className={cn(
                      "text-2xl font-black tabular-nums leading-none",
                      isBottleneck ? "text-amber-600 dark:text-amber-400" :
                      isEmpty ? "text-muted-foreground/30" : "text-foreground"
                    )}>
                      {count}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground mt-1 text-center leading-tight">
                      {stage.label}
                    </span>
                    {isBottleneck && (
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 tracking-widest">
                        ⚠ JAM
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
            {/* Delivered total */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/25 flex-shrink-0" />
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 min-w-[76px]">
                <span className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">
                  {(stageCountMap["DELIVERED"] ?? 0).toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-1">Delivered</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. TODAY ON THE FLOOR ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Hampers in Kitchen",
            value: ex.hamsersInProduction.toLocaleString("en-IN"),
            sub: `${ex.batchesInProgress} batch${ex.batchesInProgress !== 1 ? "es" : ""} active`,
            icon: ChefHat, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/40",
            href: "/production",
          },
          {
            label: "Units Packed Today",
            value: todayFloor.unitsPacked,
            sub: "Ready for QC inspection",
            icon: Package, color: "text-brand-600", bg: "bg-brand-50 dark:bg-brand-950/40",
            href: "/packing",
          },
          {
            label: "QC Cleared Today",
            value: todayFloor.qcPassed,
            sub: ex.qcFailedToday > 0 ? `${ex.qcFailedToday} failed — rework needed` : "Zero failures",
            subColor: ex.qcFailedToday > 0 ? "text-red-500" : "text-muted-foreground/60",
            icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40",
            href: "/qc",
          },
          {
            label: "Shipments Out Today",
            value: todayFloor.shipmentsOut,
            sub: `${ex.awaitingDispatch} awaiting challan`,
            subColor: ex.awaitingDispatch > 0 ? "text-amber-500" : "text-muted-foreground/60",
            icon: Truck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40",
            href: "/dispatch",
          },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all h-full">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", item.bg)}>
                <item.icon className={cn("w-4.5 h-4.5", item.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none tabular-nums">{item.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.label}</p>
                <p className={cn("text-[10px] mt-0.5 truncate", (item as any).subColor ?? "text-muted-foreground/60")}>{item.sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 5. REVENUE INTELLIGENCE + SLA WATCHLIST ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Intelligence */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">Revenue Intelligence</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">6-month trend + collection exposure</p>
              </div>
              {s.revenueGrowth !== 0 && (
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1",
                  s.revenueGrowth > 0
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400"
                )}>
                  {s.revenueGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(s.revenueGrowth)}% MoM
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3 pb-4 border-b border-border/40">
              <div>
                <p className="text-xs text-muted-foreground">Revenue This Month</p>
                <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(s.monthlyRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collections Pending</p>
                <p className={cn("text-xl font-bold tabular-nums mt-0.5", s.pendingAmount > 0 ? "text-amber-600" : "text-foreground")}>
                  {formatCurrency(s.pendingAmount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{s.pendingPayments} payments</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payments Overdue</p>
                <p className={cn("text-xl font-bold tabular-nums mt-0.5", ex.overdueAmount > 0 ? "text-red-600" : "text-emerald-600")}>
                  {ex.overdueAmount > 0 ? formatCurrency(ex.overdueAmount) : "None"}
                </p>
                <p className="text-[10px] text-muted-foreground">revenue at risk</p>
              </div>
            </div>
            {/* Chart */}
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={revenueChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={44}
                />
                <RechartTooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{
                    fontSize: 12, borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Area
                  type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2}
                  fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: "#f97316" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA Watchlist */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">SLA Watchlist</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Deliveries due in ≤ 72 hours</p>
          </CardHeader>
          <CardContent className="pt-0">
            {slaOrders.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No deliveries in the next 3 days</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {slaOrders.slice(0, 6).map((d) => (
                  <Link key={d.orderId} href={`/orders/${d.orderId}`}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors border",
                      d.days === 0 ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/10" :
                      d.days === 1 ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10" :
                      "border-border/40 bg-transparent"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium truncate">{d.company}</p>
                        {d.isRushOrder && <Zap className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{d.quantity} pcs · {d.city || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SLAChip date={d.deliveryDate} />
                      <StatusBadge status={d.status} className="text-[9px] px-1.5 py-0.5 h-auto" />
                    </div>
                  </Link>
                ))}
                {slaOrders.length > 6 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    +{slaOrders.length - 6} more due within 3 days
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 6. ACTIVE ORDERS + QUICK ACTIONS ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Active orders sorted by urgency */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Active Orders by Urgency</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
              <Link href="/orders">All <ArrowRight className="w-3 h-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {urgentOrders.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No active orders.</p>
              )}
              {urgentOrders.map((order) => {
                const days = daysUntil(order.deliveryDate);
                const isOverdue = days < 0;
                const isDueSoon = days >= 0 && days <= 2;
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group border-l-2",
                      isOverdue ? "border-l-red-500 bg-red-50/30 dark:bg-red-950/10" :
                      order.isRushOrder ? "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10" :
                      isDueSoon ? "border-l-orange-400" :
                      "border-l-transparent"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{order.orderNumber}</span>
                        {order.isRushOrder && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/50">
                            <Zap className="w-2.5 h-2.5" /> RUSH
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            {Math.abs(days)}d OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{order.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.lead?.companyName ?? "—"} · {order.eventType.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={order.status} />
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(order.totalAmount)}</p>
                        <SLAChip date={order.deliveryDate} />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions + Sales KPIs */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="grid grid-cols-2 gap-1">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", action.color)}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{action.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Sales Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[
                { label: "Conversion Rate", value: `${s.conversionRate}%`, sub: `${s.wonLeads} of ${s.totalLeads} leads` },
                { label: "Avg Order Value", value: formatCurrency(ex.avgOrderValue), sub: "per confirmed order" },
                { label: "Pipeline Leads", value: ex.seasonPipelineLeads, sub: `${formatCurrency(ex.seasonPipelineValue)} potential` },
                { label: "Follow-ups Due", value: ex.followUpsDueToday, sub: "today", alert: ex.followUpsDueToday > 0 },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-[10px] text-muted-foreground/60">{kpi.sub}</p>
                  </div>
                  <span className={cn(
                    "text-sm font-bold tabular-nums",
                    kpi.alert ? "text-amber-600" : "text-foreground"
                  )}>
                    {kpi.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 7. SEASON PIPELINE SPOTLIGHT ──────────────────────────────────── */}
      <Card className="border-orange-200 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/70 to-amber-50/40 dark:from-orange-950/20 dark:to-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                  {ex.nextSeasonName} Season Pipeline
                </CardTitle>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/60">
                  {ex.nextSeasonDays} days to season
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs border-orange-200 dark:border-orange-800/40" asChild>
              <Link href="/leads"><BarChart3 className="w-3 h-3" />View Pipeline</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Confirmed Orders", value: ex.seasonOrdersConfirmed,
                sub: formatCurrency(ex.seasonConfirmedValue), color: "text-emerald-700 dark:text-emerald-400",
              },
              {
                label: "Pipeline Leads", value: ex.seasonPipelineLeads,
                sub: `${formatCurrency(ex.seasonPipelineValue)} potential`, color: "text-orange-700 dark:text-orange-400",
              },
              {
                label: "Follow-ups Due", value: ex.followUpsDueToday,
                sub: "Today", color: ex.followUpsDueToday > 0 ? "text-red-600 dark:text-red-400" : "text-blue-700 dark:text-blue-400",
              },
              {
                label: "Sales Conversion", value: `${s.conversionRate}%`,
                sub: `${s.wonLeads} of ${s.totalLeads} leads`, color: "text-violet-700 dark:text-violet-400",
              },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-orange-100 dark:border-orange-900/30">
                <p className={cn("text-2xl font-bold tabular-nums", item.color)}>{item.value}</p>
                <p className="text-xs font-medium text-foreground/80 mt-0.5">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
