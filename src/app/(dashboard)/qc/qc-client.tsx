"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, ArrowRight, ChevronDown, ChevronUp, History, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatDateTime, daysUntil, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type QCResult = "PASS" | "FAIL_PACKING" | "FAIL_PRODUCT";

interface QCCheck {
  key: string;
  label: string;
  category: "PRODUCT" | "PACKING" | "BRANDING" | "DISPATCH";
}

interface Inspection {
  id: string;
  result: QCResult;
  checks: Record<string, boolean>;
  failureReason: string;
  actionTaken: string;
  routeTo: "PACKING" | "PRODUCTION" | null;
  inspectedBy: string;
  timestamp: Date;
}

type UnitQCStatus = "PENDING" | "PASSED" | "FAIL_PACKING" | "FAIL_PRODUCT";

interface QCUnit {
  id: string;
  unitNumber: number;
  qcStatus: UnitQCStatus;
  inspections: Inspection[];
}

interface QCOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  deliveryDate: Date;
  units: QCUnit[];
  expanded: boolean;
  approved: boolean;   // all units passed → order marked as QC_PASSED
}

interface LogEntry {
  id: string;
  result: QCResult;
  orderNumber: string;
  clientName: string;
  unitNumber: number;
  failureReason: string;
  routeTo: "PACKING" | "PRODUCTION" | null;
  inspectedBy: string;
  timestamp: Date;
}

// ─── QC inspection checklist ─────────────────────────────────────────────────

const QC_CHECKS: QCCheck[] = [
  { key: "freshness",   label: "Contents fresh & within expiry date",          category: "PRODUCT"  },
  { key: "quantity",    label: "Item count matches the order specification",    category: "PRODUCT"  },
  { key: "appearance",  label: "Hamper appearance & presentation is up to standard", category: "PACKING" },
  { key: "boxIntact",   label: "Box sealed properly, no damage or dents",       category: "PACKING"  },
  { key: "ribbon",      label: "Ribbon / bow is neatly tied and intact",        category: "PACKING"  },
  { key: "branding",    label: "Logo / branding is correct, aligned & legible", category: "BRANDING" },
  { key: "nameCard",    label: "Message card / name card present & correct",    category: "BRANDING" },
  { key: "label",       label: "Dispatch label with correct address attached",  category: "DISPATCH" },
];

const CATEGORY_COLOR: Record<QCCheck["category"], string> = {
  PRODUCT:  "text-green-600 dark:text-green-400",
  PACKING:  "text-blue-600 dark:text-blue-400",
  BRANDING: "text-purple-600 dark:text-purple-400",
  DISPATCH: "text-orange-600 dark:text-orange-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initChecks(): Record<string, boolean> {
  return Object.fromEntries(QC_CHECKS.map((c) => [c.key, true]));
}

function autoResult(checks: Record<string, boolean>): QCResult {
  const failed = QC_CHECKS.filter((c) => !checks[c.key]);
  if (failed.length === 0) return "PASS";
  const productFail = failed.some((c) => c.category === "PRODUCT");
  return productFail ? "FAIL_PRODUCT" : "FAIL_PACKING";
}

// Inspector name is derived from currentUser prop at runtime

// ─── Component ────────────────────────────────────────────────────────────────

export function QCClient({
  orders: rawOrders,
  recentLogs: initialLogs,
  currentUser,
}: {
  orders: Array<{
    id: string;
    orderNumber: string;
    clientName: string;
    deliveryDate: Date;
    packingUnits: Array<{ id: string; unitNumber: number; status: string }>;
    qcLogs: Array<{ result: string; inspectedBy: { name: string }; createdAt: Date }>;
  }>;
  recentLogs: Array<{
    id: string;
    result: string;
    failureReason: string | null;
    createdAt: Date;
    order: { orderNumber: string; clientName: string };
    packingUnit: { unitNumber: number } | null;
    inspectedBy: { name: string };
  }>;
  currentUser: { id: string; name: string; role: string };
}) {
  // Build initial state from raw orders
  const [orders, setOrders] = useState<QCOrder[]>(() =>
    rawOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      clientName: o.clientName,
      deliveryDate: o.deliveryDate,
      expanded: true,
      approved: false,
      units: o.packingUnits.map((u) => {
        // Pre-seed some units as passed from existing qcLogs
        const logForUnit = o.qcLogs?.[u.unitNumber - 1];
        const preInspected = !!logForUnit;
        return {
          id: u.id,
          unitNumber: u.unitNumber,
          qcStatus: preInspected
            ? (logForUnit.result === "PASS" ? "PASSED" : logForUnit.result === "FAIL_PACKING" ? "FAIL_PACKING" : "FAIL_PRODUCT")
            : "PENDING",
          inspections: preInspected
            ? [{
                id: `pre-${u.id}`,
                result: logForUnit.result as QCResult,
                checks: initChecks(),
                failureReason: "",
                actionTaken: "",
                routeTo: null,
                inspectedBy: logForUnit.inspectedBy.name,
                timestamp: logForUnit.createdAt,
              }]
            : [],
        } as QCUnit;
      }),
    }))
  );

  // Activity log
  const [log, setLog] = useState<LogEntry[]>(() =>
    initialLogs.map((l) => ({
      id: l.id,
      result: l.result as QCResult,
      orderNumber: l.order.orderNumber,
      clientName: l.order.clientName,
      unitNumber: l.packingUnit?.unitNumber ?? 0,
      failureReason: l.failureReason ?? "",
      routeTo: null,
      inspectedBy: l.inspectedBy.name,
      timestamp: l.createdAt,
    }))
  );

  // Active inspection modal
  const [modal, setModal] = useState<{
    orderId: string;
    unitId: string;
    unitNumber: number;
    prevInspections: Inspection[];
  } | null>(null);

  // Form state
  const [form, setForm] = useState<{
    checks: Record<string, boolean>;
    result: QCResult;
    failureReason: string;
    actionTaken: string;
    routeTo: "PACKING" | "PRODUCTION";
  }>({
    checks: initChecks(),
    result: "PASS",
    failureReason: "",
    actionTaken: "",
    routeTo: "PACKING",
  });

  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});
  const [qcSearch, setQcSearch] = useState("");

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const openModal = (orderId: string, unit: QCUnit) => {
    setModal({ orderId, unitId: unit.id, unitNumber: unit.unitNumber, prevInspections: unit.inspections });
    const checks = initChecks();
    setForm({ checks, result: "PASS", failureReason: "", actionTaken: "", routeTo: "PACKING" });
  };

  const handleCheckChange = (key: string, val: boolean) => {
    const checks = { ...form.checks, [key]: val };
    setForm((f) => ({ ...f, checks, result: autoResult(checks) }));
  };

  const submitInspection = () => {
    if (!modal) return;
    const { orderId, unitId, unitNumber } = modal;
    const { result, checks, failureReason, actionTaken, routeTo } = form;

    if (result !== "PASS" && !failureReason.trim()) {
      toast.error("Please describe the failure reason.");
      return;
    }

    const inspection: Inspection = {
      id: `ins-${Date.now()}`,
      result,
      checks,
      failureReason,
      actionTaken,
      routeTo: result !== "PASS" ? routeTo : null,
      inspectedBy: currentUser.name,
      timestamp: new Date(),
    };

    // Update order unit state
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const units = o.units.map((u) => {
        if (u.id !== unitId) return u;
        return {
          ...u,
          qcStatus: result === "PASS" ? "PASSED" : result === "FAIL_PACKING" ? "FAIL_PACKING" : "FAIL_PRODUCT",
          inspections: [...u.inspections, inspection],
        } as QCUnit;
      });
      // Check if all units now passed
      const allPassed = units.every((u) => u.qcStatus === "PASSED");
      return { ...o, units, approved: allPassed };
    }));

    // Add to activity log
    setLog((prev) => [{
      id: inspection.id,
      result,
      orderNumber: orders.find((o) => o.id === orderId)?.orderNumber ?? "",
      clientName: orders.find((o) => o.id === orderId)?.clientName ?? "",
      unitNumber,
      failureReason,
      routeTo: result !== "PASS" ? routeTo : null,
      inspectedBy: currentUser.name,
      timestamp: new Date(),
    }, ...prev]);

    setModal(null);

    if (result === "PASS") {
      toast.success(`Unit #${unitNumber} passed QC!`);
    } else if (result === "FAIL_PACKING") {
      toast.warning(`Unit #${unitNumber} failed — routed back to Packing.`);
    } else {
      toast.error(`Unit #${unitNumber} failed — routed back to Production.`);
    }
  };

  const approveOrder = (orderId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, approved: true } : o));
    toast.success("Order approved — ready for dispatch!");
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const allUnits    = orders.flatMap((o) => o.units);
  const totalUnits  = allUnits.length;
  const passedUnits = allUnits.filter((u) => u.qcStatus === "PASSED").length;
  const failedUnits = allUnits.filter((u) => ["FAIL_PACKING", "FAIL_PRODUCT"].includes(u.qcStatus)).length;
  const pendingUnits = allUnits.filter((u) => u.qcStatus === "PENDING").length;
  const passRate    = totalUnits > passedUnits + failedUnits + pendingUnits
    ? 0
    : (passedUnits + failedUnits) > 0
      ? Math.round((passedUnits / (passedUnits + failedUnits)) * 100)
      : 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <h1 className="text-2xl font-bold">QC Inspection</h1>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending",   value: pendingUnits, color: "text-amber-600"   },
          { label: "Passed",    value: passedUnits,  color: "text-emerald-600" },
          { label: "Failed",    value: failedUnits,  color: "text-red-600"     },
          { label: "Pass Rate", value: `${passRate}%`, color: passRate >= 90 ? "text-emerald-600" : passRate >= 70 ? "text-amber-600" : "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      {orders.length > 0 && (
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={qcSearch}
            onChange={(e) => setQcSearch(e.target.value)}
            placeholder="Search order # or client…"
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      {/* ── Orders ── */}
      {orders.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No orders pending QC"
          description="Batches will appear here once packing is complete." />
      ) : (() => {
        const q = qcSearch.trim().toLowerCase();
        const visibleOrders = q
          ? orders.filter((o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.clientName.toLowerCase().includes(q)
            )
          : orders;
        return visibleOrders.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No orders match your search.
          </div>
        ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const passed  = order.units.filter((u) => u.qcStatus === "PASSED").length;
            const failed  = order.units.filter((u) => ["FAIL_PACKING","FAIL_PRODUCT"].includes(u.qcStatus)).length;
            const pending = order.units.filter((u) => u.qcStatus === "PENDING").length;
            const pct     = order.units.length > 0 ? Math.round((passed / order.units.length) * 100) : 0;
            const days    = daysUntil(order.deliveryDate);

            return (
              <Card key={order.id} className={cn(
                order.approved && "border-emerald-300 dark:border-emerald-800",
                days <= 1 && !order.approved && "border-orange-300 dark:border-orange-800",
              )}>
                {/* ── Order header ── */}
                <CardHeader className="flex-row items-center gap-3 py-3 px-4">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, expanded: !o.expanded } : o))}
                  >
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-[11px] text-muted-foreground">{order.orderNumber}</span>
                      {order.approved
                        ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">QC Passed</span>
                        : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">QC Pending</span>}
                      {failed > 0 && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                          <XCircle className="w-2.5 h-2.5 mr-0.5" />{failed} Failed
                        </Badge>
                      )}
                      {days <= 1 && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                    </div>
                    <p className="font-semibold">{order.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      Delivery: {formatDate(order.deliveryDate)}
                      {" · "}{passed}/{order.units.length} passed · {pending} pending
                    </p>
                  </div>
                  {/* Inspect Next shortcut — skips expand step */}
                  {!order.approved && pending > 0 && (() => {
                    const nextUnit = order.units.find((u) => u.qcStatus === "PENDING" || (u.qcStatus !== "PASSED" && u.inspections.length > 0));
                    return nextUnit ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); openModal(order.id, nextUnit); }}
                      >
                        <ClipboardCheck className="w-3 h-3" />
                        Inspect #{nextUnit.unitNumber}
                      </Button>
                    ) : null;
                  })()}
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                    onClick={() => setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, expanded: !o.expanded } : o))}
                  >
                    {order.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </CardHeader>

                {order.expanded && (
                  <CardContent className="border-t pt-4 px-4 pb-4 space-y-4">
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>QC progress</span>
                        <span>{passed} passed · {failed} failed · {pending} pending</span>
                      </div>
                      <Progress value={pct} className={cn("h-2", pct === 100 ? "[&>div]:bg-emerald-500" : "")} />
                    </div>

                    {/* Unit grid */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Click a unit to inspect — hover for details
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.units.map((unit) => {
                          const isReinspect = unit.inspections.length > 0 && unit.qcStatus !== "PASSED";
                          return (
                            <button
                              key={unit.id}
                              onClick={() => !order.approved && openModal(order.id, unit)}
                              disabled={order.approved}
                              title={
                                unit.qcStatus === "PASSED"
                                  ? `#${unit.unitNumber} — Passed`
                                  : unit.qcStatus !== "PENDING"
                                  ? `#${unit.unitNumber} — ${unit.qcStatus.replace(/_/g, " ")}${unit.inspections.at(-1)?.failureReason ? `: ${unit.inspections.at(-1)!.failureReason}` : ""}`
                                  : `#${unit.unitNumber} — Click to inspect`
                              }
                              className={cn(
                                "w-12 h-12 rounded-xl border-2 text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5",
                                unit.qcStatus === "PASSED"
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700 cursor-default"
                                  : unit.qcStatus === "FAIL_PACKING"
                                  ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-700 hover:scale-105"
                                  : unit.qcStatus === "FAIL_PRODUCT"
                                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-700 hover:scale-105"
                                  : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 hover:bg-primary/10 hover:border-primary hover:scale-105",
                                order.approved && "opacity-70 cursor-default",
                              )}
                            >
                              <span>#{unit.unitNumber}</span>
                              {unit.qcStatus === "PASSED"      && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                              {unit.qcStatus === "FAIL_PACKING"  && <XCircle className="w-3 h-3 text-orange-500" />}
                              {unit.qcStatus === "FAIL_PRODUCT"  && <XCircle className="w-3 h-3 text-red-500" />}
                              {unit.qcStatus === "PENDING"      && <span className="text-[8px] text-muted-foreground">tap</span>}
                              {isReinspect && (
                                <span className="absolute -top-1 -right-1 bg-orange-400 text-white rounded-full w-3.5 h-3.5 text-[8px] flex items-center justify-center">
                                  {unit.inspections.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
                        {[
                          { label: "Pending",        cls: "bg-gray-200 dark:bg-gray-700" },
                          { label: "Passed",         cls: "bg-emerald-200 dark:bg-emerald-800" },
                          { label: "Fail — Packing", cls: "bg-orange-200 dark:bg-orange-800" },
                          { label: "Fail — Product", cls: "bg-red-200 dark:bg-red-800" },
                        ].map(({ label, cls }) => (
                          <span key={label} className="flex items-center gap-1">
                            <span className={cn("w-2.5 h-2.5 rounded-sm inline-block", cls)} />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Failed units detail */}
                    {order.units.some((u) => ["FAIL_PACKING","FAIL_PRODUCT"].includes(u.qcStatus)) && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rejection Details</p>
                        {order.units
                          .filter((u) => ["FAIL_PACKING","FAIL_PRODUCT"].includes(u.qcStatus))
                          .map((unit) => {
                            const last = unit.inspections.at(-1);
                            return (
                              <div key={unit.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border text-xs",
                                unit.qcStatus === "FAIL_PACKING"
                                  ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/40"
                                  : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40",
                              )}>
                                <XCircle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0",
                                  unit.qcStatus === "FAIL_PACKING" ? "text-orange-500" : "text-red-500")} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold">Unit #{unit.unitNumber}</span>
                                    <span className={cn("font-semibold",
                                      unit.qcStatus === "FAIL_PACKING" ? "text-orange-700" : "text-red-700")}>
                                      {unit.qcStatus === "FAIL_PACKING" ? "Packing Fail" : "Product Fail"}
                                    </span>
                                    {last?.routeTo && (
                                      <span className="text-muted-foreground">→ Sent to {last.routeTo}</span>
                                    )}
                                  </div>
                                  {last?.failureReason && <p className="text-muted-foreground">{last.failureReason}</p>}
                                  {last?.actionTaken && <p className="text-muted-foreground italic mt-0.5">Action: {last.actionTaken}</p>}
                                </div>
                                <button
                                  onClick={() => openModal(order.id, unit)}
                                  className="text-primary text-[10px] font-medium hover:underline shrink-0"
                                >
                                  Re-inspect
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Approve order */}
                    {!order.approved && passed === order.units.length && order.units.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          All {order.units.length} units passed — approve for dispatch?
                        </span>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => approveOrder(order.id)}>
                          Approve & Send to Dispatch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    )}
                    {order.approved && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        QC Approved — order ready for dispatch
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
        );
      })()}

      {/* ── Activity Log ── */}
      {log.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 flex-row items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              QC Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {log.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
                  {entry.result === "PASS" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : entry.result === "FAIL_PACKING" ? (
                    <XCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-snug">
                      {entry.clientName}
                      <span className="text-muted-foreground font-normal"> · {entry.orderNumber}</span>
                      {entry.unitNumber > 0 && <span className="text-muted-foreground font-normal"> · Unit #{entry.unitNumber}</span>}
                    </p>
                    {entry.failureReason && (
                      <p className={cn("text-xs mt-0.5",
                        entry.result === "FAIL_PACKING" ? "text-orange-600" : "text-red-600"
                      )}>
                        {entry.failureReason}
                        {entry.routeTo && <span className="text-muted-foreground"> → Sent to {entry.routeTo}</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    <p className={cn("font-semibold",
                      entry.result === "PASS" ? "text-emerald-600" :
                      entry.result === "FAIL_PACKING" ? "text-orange-600" : "text-red-600"
                    )}>
                      {entry.result === "PASS" ? "PASS" : entry.result === "FAIL_PACKING" ? "FAIL — PACKING" : "FAIL — PRODUCT"}
                    </p>
                    <p>{entry.inspectedBy}</p>
                    <p>{formatDateTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Inspection Modal ── */}
      {modal && (() => {
        const failedChecks = QC_CHECKS.filter((c) => !form.checks[c.key]);
        const passedChecks = QC_CHECKS.filter((c) => form.checks[c.key]);
        const checksPct    = Math.round((passedChecks.length / QC_CHECKS.length) * 100);
        const categories   = Array.from(new Set(QC_CHECKS.map((c) => c.category)));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              {/* Modal header */}
              <div className="sticky top-0 bg-background border-b px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <div>
                  <h2 className="font-bold text-base">QC Inspection</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Unit #{modal.unitNumber}
                    {modal.prevInspections.length > 0 && (
                      <span className="ml-1.5 text-orange-600 font-semibold">
                        · {modal.prevInspections.length} previous inspection{modal.prevInspections.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <button onClick={() => setModal(null)}
                  className="text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted">
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Previous rejection context */}
                {modal.prevInspections.length > 0 && modal.prevInspections.at(-1)?.result !== "PASS" && (
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 text-xs">
                    <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                      <RotateCcw className="w-3 h-3 inline mr-1" />
                      Previous rejection reason:
                    </p>
                    <p className="text-orange-600 dark:text-orange-300">
                      {modal.prevInspections.at(-1)!.failureReason || "No reason recorded."}
                    </p>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Checks passed</span>
                    <span>{passedChecks.length} / {QC_CHECKS.length}</span>
                  </div>
                  <Progress value={checksPct}
                    className={cn("h-2", checksPct === 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500")} />
                </div>

                {/* Checklist by category */}
                {categories.map((cat) => {
                  const items = QC_CHECKS.filter((c) => c.category === cat);
                  return (
                    <div key={cat}>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", CATEGORY_COLOR[cat])}>
                        {cat}
                      </p>
                      <div className="space-y-2.5">
                        {items.map((check) => (
                          <div key={check.key} className="flex items-center gap-3">
                            <Checkbox
                              id={`modal-${check.key}`}
                              checked={form.checks[check.key]}
                              onCheckedChange={(v) => handleCheckChange(check.key, !!v)}
                              className={form.checks[check.key]
                                ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                : "border-red-400 dark:border-red-600"}
                            />
                            <label htmlFor={`modal-${check.key}`}
                              className={cn("text-sm cursor-pointer select-none flex-1",
                                form.checks[check.key] ? "text-muted-foreground line-through" : "font-medium"
                              )}>
                              {check.label}
                            </label>
                            {!form.checks[check.key] && (
                              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Auto result */}
                <div className={cn(
                  "p-3 rounded-xl border-2 text-center font-bold text-sm",
                  form.result === "PASS"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-emerald-400"
                    : form.result === "FAIL_PACKING"
                    ? "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/20 dark:border-orange-700 dark:text-orange-400"
                    : "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/20 dark:border-red-700 dark:text-red-400",
                )}>
                  {form.result === "PASS" && "✅ All checks passed — Result: PASS"}
                  {form.result === "FAIL_PACKING" && `📦 ${failedChecks.length} check${failedChecks.length !== 1 ? "s" : ""} failed — Result: FAIL (Packing)`}
                  {form.result === "FAIL_PRODUCT" && `🍫 Product issue detected — Result: FAIL (Product)`}
                </div>

                {/* Failure fields */}
                {form.result !== "PASS" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Failure Description *</Label>
                      <Textarea
                        value={form.failureReason}
                        onChange={(e) => setForm((f) => ({ ...f, failureReason: e.target.value }))}
                        placeholder="Describe what failed and the severity…"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Corrective Action Taken</Label>
                      <Textarea
                        value={form.actionTaken}
                        onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
                        placeholder="What immediate action was taken?"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Route back selection */}
                    <div className="space-y-2">
                      <Label className="text-xs">Route Back To</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["PACKING", "PRODUCTION"] as const).map((dest) => (
                          <button
                            key={dest}
                            onClick={() => setForm((f) => ({ ...f, routeTo: dest }))}
                            className={cn(
                              "p-3 rounded-xl border-2 text-sm font-semibold transition-all",
                              form.routeTo === dest
                                ? dest === "PACKING"
                                  ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                                  : "border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                : "border-border hover:border-muted-foreground text-muted-foreground"
                            )}
                          >
                            {dest === "PACKING" ? "📦 Packing" : "🍳 Production"}
                            <p className="text-[10px] font-normal mt-0.5">
                              {dest === "PACKING" ? "Box / labeling issue" : "Product / ingredient issue"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    className={cn("flex-1",
                      form.result === "PASS"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : form.result === "FAIL_PACKING"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    )}
                    onClick={submitInspection}
                    disabled={form.result !== "PASS" && !form.failureReason.trim()}
                  >
                    {form.result === "PASS"
                      ? "✓ Submit Pass"
                      : `Fail & Route to ${form.routeTo}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
