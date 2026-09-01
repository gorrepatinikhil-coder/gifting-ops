"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  DollarSign, Clock, AlertTriangle, CheckCircle,
  Search, Filter, ArrowRight, CreditCard, Check,
  Landmark, Smartphone, Banknote, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { MockPayment, PaymentStatus } from "@/lib/mock-data";

interface PaymentsClientProps {
  payments: MockPayment[];
  currentUser: { id: string; name: string; role: string };
}

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PARTIAL", "PAID", "OVERDUE", "REFUNDED"];

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  REFUNDED: "Refunded",
};

const TYPE_LABELS: Record<string, string> = {
  ADVANCE: "Advance",
  BALANCE: "Balance",
  FULL: "Full Payment",
};

function MethodChip({ method }: { method: string | null | undefined }) {
  if (!method) return <span className="text-[11px] text-muted-foreground">—</span>;
  const m = method.toUpperCase();
  if (m === "UPI") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
        <Smartphone className="w-2.5 h-2.5" /> UPI
      </span>
    );
  }
  if (m === "CASH") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800">
        <Banknote className="w-2.5 h-2.5" /> Cash
      </span>
    );
  }
  // NEFT, RTGS, Cheque, Wire → bank icon
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
      <Landmark className="w-2.5 h-2.5" /> {method}
    </span>
  );
}

export function PaymentsClient({ payments }: PaymentsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [localPayments, setLocalPayments] = useState<MockPayment[]>(payments);

  const filtered = localPayments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.orderNumber.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q) ||
      (p.reference ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const now = new Date();
  const totalCollected = localPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending = localPayments.filter((p) => ["PENDING", "PARTIAL"].includes(p.status)).reduce((s, p) => s + p.amount, 0);
  const totalOverdue = localPayments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);
  const overdueCount = localPayments.filter((p) => p.status === "OVERDUE").length;
  const collectedThisMonth = localPayments
    .filter((p) => p.status === "PAID" && p.paidAt && p.paidAt.getFullYear() === now.getFullYear() && p.paidAt.getMonth() === now.getMonth())
    .reduce((s, p) => s + p.amount, 0);
  const pendingCount = localPayments.filter((p) => ["PENDING", "PARTIAL"].includes(p.status)).length;

  const handleMarkPaid = async (paymentId: string) => {
    const snapshot = localPayments;
    setLocalPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: "PAID" as PaymentStatus, paidAt: new Date(), reference: p.reference ?? `TXN-MANUAL-${Date.now()}` }
          : p
      )
    );
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to verify payment");
      }
      toast.success("Payment marked as received.");
    } catch (e) {
      setLocalPayments(snapshot);
      toast.error(e instanceof Error ? e.message : "Failed to mark payment as paid");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Payment Tracker</h1>
          <p className="text-sm text-muted-foreground">{localPayments.length} payment records</p>
        </div>
        <Button size="sm" variant="outline">
          <Filter className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalCollected)}
          sub={`${localPayments.filter((p) => p.status === "PAID").length} payments received`}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(totalPending)}
          sub={`${localPayments.filter((p) => ["PENDING", "PARTIAL"].includes(p.status)).length} payments due`}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(totalOverdue)}
          sub={`${overdueCount} payment${overdueCount !== 1 ? "s" : ""} past due date`}
          icon={AlertTriangle}
          iconColor={overdueCount > 0 ? "text-red-600" : "text-emerald-600"}
          iconBg={overdueCount > 0 ? "bg-red-50 dark:bg-red-950/40" : "bg-emerald-50 dark:bg-emerald-950/40"}
        />
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(localPayments.reduce((s, p) => s + p.amount, 0))}
          sub="Across all orders"
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            {overdueCount} payment{overdueCount > 1 ? "s are" : " is"} overdue — {formatCurrency(totalOverdue)} outstanding.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 h-7 text-xs"
            onClick={() => setStatusFilter("OVERDUE")}
          >
            View overdue
          </Button>
        </div>
      )}

      {/* Summary strip */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
          <DollarSign className="w-3.5 h-3.5 text-red-500" />
          <span className="text-muted-foreground">Outstanding:</span>
          <span className="font-semibold text-red-600">{formatCurrency(totalPending + totalOverdue)}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-muted-foreground">Collected this month:</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(collectedThisMonth)}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-muted-foreground">Pending payments:</span>
          <span className="font-semibold">{pendingCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-muted-foreground">Total invoiced:</span>
          <span className="font-semibold">{formatCurrency(localPayments.reduce((s, p) => s + p.amount, 0))}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search order, client, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-60 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} results</p>
      </div>

      {/* Payments table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Order</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Client</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Method</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Due Date</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                    No payments match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((payment) => {
                  const isOverdue = payment.status === "OVERDUE";
                  const isPending = ["PENDING", "PARTIAL"].includes(payment.status);
                  return (
                    <tr
                      key={payment.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isOverdue && "bg-red-50/60 dark:bg-red-950/20"
                      )}
                    >
                      <td className={cn(
                        "px-5 py-3.5",
                        isOverdue && "border-l-4 border-l-red-500"
                      )}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <span className="font-mono text-[11px] text-muted-foreground">{payment.orderNumber}</span>
                        </div>
                        {payment.reference && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{payment.reference}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[13px]">{payment.clientName}</p>
                        <p className="text-xs text-muted-foreground">{payment.companyName}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <Badge variant="outline" className="text-[11px] font-medium">
                          {TYPE_LABELS[payment.type] ?? payment.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <MethodChip method={payment.method} />
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className={cn(
                          "text-[13px]",
                          isOverdue ? "text-red-600 font-medium" : "text-foreground"
                        )}>
                          {payment.dueDate ? formatDate(payment.dueDate) : "—"}
                        </p>
                        {payment.paidAt && (
                          <p className="text-xs text-muted-foreground">
                            Paid {formatDate(payment.paidAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-semibold text-[13px]">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {(isPending || isOverdue) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 whitespace-nowrap"
                            onClick={() => handleMarkPaid(payment.id)}
                          >
                            <Check className="w-3 h-3" /> Mark Paid
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/orders/${payment.orderId}`}>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
