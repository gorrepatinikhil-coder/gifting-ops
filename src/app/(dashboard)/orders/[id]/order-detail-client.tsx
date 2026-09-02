"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Zap, Printer, AlertTriangle, CheckCircle2, ClipboardList, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  OrderLifecycleTracker,
  type LifecycleStageKey,
  type LifecycleHistoryEntry,
  mapOrderStatusToLifecycle,
} from "@/components/orders/order-lifecycle-tracker";

interface OrderDetailClientProps {
  order: {
    id: string;
    orderNumber: string;
    clientName: string;
    clientPhone?: string | null;
    clientEmail?: string | null;
    clientCompany?: string | null;
    eventType: string;
    deliveryDate: Date;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    advanceAmount: number;
    paidAmount?: number;
    balanceAmount: number;
    isRushOrder: boolean;
    notes?: string | null;
    specialInstructions?: string | null;
    gstAmount?: number;
    cardMessage?: string | null;
    ribbonColor?: string | null;
    logoPlacement?: string | null;
    brandingNotes?: string | null;
    dietaryNotes?: string | null;
    packagingNotes?: string | null;
    internalNotes?: string | null;
    lifecycleStage?: LifecycleStageKey;
    lifecycleHistory?: LifecycleHistoryEntry[];
    lead?: { companyName: string; contactPerson: string; phone?: string } | null;
    createdBy: { name: string; email: string };
    assignedTo?: { name: string } | null;
    items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number; packaging?: string | null; branding?: string | null }[];
    deliveryAddresses: { id: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; quantity?: number }[];
    payments: { id: string; amount: number; type: string; method?: string; reference?: string | null; transactionId?: string | null; createdAt: Date; verifiedAt?: Date | null; verifiedBy?: { name: string } | null }[];
    productionBatches: { id: string; batchNumber: string; productName: string; quantity: number; status: string; scheduledDate: Date; deadline?: Date | null; completedAt?: Date | null; assignedTo?: { name: string } | null; shortages?: string | null }[];
    packingUnits: { id: string; unitNumber: number; status: string; packedAt?: Date | null }[];
    qcLogs: { id: string; result: string; createdAt: Date; inspectedBy: { name: string } }[];
    dispatches: { id: string; challanNumber: string; status: string; driverName?: string | null; vehicleNumber?: string | null; dispatchedAt?: Date; deliveredAt?: Date | null; podReceiverName?: string | null; podTimestamp?: Date | null }[];
    auditLogs: { id: string; action: string; entity: string; createdAt: Date; user: { name: string } }[];
  };
  currentUser: { id: string; name: string; role: string };
}

const DELETEABLE_STATUSES = ["CONFIRMED", "ADVANCE_PENDING", "CANCELLED"];

export function OrderDetailClient({ order, currentUser }: OrderDetailClientProps) {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = ["ADMIN", "OWNER"].includes(currentUser.role) && DELETEABLE_STATUSES.includes(order.status);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete order");
      }
      toast.success(`Order ${order.orderNumber} deleted`);
      router.push("/orders");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete order");
      setDeleting(false);
    }
  }

  const lifecycleStage = order.lifecycleStage ?? mapOrderStatusToLifecycle(order.status);
  const lifecycleHistory: LifecycleHistoryEntry[] = order.lifecycleHistory ?? [];

  const days = daysUntil(order.deliveryDate);
  const isUrgent = days <= 2 && !["DELIVERED", "CANCELLED", "PAYMENT_CLOSED"].includes(order.status);
  const totalPaid = order.payments.reduce((s, p) => s + p.amount, 0);
  const balanceDue = order.totalAmount - totalPaid;

  const handleAdvanceStage = async (nextStage: LifecycleStageKey) => {
    setUpdatingStatus(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lifecycleStage: nextStage }),
    });
    if (res.ok) {
      toast.success(`Moved to: ${nextStage.replace(/_/g, " ")}`);
      router.refresh();
    } else {
      toast.error("Failed to update stage.");
    }
    setUpdatingStatus(false);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/orders"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-mono">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
              {order.isRushOrder && (
                <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                  <Zap className="w-2.5 h-2.5 mr-0.5" />RUSH
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {order.clientName}
              {order.lead?.companyName && ` · ${order.lead.companyName}`}
              {" · "}{order.eventType.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}/production-sheet`}>
              <ClipboardList className="w-3.5 h-3.5" />Production Sheet
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />Print
          </Button>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />Delete
            </Button>
          )}
        </div>
      </div>

      {/* ── Urgency banner ─────────────────────────────────────────────────── */}
      {isUrgent && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg border text-sm font-medium",
          days < 0
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            : "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400",
        )}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {days < 0
            ? `Delivery was ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago — this order is overdue!`
            : `Delivery in ${days} day${days !== 1 ? "s" : ""} — ${formatDate(order.deliveryDate)}`}
        </div>
      )}

      {/* ── Payment balance strip ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg border bg-muted/30 text-sm flex-wrap">
        <span className="text-muted-foreground text-xs font-medium">Payment</span>
        <span className="tabular-nums">
          Total <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="tabular-nums">
          Paid <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="tabular-nums">
          Balance{" "}
          <span className={cn("font-semibold", balanceDue > 0 ? "text-red-600" : "text-emerald-600")}>
            {formatCurrency(Math.max(0, balanceDue))}
          </span>
        </span>
        {balanceDue > 0 && (
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" asChild>
            <Link href={`/payments?orderId=${order.id}`}>Record Payment</Link>
          </Button>
        )}
      </div>

      {/* ── Lifecycle tracker ───────────────────────────────────────────────── */}
      <OrderLifecycleTracker
        currentStage={lifecycleStage}
        history={lifecycleHistory}
        orderId={order.id}
        isRushOrder={order.isRushOrder}
        deliveryDate={order.deliveryDate}
        paymentStatus={order.paymentStatus}
        canAdvance={["ADMIN", "OWNER", "SALES", "CHEF_OPS"].includes(currentUser.role)}
        onAdvanceStage={handleAdvanceStage}
      />

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">
            {(() => {
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return `Items (${order.items.length} · ${totalQty.toLocaleString("en-IN")} units)`;
            })()}
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {balanceDue > 0 && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />}
          </TabsTrigger>
          <TabsTrigger value="production">Kitchen</TabsTrigger>
          <TabsTrigger value="packing">Packing ({order.packingUnits.length})</TabsTrigger>
          <TabsTrigger value="qc">QC ({order.qcLogs.length})</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Order Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Order #" value={<span className="font-mono text-xs">{order.orderNumber}</span>} />
                <Row label="Client" value={order.clientName} />
                <Row label="Company" value={order.lead?.companyName ?? order.clientCompany ?? "—"} />
                <Row label="Phone" value={order.clientPhone ?? order.lead?.phone ?? "—"} />
                <Row label="Email" value={order.clientEmail ?? "—"} />
                <Row label="Event" value={order.eventType.replace(/_/g, " ")} />
                <Row label="Delivery" value={formatDate(order.deliveryDate)} />
                <Row label="Total" value={<span className="font-bold">{formatCurrency(order.totalAmount)}</span>} />
                <Row label="GST (18%)" value={formatCurrency(order.gstAmount ?? Math.round(order.totalAmount * 18 / 118))} />
                <Row label="Created by" value={order.createdBy.name} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Customisation & Branding</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Card Message" value={order.cardMessage ?? "—"} />
                <Row label="Ribbon Colour" value={order.ribbonColor ?? "—"} />
                <Row label="Logo Placement" value={order.logoPlacement ?? "—"} />
                <Row label="Branding Notes" value={order.brandingNotes ?? "—"} />
                <Row label="Dietary Notes" value={order.dietaryNotes ?? "—"} />
                <Row label="Packaging Notes" value={order.packagingNotes ?? "—"} />
                <Row label="Special Instructions" value={order.specialInstructions ?? "—"} />
                {order.internalNotes && (
                  <Row label="Internal Notes" value={<span className="text-muted-foreground italic">{order.internalNotes}</span>} />
                )}
              </CardContent>
            </Card>

            {order.deliveryAddresses.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-sm">Delivery Addresses ({order.deliveryAddresses.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {order.deliveryAddresses.map((addr) => (
                      <div key={addr.id} className="p-3 rounded-lg border text-sm">
                        <p className="font-medium">{addr.recipientName}</p>
                        <p className="text-muted-foreground">{addr.phone}</p>
                        <p className="mt-1">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                        <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                        {addr.quantity && addr.quantity > 1 && (
                          <Badge variant="outline" className="mt-1.5">Qty: {addr.quantity}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Items ── */}
        <TabsContent value="items">
          <Card>
            <CardContent className="pt-4">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left py-2 font-medium">Product / Hamper</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Unit Price</th>
                    <th className="text-right py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium">{item.productName}</p>
                        {item.packaging && <p className="text-xs text-muted-foreground">Packaging: {item.packaging}</p>}
                        {item.branding && <p className="text-xs text-muted-foreground">Branding: {item.branding}</p>}
                      </td>
                      <td className="py-3 text-right font-mono">{item.quantity.toLocaleString("en-IN")}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/20">
                  <tr>
                    <td colSpan={2} />
                    <td className="py-3 text-right text-xs text-muted-foreground">GST (18%)</td>
                    <td className="py-3 text-right text-sm">{formatCurrency(order.gstAmount ?? Math.round(order.totalAmount * 18 / 118))}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} />
                    <td className="py-3 text-right font-bold text-sm">Grand Total</td>
                    <td className="py-3 text-right font-bold text-base">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payments ── */}
        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Order Total</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(order.totalAmount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Amount Received</p>
                  <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(totalPaid)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Balance Due</p>
                  <p className={cn("text-xl font-bold mt-1", balanceDue > 0 ? "text-red-600" : "text-emerald-600")}>
                    {formatCurrency(Math.max(0, balanceDue))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Payment History</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/payments?orderId=${order.id}`}>+ Record Payment</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {order.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No payments recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {order.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                            <span className="text-sm font-semibold">{formatCurrency(p.amount)}</span>
                            {p.method && <span className="text-xs text-muted-foreground">via {p.method}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(p.createdAt)}
                            {(p.transactionId ?? p.reference) && ` · ${p.transactionId ?? p.reference}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {p.verifiedBy ? (
                            <Badge variant="success" className="text-[10px]">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">Pending Verification</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Kitchen / Production ── */}
        <TabsContent value="production">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Kitchen & Assembly Batches</CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href="/production">View Kitchen Schedule</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {order.productionBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No production batches created yet</p>
              ) : (
                <div className="space-y-3">
                  {order.productionBatches.map((batch) => (
                    <div key={batch.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{batch.productName}</p>
                          <p className="text-xs font-mono text-muted-foreground">{batch.batchNumber}</p>
                        </div>
                        <StatusBadge status={batch.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>Units: <span className="text-foreground font-medium">{batch.quantity.toLocaleString("en-IN")}</span></div>
                        <div>Deadline: <span className="text-foreground">{formatDate(batch.deadline ?? batch.scheduledDate)}</span></div>
                        <div>Assigned: <span className="text-foreground">{batch.assignedTo?.name ?? "—"}</span></div>
                      </div>
                      {batch.shortages && (
                        <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{batch.shortages}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Packing ── */}
        <TabsContent value="packing">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Packing Units</CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href="/packing">Manage Packing</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {order.packingUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No packing units created yet</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Approved: {order.packingUnits.filter(u => u.status === "APPROVED").length}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Packed: {order.packingUnits.filter(u => u.status === "PACKED").length}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />Pending: {order.packingUnits.filter(u => u.status === "PENDING").length}</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {order.packingUnits.map((unit) => (
                      <div key={unit.id} className={cn(
                        "p-2 rounded-lg border text-center",
                        unit.status === "APPROVED" && "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30",
                        unit.status === "REJECTED" && "bg-red-50 border-red-200 dark:bg-red-950/30",
                        unit.status === "PACKED" && "bg-blue-50 border-blue-200 dark:bg-blue-950/30",
                        unit.status === "PENDING" && "bg-muted/40",
                      )}>
                        <p className="text-xs font-mono font-bold">#{unit.unitNumber}</p>
                        <p className={cn(
                          "text-[9px] mt-0.5 font-medium",
                          unit.status === "APPROVED" && "text-emerald-600",
                          unit.status === "REJECTED" && "text-red-600",
                          unit.status === "PACKED" && "text-blue-600",
                          unit.status === "PENDING" && "text-muted-foreground",
                        )}>{unit.status}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QC ── */}
        <TabsContent value="qc">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">QC Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              {order.qcLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No QC logs recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {order.qcLogs.map((log) => (
                    <div key={log.id} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      log.result === "PASS"
                        ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                        : "bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-900/50",
                    )}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded",
                            log.result === "PASS"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                          )}>
                            {log.result}
                          </span>
                          <span className="text-sm font-medium">Inspected by {log.inspectedBy.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(log.createdAt)}</p>
                      </div>
                      {log.result === "PASS" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Dispatch ── */}
        <TabsContent value="dispatch">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Dispatch & Delivery</CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dispatch">Manage Dispatch</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {order.dispatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No dispatch records yet</p>
              ) : (
                <div className="space-y-3">
                  {order.dispatches.map((d) => (
                    <div key={d.id} className={cn(
                      "p-3 rounded-lg border",
                      d.status === "DELIVERED" && "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20",
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{d.challanNumber}</p>
                          <p className="text-sm font-medium mt-0.5">
                            {d.driverName ?? "Driver TBD"}{d.vehicleNumber ? ` · ${d.vehicleNumber}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      {d.dispatchedAt && (
                        <p className="text-xs text-muted-foreground">Dispatched: {formatDateTime(d.dispatchedAt)}</p>
                      )}
                      {d.podReceiverName && (
                        <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          POD: Received by <strong>{d.podReceiverName}</strong>
                          {d.podTimestamp && ` at ${formatDateTime(d.podTimestamp)}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Log ── */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-4">
              {order.auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No audit log entries</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />
                  <div className="space-y-4">
                    {order.auditLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 relative">
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center flex-shrink-0 z-10">
                          <div className="w-2 h-2 rounded-full bg-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <p className="text-sm">
                            <span className="font-medium">{log.user.name}</span>
                            {" "}<span className="text-muted-foreground">{log.action}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={(o) => !o && setShowDeleteDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete order {order.orderNumber}?</DialogTitle>
            <DialogDescription>
              This will permanently delete this order for {order.clientName}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground text-xs w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="font-medium flex-1 text-sm">{value}</span>
    </div>
  );
}
