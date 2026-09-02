"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, AlertTriangle, Zap,
  ArrowRight, ChevronUp, ChevronDown, ShoppingCart, X, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatCurrency, formatDate, daysUntil } from "@/lib/utils";

// ─── Local types ────────────────────────────────────────────────────────────

type OrderStatus =
  | "CONFIRMED" | "ADVANCE_PENDING" | "IN_PRODUCTION" | "PACKING"
  | "QC_PENDING" | "QC_PASSED" | "DISPATCHED" | "DELIVERED"
  | "CANCELLED" | "ON_HOLD";

type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

interface OrderItem { quantity: number; [key: string]: unknown }

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  companyName?: string | null;
  eventType: string;
  deliveryDate: string | Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  isRushOrder: boolean;
  lead: { companyName?: string | null; contactPerson?: string | null };
  assignedTo?: { id: string; name: string } | null;
  items: OrderItem[];
  [key: string]: unknown;
}

interface OrdersClientProps {
  orders: any[];
  currentUser: { id: string; name: string; role: string };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED", "ADVANCE_PENDING", "IN_PRODUCTION", "PACKING",
  "QC_PENDING", "QC_PASSED", "DISPATCHED", "DELIVERED", "CANCELLED", "ON_HOLD",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  CONFIRMED: "Confirmed", ADVANCE_PENDING: "Advance Pending",
  IN_PRODUCTION: "In Production", PACKING: "Packing",
  QC_PENDING: "QC Pending", QC_PASSED: "QC Passed",
  DISPATCHED: "Dispatched", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", ON_HOLD: "On Hold",
};

const EVENT_TYPES = ["DIWALI","CORPORATE","WEDDING","BIRTHDAY","CUSTOM","CHRISTMAS","EID","HOLI","OTHER"];

const PIPELINE: OrderStatus[] = [
  "CONFIRMED","IN_PRODUCTION","PACKING","QC_PENDING","QC_PASSED","DISPATCHED","DELIVERED",
];

const STAGE_COLORS: Record<string, string> = {
  CONFIRMED: "bg-blue-500", IN_PRODUCTION: "bg-purple-500",
  PACKING: "bg-amber-500", QC_PENDING: "bg-orange-500",
  QC_PASSED: "bg-teal-500", DISPATCHED: "bg-cyan-500", DELIVERED: "bg-emerald-500",
};

const LEFT_BORDER: Record<string, string> = {
  CANCELLED: "border-l-red-500", DELIVERED: "border-l-emerald-500",
  IN_PRODUCTION: "border-l-purple-500", PACKING: "border-l-amber-500",
};

type SortKey = "orderNumber" | "deliveryDate" | "totalAmount";
type SortDir = "asc" | "desc";
type DeliveryTab = "all" | "overdue" | "this-week" | "this-month" | "delivered";

// ─── Helpers ────────────────────────────────────────────────────────────────

function isThisWeek(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  return d >= now && d <= weekEnd;
}

function isThisMonth(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function PipelineStrip({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "ON_HOLD") {
    return <div className="w-16 h-1.5 rounded-full bg-muted" />;
  }
  const idx = PIPELINE.indexOf(status as OrderStatus);
  return (
    <div className="flex items-center gap-1">
      {PIPELINE.map((stage, i) => (
        <div
          key={stage}
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            i <= idx ? (STAGE_COLORS[stage] ?? "bg-primary") : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return null;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
    : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
}

// ─── Main component ─────────────────────────────────────────────────────────

const DELETEABLE_STATUSES = ["CONFIRMED", "ADVANCE_PENDING", "CANCELLED"];

export function OrdersClient({ orders: rawOrders, currentUser }: OrdersClientProps) {
  const router = useRouter();
  const orders = rawOrders as Order[];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryTab, setDeliveryTab] = useState<DeliveryTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("deliveryDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = ["ADMIN", "OWNER"].includes(currentUser?.role ?? "");

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete order");
      }
      toast.success(`Order ${deleteTarget.orderNumber} deleted`);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete order");
    } finally {
      setDeleting(false);
    }
  }

  function handleSort(col: SortKey) {
    if (col === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  }

  // ── Stats ──
  const now = new Date();
  const activeOrders = orders.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status));
  const rushCount = orders.filter((o) => o.isRushOrder).length;
  const overdueAll = orders.filter(
    (o) => !["DELIVERED","CANCELLED"].includes(o.status) && daysUntil(o.deliveryDate) < 0
  );
  const revenueThisMonth = orders
    .filter((o) => isThisMonth(o.deliveryDate))
    .reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  // ── Tab counts ──
  const overdueCount = overdueAll.length;
  const thisWeekCount = orders.filter(
    (o) => !["DELIVERED","CANCELLED"].includes(o.status) && isThisWeek(o.deliveryDate)
  ).length;
  const thisMonthCount = orders.filter(
    (o) => !["DELIVERED","CANCELLED"].includes(o.status) && isThisMonth(o.deliveryDate)
  ).length;

  // ── Filter ──
  const filtered = useMemo(() => {
    let list = orders;

    // Delivery tab
    if (deliveryTab === "overdue")
      list = list.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status) && daysUntil(o.deliveryDate) < 0);
    else if (deliveryTab === "this-week")
      list = list.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status) && isThisWeek(o.deliveryDate));
    else if (deliveryTab === "this-month")
      list = list.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status) && isThisMonth(o.deliveryDate));
    else if (deliveryTab === "delivered")
      list = list.filter((o) => o.status === "DELIVERED");

    // Search
    const q = search.toLowerCase();
    if (q)
      list = list.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        (o.lead?.companyName ?? "").toLowerCase().includes(q)
      );

    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (eventFilter !== "all") list = list.filter((o) => o.eventType === eventFilter);
    if (paymentFilter !== "all") list = list.filter((o) => o.paymentStatus === paymentFilter);

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "orderNumber") cmp = a.orderNumber.localeCompare(b.orderNumber);
      else if (sortKey === "deliveryDate")
        cmp = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
      else if (sortKey === "totalAmount") cmp = a.totalAmount - b.totalAmount;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [orders, search, statusFilter, eventFilter, paymentFilter, deliveryTab, sortKey, sortDir]);

  const urgentOrders = filtered.filter(
    (o) => daysUntil(o.deliveryDate) <= 2 && !["DELIVERED","CANCELLED"].includes(o.status)
  );

  const TABS: { key: DeliveryTab; label: string; count?: number; countClass?: string }[] = [
    { key: "all", label: "All" },
    { key: "overdue", label: "Overdue", count: overdueCount, countClass: "bg-red-500 text-white" },
    { key: "this-week", label: "Due This Week", count: thisWeekCount, countClass: "bg-amber-500 text-white" },
    { key: "this-month", label: "Due This Month", count: thisMonthCount },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Gift Orders</h1>
          {/* Stats strip */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              Active: {activeOrders.length}
            </span>
            {rushCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-medium">
                Rush: {rushCount}
              </span>
            )}
            {overdueCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium">
                Overdue: {overdueCount}
              </span>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
              Month Rev: {formatCurrency(revenueThisMonth)}
            </span>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/orders/new">
            <Plus className="w-3.5 h-3.5" /> New Order
          </Link>
        </Button>
      </div>

      {/* Urgent banner */}
      {urgentOrders.length > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            {urgentOrders.length} order{urgentOrders.length > 1 ? "s" : ""} due in ≤ 2 days
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {urgentOrders.slice(0, 5).map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <Badge variant="destructive" className="text-[10px] font-mono">
                  {o.orderNumber} · {o.clientName}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Window Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDeliveryTab(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
              deliveryTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold", tab.countClass ?? "bg-background/40")}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Order #, client, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-56 h-8 text-sm"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {EVENT_TYPES.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {(["PENDING","PARTIAL","PAID","OVERDUE"] as PaymentStatus[]).map((p) => (
              <SelectItem key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Active filter chip */}
        {statusFilter !== "all" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
            {STATUS_LABELS[statusFilter as OrderStatus]}
            <button
              onClick={() => setStatusFilter("all")}
              className="ml-0.5 hover:text-primary/70"
              aria-label="Clear status filter"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        )}
        <p className="text-xs text-muted-foreground ml-auto tabular-nums">{filtered.length} orders</p>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors",
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          All statuses
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 && orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Confirm a quotation or create an order manually to get started."
          action={{ label: "Create Order", onClick: () => router.push("/orders/new") }}
        />
      ) : (
        <Card className="border-border/60 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">
              No orders match your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    {/* Order */}
                    <th
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("orderNumber")}
                    >
                      Order <SortIcon col="orderNumber" sortKey={sortKey} sortDir={sortDir} />
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Client</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Qty</th>
                    {/* Delivery */}
                    <th
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hidden md:table-cell whitespace-nowrap"
                      onClick={() => handleSort("deliveryDate")}
                    >
                      Delivery <SortIcon col="deliveryDate" sortKey={sortKey} sortDir={sortDir} />
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Stage</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Payment</th>
                    {/* Amount — only visible on sm-md where Payment col is hidden */}
                    <th
                      className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hidden sm:table-cell lg:hidden whitespace-nowrap"
                      onClick={() => handleSort("totalAmount")}
                    >
                      Amount <SortIcon col="totalAmount" sortKey={sortKey} sortDir={sortDir} />
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Assigned</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((order) => {
                    const days = daysUntil(order.deliveryDate);
                    const isOverdue = days < 0 && !["DELIVERED","CANCELLED"].includes(order.status);
                    const isRush = order.isRushOrder;
                    const totalQty = (order.items ?? []).reduce((s: number, i: OrderItem) => s + (i.quantity ?? 0), 0);

                    const leftBorder = LEFT_BORDER[order.status] ??
                      (isOverdue ? "border-l-red-500" : isRush ? "border-l-amber-500" : "border-l-blue-400");

                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className={cn(
                          "hover:bg-muted/30 transition-colors border-l-2 cursor-pointer",
                          leftBorder,
                          isRush && !isOverdue && "bg-red-50/30 dark:bg-red-950/10",
                          isOverdue && "bg-amber-50/30 dark:bg-amber-950/10",
                        )}
                      >
                        {/* Order */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">{order.orderNumber}</span>
                            {isRush && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/50">
                                <Zap className="w-2.5 h-2.5" /> RUSH
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            {order.eventType}
                          </span>
                        </td>
                        {/* Client */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[13px] leading-tight">{order.clientName}</p>
                          <p className="text-xs text-muted-foreground">{order.lead?.companyName ?? "—"}</p>
                          {/* Payment indicator — always visible */}
                          {order.paymentStatus === "PAID" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              PAID
                            </span>
                          ) : order.paymentStatus === "OVERDUE" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                              ₹{order.totalAmount.toLocaleString("en-IN")} overdue
                            </span>
                          ) : order.paymentStatus === "PARTIAL" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block" />
                              Unpaid
                            </span>
                          )}
                        </td>
                        {/* Qty */}
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className="tabular-nums text-[13px] font-medium">{totalQty} units</span>
                        </td>
                        {/* Delivery */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className={cn(
                            "text-[13px] font-medium",
                            isOverdue ? "text-red-600 dark:text-red-400"
                              : days <= 3 ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground",
                          )}>
                            {formatDate(order.deliveryDate)}
                          </p>
                          <p className={cn(
                            "text-xs",
                            isOverdue ? "text-red-500"
                              : days <= 3 ? "text-amber-500"
                              : "text-muted-foreground",
                          )}>
                            {isOverdue ? `${Math.abs(days)}d overdue`
                              : days === 0 ? "Today"
                              : `in ${days}d`}
                          </p>
                        </td>
                        {/* Stage */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="space-y-1.5">
                            <PipelineStrip status={order.status} />
                            <StatusBadge status={order.status} />
                          </div>
                        </td>
                        {/* Payment */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <StatusBadge status={order.paymentStatus} />
                          <p className="text-[12px] font-semibold mt-1 tabular-nums">{formatCurrency(order.totalAmount)}</p>
                        </td>
                        {/* Amount — sm-md only; lg+ amount is shown inside the Payment cell */}
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell lg:hidden">
                          <span className="font-semibold text-[13px] tabular-nums">{formatCurrency(order.totalAmount)}</span>
                        </td>
                        {/* Assigned */}
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {order.assignedTo?.name ?? "—"}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {canDelete && DELETEABLE_STATUSES.includes(order.status) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTarget(order)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <Link href={`/orders/${order.id}`}>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete order {deleteTarget?.orderNumber}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the order for {deleteTarget?.clientName}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
