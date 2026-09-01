"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Package, CheckCircle2, XCircle, Plus, ChevronDown, ChevronUp,
  AlertTriangle, RotateCcw, ArrowRight, Zap, Search, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, daysUntil, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PackingStatus = "PENDING" | "IN_PROGRESS" | "PACKED" | "APPROVED" | "REJECTED";

interface UnitState {
  id: string;
  unitNumber: number;
  status: PackingStatus;
  correctBox: boolean;
  productArranged: boolean;
  ribbonAdded: boolean;
  brandingDone: boolean;
  insertsAdded: boolean;
  labelAttached: boolean;
  notes: string;
  rejectionNote: string;      // set by QC when rejected
  rejectedCount: number;      // how many times rejected
}

interface OrderState {
  id: string;
  orderNumber: string;
  clientName: string;
  status: string;
  deliveryDate: Date;
  items: { productName: string; quantity: number }[];
  units: UnitState[];
  expanded: boolean;
  sentToQC: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECKLIST = [
  { key: "correctBox"      as const, label: "Correct hamper box & size confirmed" },
  { key: "productArranged" as const, label: "Contents placed & neatly arranged" },
  { key: "ribbonAdded"     as const, label: "Ribbon / bow tied securely" },
  { key: "brandingDone"    as const, label: "Logo print / branding applied" },
  { key: "insertsAdded"    as const, label: "Message card & inserts added" },
  { key: "labelAttached"   as const, label: "Address & dispatch label attached" },
];

const UNIT_STATUS_STYLE: Record<PackingStatus, string> = {
  PENDING:     "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
  PACKED:      "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
  APPROVED:    "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
  REJECTED:    "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
};

function buildUnit(src: { id: string; unitNumber: number; status: PackingStatus; correctBox: boolean; productArranged: boolean; ribbonAdded: boolean; brandingDone: boolean; insertsAdded: boolean; labelAttached: boolean }, rejNote?: string): UnitState {
  return {
    ...src,
    notes: "",
    rejectionNote: rejNote ?? "",
    rejectedCount: rejNote ? 1 : 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PackingClient({
  orders: rawOrders,
}: {
  orders: Array<{
    id: string;
    orderNumber: string;
    clientName: string;
    status: string;
    deliveryDate: Date;
    items: { productName: string; quantity: number }[];
    packingUnits: Array<{ id: string; unitNumber: number; status: PackingStatus; correctBox: boolean; productArranged: boolean; ribbonAdded: boolean; brandingDone: boolean; insertsAdded: boolean; labelAttached: boolean }>;
  }>;
  currentUser: { role: string };
}) {
  const [orders, setOrders] = useState<OrderState[]>(() =>
    rawOrders.map((o) => ({
      ...o,
      units: o.packingUnits.map((u) => buildUnit(u)),
      expanded: true,
      sentToQC: o.status === "QC_PENDING",
    }))
  );

  // Which unit is selected (open checklist)
  const [activeUnit, setActiveUnit] = useState<{ orderId: string; unitId: string } | null>(null);

  // ── Search / filter state ────────────────────────────────────────────────
  const [packSearch, setPackSearch] = useState("");
  const [packStatusFilter, setPackStatusFilter] = useState<"All" | "Pending" | "Packing" | "Done">("All");

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const mutOrder = (orderId: string, fn: (o: OrderState) => OrderState) =>
    setOrders((prev) => prev.map((o) => (o.id === orderId ? fn(o) : o)));

  const mutUnit = (orderId: string, unitId: string, fn: (u: UnitState) => UnitState) =>
    mutOrder(orderId, (o) => ({ ...o, units: o.units.map((u) => (u.id === unitId ? fn(u) : u)) }));

  const generateUnits = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const total = order.items.reduce((s, i) => s + i.quantity, 0);
    try {
      const res = await fetch(`/api/packing/${orderId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: total }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to generate units");
      }
      const created: Array<{ id: string; unitNumber: number }> = await res.json();
      const units: UnitState[] = created.map((u) => ({
        id: u.id,
        unitNumber: u.unitNumber,
        status: "PENDING",
        correctBox: false,
        productArranged: false,
        ribbonAdded: false,
        brandingDone: false,
        insertsAdded: false,
        labelAttached: false,
        notes: "",
        rejectionNote: "",
        rejectedCount: 0,
      }));
      mutOrder(orderId, (o) => ({ ...o, units }));
      toast.success(`${total} packing units created.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate packing units");
    }
  };

  const toggleCheck = (orderId: string, unitId: string, key: keyof Pick<UnitState, "correctBox" | "productArranged" | "ribbonAdded" | "brandingDone" | "insertsAdded" | "labelAttached">, value: boolean) => {
    mutUnit(orderId, unitId, (u) => {
      const updated = { ...u, [key]: value };
      // Auto-set to IN_PROGRESS when first item checked
      if (value && u.status === "PENDING") updated.status = "IN_PROGRESS";
      return updated;
    });
  };

  const markPacked = (orderId: string, unitId: string, autoAdvance = false) => {
    const order = orders.find((o) => o.id === orderId);
    const unit = order?.units.find((u) => u.id === unitId);
    if (!unit) return;
    const allDone = CHECKLIST.every(({ key }) => unit[key]);
    if (!allDone) { toast.error("Complete all checklist items first."); return; }
    mutUnit(orderId, unitId, (u) => ({ ...u, status: "PACKED" }));
    toast.success(`Unit #${unit.unitNumber} marked as packed.`);
    fetch(`/api/packing/unit/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "PACKED",
        correctBox: unit.correctBox,
        productArranged: unit.productArranged,
        ribbonAdded: unit.ribbonAdded,
        brandingDone: unit.brandingDone,
        insertsAdded: unit.insertsAdded,
        labelAttached: unit.labelAttached,
      }),
    }).catch(() => console.error("Failed to persist packing unit"));

    if (autoAdvance) {
      // Find next PENDING unit after this one
      const nextPending = order?.units.find(
        (u) => u.id !== unitId && (u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED")
      );
      if (nextPending) {
        setActiveUnit({ orderId, unitId: nextPending.id });
      } else {
        setActiveUnit(null);
      }
    } else {
      setActiveUnit(null);
    }
  };

  const markAllRemaining = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    // Only bulk-mark units that have every checklist item checked
    const toMark = order.units.filter(
      (u) =>
        (u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED") &&
        CHECKLIST.every(({ key }) => u[key])
    );
    if (toMark.length === 0) {
      toast.error("No remaining units have all checklist items completed yet.");
      return;
    }
    const ids = new Set(toMark.map((u) => u.id));
    mutOrder(orderId, (o) => ({
      ...o,
      units: o.units.map((u) =>
        ids.has(u.id) ? { ...u, status: "PACKED" as PackingStatus } : u
      ),
    }));
    toast.success(`${toMark.length} unit${toMark.length !== 1 ? "s" : ""} marked as packed.`);
    setActiveUnit(null);
  };

  const sendToQC = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const allPacked = order.units.every((u) => u.status === "PACKED" || u.status === "APPROVED");
    if (!allPacked) { toast.error("All units must be packed before sending to QC."); return; }
    mutOrder(orderId, (o) => ({ ...o, status: "QC_PENDING", sentToQC: true }));
    toast.success("Order sent to QC inspection.");
  };

  // ── Filtered order list ───────────────────────────────────────────────────

  const filteredPackOrders = useMemo(() => {
    const q = packSearch.toLowerCase().trim();
    return orders.filter((order) => {
      if (q && !order.orderNumber.toLowerCase().includes(q) && !order.clientName.toLowerCase().includes(q)) return false;
      if (packStatusFilter === "Pending" && order.status !== "PACKING" && !order.units.some((u) => u.status === "PENDING")) return false;
      if (packStatusFilter === "Packing" && !order.units.some((u) => u.status === "IN_PROGRESS")) return false;
      if (packStatusFilter === "Done" && !order.sentToQC && !order.units.every((u) => ["PACKED", "APPROVED"].includes(u.status))) return false;
      return true;
    });
  }, [orders, packSearch, packStatusFilter]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold">Hamper Packing Line</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {orders.length} order{orders.length !== 1 ? "s" : ""} in the packing queue
        </p>
      </div>

      {/* ── Summary strip ── */}
      {orders.length > 0 && (() => {
        const allUnits = orders.flatMap((o) => o.units);
        const pending  = allUnits.filter((u) => u.status === "PENDING").length;
        const inProg   = allUnits.filter((u) => u.status === "IN_PROGRESS").length;
        const packed   = allUnits.filter((u) => u.status === "PACKED" || u.status === "APPROVED").length;
        const rejected = allUnits.filter((u) => u.status === "REJECTED").length;
        const total    = allUnits.length;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Pending",    value: pending,  color: "text-gray-600" },
              { label: "In Progress", value: inProg, color: "text-blue-600" },
              { label: "Packed",     value: packed,   color: "text-emerald-600" },
              { label: "Rejected",   value: rejected, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  {total > 0 && <p className="text-[10px] text-muted-foreground">{Math.round((value / total) * 100)}% of {total}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* ── Filter row ── */}
      {orders.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Search by order # or client name…"
              value={packSearch}
              onChange={(e) => setPackSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {(["All", "Pending", "Packing", "Done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPackStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  packStatusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders to pack"
          description="Orders ready for packing appear here once production is complete." />
      ) : filteredPackOrders.length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try adjusting your search or filter." />
      ) : (
        <div className="space-y-3">
          {filteredPackOrders.map((order) => {
            const days      = daysUntil(order.deliveryDate);
            const totalQty  = order.items.reduce((s, i) => s + i.quantity, 0);
            const packed    = order.units.filter((u) => ["PACKED", "APPROVED"].includes(u.status)).length;
            const rejected  = order.units.filter((u) => u.status === "REJECTED").length;
            const pct       = order.units.length > 0 ? Math.round((packed / order.units.length) * 100) : 0;
            const allPacked = order.units.length > 0 && order.units.every((u) => ["PACKED", "APPROVED"].includes(u.status));
            const active    = activeUnit?.orderId === order.id ? activeUnit.unitId : null;

            return (
              <Card key={order.id} className={cn(days <= 1 && "border-orange-300 dark:border-orange-800")}>
                {/* ── Order header ── */}
                <CardHeader
                  className="cursor-pointer flex-row items-center gap-3 py-3 px-4"
                  onClick={() => mutOrder(order.id, (o) => ({ ...o, expanded: !o.expanded }))}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-[11px] text-muted-foreground">{order.orderNumber}</span>
                      <StatusPill status={order.status} />
                      {days <= 1 && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                      {rejected > 0 && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                          <XCircle className="w-2.5 h-2.5 mr-0.5" />{rejected} Rejected
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold">{order.clientName}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                      <span>Delivery: {formatDate(order.deliveryDate)}</span>
                      {order.units.length > 0
                        ? <span>{packed}/{order.units.length} packed ({pct}%)</span>
                        : <span>{totalQty} items total</span>}
                    </div>
                  </div>
                  {order.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </CardHeader>

                {order.expanded && (
                  <CardContent className="border-t pt-4 px-4 pb-4 space-y-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Hamper Contents</p>
                      <div className="flex flex-wrap gap-1.5">
                        {order.items.map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {item.productName} × {item.quantity.toLocaleString("en-IN")}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {order.units.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Packing progress</span>
                          <span>{packed} / {order.units.length} units</span>
                        </div>
                        <Progress value={pct} className={cn("h-2", pct === 100 ? "[&>div]:bg-emerald-500" : "")} />
                      </div>
                    )}

                    {/* Generate units CTA */}
                    {order.units.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No packing units created yet</p>
                        <Button size="sm" onClick={() => generateUnits(order.id)}>
                          <Plus className="w-3.5 h-3.5" />Generate {totalQty} Packing Units
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* ── Unit grid (compact for >30 units) ── */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Units — click to open checklist
                          </p>
                          {order.units.length > 30 ? (
                            /* Compact summary view */
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold">{packed}/{order.units.length} packed</span>
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              </div>
                              <Progress value={pct} className={cn("h-3", pct === 100 ? "[&>div]:bg-emerald-500" : "")} />
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {[
                                  { label: "Pending",     count: order.units.filter((u) => u.status === "PENDING").length,     cls: "text-gray-600" },
                                  { label: "In Progress", count: order.units.filter((u) => u.status === "IN_PROGRESS").length,  cls: "text-blue-600" },
                                  { label: "Packed",      count: order.units.filter((u) => u.status === "PACKED").length,       cls: "text-indigo-600" },
                                  { label: "Approved",    count: order.units.filter((u) => u.status === "APPROVED").length,     cls: "text-emerald-600" },
                                  { label: "Rejected",    count: order.units.filter((u) => u.status === "REJECTED").length,     cls: "text-red-600" },
                                ].filter((s) => s.count > 0).map(({ label, count, cls }) => (
                                  <div key={label} className="p-2 rounded-lg border bg-muted/20 text-center">
                                    <p className={cn("text-lg font-bold", cls)}>{count}</p>
                                    <p className="text-[10px] text-muted-foreground">{label}</p>
                                  </div>
                                ))}
                              </div>
                              {/* Bulk-mark action */}
                              {order.units.filter((u) => u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED").length > 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs"
                                  onClick={() => markAllRemaining(order.id)}
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  Mark All Remaining as Packed
                                </Button>
                              )}

                              {/* Still show a select-by-status dropdown to pick a unit */}
                              <div className="flex flex-wrap gap-1.5">
                                {order.units.filter((u) => u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED").slice(0, 10).map((unit) => {
                                  const isActive = active === unit.id;
                                  return (
                                    <button
                                      key={unit.id}
                                      onClick={() => setActiveUnit(isActive ? null : { orderId: order.id, unitId: unit.id })}
                                      className={cn(
                                        "w-11 h-11 rounded-lg border-2 text-xs font-bold transition-all relative",
                                        UNIT_STATUS_STYLE[unit.status],
                                        isActive && "ring-2 ring-offset-1 ring-primary scale-105",
                                      )}
                                      title={`Unit #${unit.unitNumber} — ${unit.status}`}
                                    >
                                      #{unit.unitNumber}
                                      {unit.status === "REJECTED" && <span className="absolute -top-1 -right-1 text-red-500 text-[10px]">✗</span>}
                                    </button>
                                  );
                                })}
                                {order.units.filter((u) => u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED").length > 10 && (
                                  <span className="text-xs text-muted-foreground self-center ml-1">
                                    +{order.units.filter((u) => u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED").length - 10} more pending
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Original numbered grid for ≤30 units */
                            <>
                              <div className="flex flex-wrap gap-2">
                                {order.units.map((unit) => {
                                  const isActive = active === unit.id;
                                  return (
                                    <button
                                      key={unit.id}
                                      onClick={() => setActiveUnit(
                                        isActive ? null : { orderId: order.id, unitId: unit.id }
                                      )}
                                      className={cn(
                                        "w-11 h-11 rounded-lg border-2 text-xs font-bold transition-all relative",
                                        UNIT_STATUS_STYLE[unit.status],
                                        isActive && "ring-2 ring-offset-1 ring-primary scale-105",
                                        unit.status === "APPROVED" && "cursor-default",
                                      )}
                                      title={`Unit #${unit.unitNumber} — ${unit.status}${unit.rejectionNote ? `\nRejected: ${unit.rejectionNote}` : ""}`}
                                    >
                                      #{unit.unitNumber}
                                      {unit.status === "APPROVED" && <span className="absolute -top-1 -right-1 text-emerald-500 text-[10px]">✓</span>}
                                      {unit.status === "REJECTED" && <span className="absolute -top-1 -right-1 text-red-500 text-[10px]">✗</span>}
                                      {unit.status === "PACKED"   && <span className="absolute -top-1 -right-1 text-indigo-500 text-[10px]">●</span>}
                                      {unit.rejectedCount > 0 && unit.status !== "REJECTED" && (
                                        <span className="absolute -bottom-1 -right-1 bg-orange-400 text-white rounded-full w-3 h-3 text-[8px] flex items-center justify-center">{unit.rejectedCount}</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              {/* Legend */}
                              <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
                                {[
                                  { label: "Pending",     cls: "bg-gray-200 dark:bg-gray-700" },
                                  { label: "In Progress", cls: "bg-blue-200 dark:bg-blue-800" },
                                  { label: "Packed",      cls: "bg-indigo-200 dark:bg-indigo-800" },
                                  { label: "QC Approved", cls: "bg-emerald-200 dark:bg-emerald-800" },
                                  { label: "Rejected",    cls: "bg-red-200 dark:bg-red-800" },
                                ].map(({ label, cls }) => (
                                  <span key={label} className="flex items-center gap-1">
                                    <span className={cn("w-2.5 h-2.5 rounded-sm inline-block", cls)} />
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* ── Active unit checklist ── */}
                        {active && (() => {
                          const unit = order.units.find((u) => u.id === active)!;
                          if (!unit) return null;
                          const doneItems = CHECKLIST.filter(({ key }) => unit[key]).length;
                          const allDone   = doneItems === CHECKLIST.length;
                          const isLocked  = unit.status === "APPROVED";

                          return (
                            <div className={cn(
                              "rounded-xl border-2 p-4 space-y-4",
                              unit.status === "REJECTED"
                                ? "border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800"
                                : unit.status === "PACKED" || unit.status === "APPROVED"
                                ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800"
                                : "border-primary/30 bg-primary/5"
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">Unit #{unit.unitNumber}</span>
                                  <StatusPill status={unit.status} />
                                  {unit.rejectedCount > 0 && (
                                    <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
                                      <RotateCcw className="w-2.5 h-2.5 mr-0.5" />Rejected {unit.rejectedCount}×
                                    </Badge>
                                  )}
                                </div>
                                <button onClick={() => setActiveUnit(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                              </div>

                              {/* Rejection note from QC */}
                              {unit.rejectionNote && (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div className="text-xs">
                                    <p className="font-semibold text-red-700 dark:text-red-400 mb-0.5">QC Rejection Note:</p>
                                    <p className="text-red-600 dark:text-red-300">{unit.rejectionNote}</p>
                                  </div>
                                </div>
                              )}

                              {/* Checklist */}
                              <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Packing Checklist ({doneItems}/{CHECKLIST.length})
                                </p>
                                {CHECKLIST.map(({ key, label }) => (
                                  <div key={key} className="flex items-center gap-3">
                                    <Checkbox
                                      id={`${unit.id}-${key}`}
                                      checked={unit[key]}
                                      onCheckedChange={(v) => toggleCheck(order.id, unit.id, key, !!v)}
                                      disabled={isLocked}
                                      className={unit[key] ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" : ""}
                                    />
                                    <label
                                      htmlFor={`${unit.id}-${key}`}
                                      className={cn(
                                        "text-sm cursor-pointer select-none",
                                        unit[key] ? "line-through text-muted-foreground" : "",
                                        isLocked && "cursor-default",
                                      )}
                                    >
                                      {label}
                                    </label>
                                    {unit[key] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                                  </div>
                                ))}
                              </div>

                              {/* Progress mini-bar */}
                              <Progress
                                value={(doneItems / CHECKLIST.length) * 100}
                                className={cn("h-1.5", allDone ? "[&>div]:bg-emerald-500" : "")}
                              />

                              {/* Notes */}
                              {!isLocked && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Notes (optional)</p>
                                  <textarea
                                    rows={2}
                                    value={unit.notes}
                                    onChange={(e) => mutUnit(order.id, unit.id, (u) => ({ ...u, notes: e.target.value }))}
                                    placeholder="Any notes about this unit…"
                                    className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </div>
                              )}

                              {/* Actions */}
                              {!isLocked && (
                                <div className="flex flex-col gap-2">
                                  {(unit.status === "PENDING" || unit.status === "IN_PROGRESS" || unit.status === "REJECTED") && (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="flex-1"
                                        disabled={!allDone}
                                        onClick={() => markPacked(order.id, unit.id)}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {unit.status === "REJECTED" ? "Re-pack & Mark Done" : "Mark as Packed"}
                                      </Button>
                                      {/* Mark All Remaining — only shown when all checklist items done */}
                                      {allDone && order.units.filter((u) => u.status === "PENDING" || u.status === "IN_PROGRESS" || u.status === "REJECTED").length > 1 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-shrink-0 text-xs"
                                          title="Mark this unit as packed and auto-advance to the next pending unit"
                                          onClick={() => markPacked(order.id, unit.id, true)}
                                        >
                                          <ChevronsRight className="w-3.5 h-3.5" />
                                          Next
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  {unit.status === "PACKED" && (
                                    <div className="flex-1 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                      <CheckCircle2 className="w-4 h-4" />Packed — awaiting QC
                                    </div>
                                  )}
                                </div>
                              )}
                              {isLocked && (
                                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                  <CheckCircle2 className="w-4 h-4" />QC Approved — locked
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* ── Send to QC ── */}
                        {!order.sentToQC && (
                          <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            allPacked
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                              : "bg-muted/30 border-border"
                          )}>
                            <div className="text-sm">
                              {allPacked ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  All {order.units.length} units packed — ready for QC
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {order.units.length - packed} unit{order.units.length - packed !== 1 ? "s" : ""} remaining
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              disabled={!allPacked}
                              onClick={() => sendToQC(order.id)}
                            >
                              Send to QC <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        )}

                        {order.sentToQC && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Sent to QC inspection
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tiny status pill ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const MAP: Record<string, { label: string; cls: string }> = {
    PENDING:     { label: "Pending",     cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    IN_PROGRESS: { label: "In Progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
    PACKED:      { label: "Packed",      cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400" },
    APPROVED:    { label: "QC Approved", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
    REJECTED:    { label: "Rejected",    cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
    PACKING:     { label: "Packing",     cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400" },
    QC_PENDING:  { label: "QC Pending",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
    QC_PASSED:   { label: "QC Passed",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  };
  const cfg = MAP[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.cls)}>
      {cfg.label}
    </span>
  );
}
