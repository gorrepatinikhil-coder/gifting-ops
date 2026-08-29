"use client";

import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  ChefHat, AlertTriangle, Zap, Play, Pause, Check, Plus,
  X, CheckCircle2, Clock, FlaskConical, RotateCcw,
  ChevronDown, ChevronUp, Edit2, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { formatDate, daysUntil, cn } from "@/lib/utils";

type ProductionStatus = "SCHEDULED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "DELAYED";

interface Ingredient {
  id: string;
  quantityNeeded: number;
  unit: string;
  inventoryItem: { name: string; unit: string; currentStock: number };
}

interface ProductionBatch {
  id: string;
  batchNumber: string;
  productName: string;
  quantity: number;
  status: ProductionStatus;
  scheduledDate: Date;
  deadline: Date;
  priority: number;
  notes: string | null;
  shortages: string | null;
  order: { id: string; orderNumber: string; clientName: string; isRushOrder: boolean };
  assignedTo: { name: string } | null;
  ingredients: Ingredient[];
}

interface BatchState {
  status: ProductionStatus;
  completedQty: number;
  shortages: string[];
  notes: string;
  expanded: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProductionStatus, { label: string; color: string; bg: string }> = {
  SCHEDULED:   { label: "Scheduled",   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  PAUSED:      { label: "Paused",      color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200" },
  COMPLETED:   { label: "Completed",   color: "text-emerald-700",bg: "bg-emerald-100 border-emerald-200" },
  DELAYED:     { label: "Delayed",     color: "text-red-700",    bg: "bg-red-100 border-red-200" },
};

const TRANSITIONS: Record<ProductionStatus, { next: ProductionStatus; label: string; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]> = {
  SCHEDULED:   [{ next: "IN_PROGRESS", label: "Start Batch", icon: Play, variant: "default" }],
  IN_PROGRESS: [
    { next: "PAUSED",     label: "Pause",        icon: Pause,        variant: "outline" },
    { next: "DELAYED",    label: "Mark Delayed", icon: AlertTriangle, variant: "outline" },
    { next: "COMPLETED",  label: "Mark Done",    icon: Check,        variant: "default" },
  ],
  PAUSED:   [{ next: "IN_PROGRESS", label: "Resume", icon: Play, variant: "default" }],
  DELAYED:  [{ next: "IN_PROGRESS", label: "Resume", icon: RotateCcw, variant: "default" }],
  COMPLETED: [],
};

export function ProductionClient({
  batches,
  productionUsers,
  currentUser,
}: {
  batches: ProductionBatch[];
  productionUsers: { id: string; name: string }[];
  currentUser: { role: string };
}) {
  const [filter, setFilter] = useState<string>("active");
  const [search, setSearch] = useState("");

  // Local state map: batchId → BatchState
  const [batchStates, setBatchStates] = useState<Record<string, BatchState>>(() => {
    const map: Record<string, BatchState> = {};
    for (const b of batches) {
      // Parse initial shortages
      const initShortages = b.shortages ? [b.shortages] : [];
      map[b.id] = {
        status: b.status,
        completedQty: b.status === "COMPLETED" ? b.quantity : b.status === "IN_PROGRESS" ? Math.round(b.quantity * 0.35) : 0,
        shortages: initShortages,
        notes: b.notes ?? "",
        expanded: false,
      };
    }
    return map;
  });

  // Shortage add form per batch
  const [shortageInputs, setShortageInputs] = useState<Record<string, string>>({});
  // Qty edit mode per batch
  const [qtyEditing, setQtyEditing] = useState<Record<string, string>>({});

  const getBatch = (id: string) => batchStates[id];
  const update = (id: string, patch: Partial<BatchState>) =>
    setBatchStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleStatus = (batch: ProductionBatch, next: ProductionStatus) => {
    const patch: Partial<BatchState> = { status: next };
    if (next === "COMPLETED") patch.completedQty = batch.quantity;
    if (next === "IN_PROGRESS" && getBatch(batch.id).completedQty === 0)
      patch.completedQty = 0;
    update(batch.id, patch);
    const labels: Record<ProductionStatus, string> = {
      IN_PROGRESS: "Batch started!",
      PAUSED: "Batch paused.",
      COMPLETED: "Batch marked as done!",
      DELAYED: "Marked as delayed.",
      SCHEDULED: "Reset to scheduled.",
    };
    toast.success(labels[next] ?? "Status updated.");
  };

  const handleQtyUpdate = (batch: ProductionBatch) => {
    const raw = qtyEditing[batch.id];
    const n = parseInt(raw ?? "", 10);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid quantity."); return; }
    if (n > batch.quantity) { toast.error(`Cannot exceed target of ${batch.quantity}.`); return; }
    update(batch.id, { completedQty: n });
    setQtyEditing((p) => { const c = { ...p }; delete c[batch.id]; return c; });
    toast.success(`Progress updated — ${n}/${batch.quantity} complete.`);
  };

  const addShortage = (id: string) => {
    const text = (shortageInputs[id] ?? "").trim();
    if (!text) return;
    update(id, { shortages: [...getBatch(id).shortages, text] });
    setShortageInputs((p) => ({ ...p, [id]: "" }));
    toast.warning("Shortage logged.");
  };

  const resolveShortage = (id: string, i: number) => {
    const s = [...getBatch(id).shortages];
    s.splice(i, 1);
    update(id, { shortages: s });
    toast.success("Shortage resolved.");
  };

  // Derived counts
  const inProgress  = batches.filter((b) => batchStates[b.id]?.status === "IN_PROGRESS").length;
  const delayed     = batches.filter((b) => batchStates[b.id]?.status === "DELAYED").length;
  const completed   = batches.filter((b) => batchStates[b.id]?.status === "COMPLETED").length;
  // Floor progress: sum of all batch target quantities vs completed quantities
  const totalAll   = batches.reduce((s, b) => s + b.quantity, 0);
  const totalDone  = batches.reduce((s, b) => s + (batchStates[b.id]?.completedQty ?? 0), 0);
  // Aliases for display
  const totalUnits = totalAll;
  const doneUnits  = totalDone;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      const st = batchStates[b.id]?.status ?? b.status;
      // Status filter
      const passesStatus =
        filter === "active"  ? !["COMPLETED"].includes(st) :
        filter === "today"   ? new Date(b.scheduledDate).toDateString() === new Date().toDateString() :
        filter === "all"     ? true :
        st === filter;
      if (!passesStatus) return false;
      // Search
      if (q) {
        return (
          b.productName.toLowerCase().includes(q) ||
          b.batchNumber.toLowerCase().includes(q) ||
          b.order.orderNumber.toLowerCase().includes(q) ||
          b.order.clientName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [batches, batchStates, filter, search]);

  // ── Intelligence derived values ──────────────────────────────────────────
  const rushBatches      = batches.filter((b) => b.order.isRushOrder && batchStates[b.id]?.status !== "COMPLETED");
  const shortagesBatches = batches.filter((b) => (batchStates[b.id]?.shortages ?? []).length > 0);
  const overdueDeadline  = batches.filter((b) => {
    const st = batchStates[b.id]?.status;
    if (st === "COMPLETED") return false;
    return b.deadline && new Date(b.deadline) < new Date();
  });
  const throughputPct = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;
  const criticalCount = delayed + overdueDeadline.length + rushBatches.length + shortagesBatches.length;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kitchen & Assembly Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {doneUnits.toLocaleString("en-IN")} / {totalUnits.toLocaleString("en-IN")} units · {throughputPct}% throughput
          </p>
        </div>
      </div>

      {/* ── Operational Intelligence Strip ── */}
      <div className={cn(
        "grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border",
        criticalCount > 0
          ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/15"
          : "border-border/60 bg-muted/20"
      )}>
        <button
          onClick={() => setFilter("IN_PROGRESS")}
          className="flex flex-col items-start p-3 rounded-lg bg-white/70 dark:bg-white/5 border border-border/40 hover:border-purple-300 hover:bg-purple-50/40 dark:hover:border-purple-700 transition-colors text-left"
        >
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">In Progress</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">{inProgress}</span>
          <span className="text-[10px] text-muted-foreground">batches active now</span>
        </button>
        <button
          onClick={() => setFilter("DELAYED")}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
            delayed > 0
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 hover:bg-red-100/60"
              : "bg-white/70 dark:bg-white/5 border-border/40 hover:border-foreground/20"
          )}
        >
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", delayed > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground")}>Delayed</span>
          <span className={cn("text-2xl font-black tabular-nums", delayed > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>{delayed}</span>
          <span className="text-[10px] text-muted-foreground">need attention</span>
        </button>
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
            shortagesBatches.length > 0
              ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50 hover:bg-orange-100/60"
              : "bg-white/70 dark:bg-white/5 border-border/40 hover:border-foreground/20"
          )}
        >
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", shortagesBatches.length > 0 ? "text-orange-700 dark:text-orange-400" : "text-muted-foreground")}>Shortages</span>
          <span className={cn("text-2xl font-black tabular-nums", shortagesBatches.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-foreground")}>{shortagesBatches.length}</span>
          <span className="text-[10px] text-muted-foreground">batches flagged</span>
        </button>
        <button
          onClick={() => setFilter("active")}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-colors text-left",
            rushBatches.length > 0
              ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100/60"
              : "bg-white/70 dark:bg-white/5 border-border/40 hover:border-foreground/20"
          )}
        >
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", rushBatches.length > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>Rush Batches</span>
          <span className={cn("text-2xl font-black tabular-nums", rushBatches.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{rushBatches.length}</span>
          <span className="text-[10px] text-muted-foreground">priority orders</span>
        </button>
      </div>

      {/* ── Overall progress ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall floor progress</span>
          <span>{doneUnits.toLocaleString("en-IN")} / {totalUnits.toLocaleString("en-IN")} ({totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0}%)</span>
        </div>
        <Progress value={totalUnits > 0 ? (doneUnits / totalUnits) * 100 : 0} className="h-2" />
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, product, client…"
            className="pl-8 h-8 text-sm w-64"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "active",      label: "Active" },
            { key: "today",       label: "Today" },
            { key: "IN_PROGRESS", label: "In Progress" },
            { key: "DELAYED",     label: "Delayed" },
            { key: "COMPLETED",   label: "Completed" },
            { key: "all",         label: "All" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                filter === key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {(search || filter !== "active") && (
          <p className="text-xs text-muted-foreground ml-auto tabular-nums whitespace-nowrap">
            {filtered.length} batch{filtered.length !== 1 ? "es" : ""}
          </p>
        )}
      </div>

      {/* ── Batch list ── */}
      {filtered.length === 0 ? (
        <EmptyState icon={ChefHat} title="No batches" description="Production batches will appear here once orders are confirmed." />
      ) : (
        <div className="space-y-3">
          {filtered.map((batch) => {
            const bs     = batchStates[batch.id];
            const days   = daysUntil(batch.deadline);
            const isUrgent = days <= 1 && bs.status !== "COMPLETED";
            const pct    = batch.quantity > 0 ? Math.round((bs.completedQty / batch.quantity) * 100) : 0;
            const cfg    = STATUS_CONFIG[bs.status];
            const transitions = TRANSITIONS[bs.status] ?? [];
            const isEditing = batch.id in qtyEditing;

            return (
              <Card key={batch.id} className={cn(
                "transition-shadow hover:shadow-md",
                batch.order.isRushOrder && "border-red-300 dark:border-red-800",
                isUrgent && !batch.order.isRushOrder && "border-orange-300 dark:border-orange-800",
              )}>
                <CardContent className="p-4 space-y-4">

                  {/* ── Top row ── */}
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[11px] text-muted-foreground">{batch.batchNumber}</span>
                        <Link
                          href={`/orders/${batch.order.id}/production-sheet`}
                          className="text-[11px] font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Sheet
                        </Link>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                        {batch.priority > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            Priority {batch.priority}
                          </span>
                        )}
                        {batch.order.isRushOrder && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                            <Zap className="w-2.5 h-2.5 mr-0.5" />RUSH
                          </Badge>
                        )}
                        {bs.shortages.length > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />{bs.shortages.length} Shortage{bs.shortages.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-base">{batch.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.order.orderNumber} · {batch.order.clientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {transitions.map(({ next, label, icon: Icon, variant }) => (
                        <Button key={next} size="sm" variant={variant}
                          onClick={() => handleStatus(batch, next)}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </Button>
                      ))}
                      <Button size="sm" variant="ghost"
                        onClick={() => update(batch.id, { expanded: !bs.expanded })}>
                        {bs.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* ── Stats row ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <Stat label="Target" value={batch.quantity.toLocaleString("en-IN")} />
                    <Stat label="Completed" value={
                      <span className={cn("font-bold text-base", pct === 100 ? "text-emerald-600" : pct > 50 ? "text-blue-600" : "text-foreground")}>
                        {bs.completedQty.toLocaleString("en-IN")}
                      </span>
                    } />
                    <Stat label="Deadline" value={
                      <span className={cn(isUrgent ? "text-red-600 font-semibold" : "")}>
                        {formatDate(batch.deadline)}
                        {bs.status !== "COMPLETED" && (
                          <span className="text-xs font-normal ml-1 text-muted-foreground">
                            ({days < 0 ? `${Math.abs(days)}d late` : `${days}d`})
                          </span>
                        )}
                      </span>
                    } />
                    <Stat label="Assigned To" value={
                      batch.assignedTo ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold flex-shrink-0">
                            {batch.assignedTo.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate">{batch.assignedTo.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium border border-dashed border-border">
                          Unassigned
                        </span>
                      )
                    } />
                  </div>

                  {/* ── Progress bar ── */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Completion</span>
                      <span>{bs.completedQty.toLocaleString("en-IN")} / {batch.quantity.toLocaleString("en-IN")} ({pct}%)</span>
                    </div>
                    <Progress
                      value={pct}
                      className={cn("h-3 rounded-full", pct === 100 ? "[&>div]:bg-emerald-500" : "")}
                    />
                  </div>

                  {/* ── Update qty row ── */}
                  {bs.status === "IN_PROGRESS" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Update completed:</span>
                      {isEditing ? (
                        <>
                          <Input
                            type="number"
                            min={0}
                            max={batch.quantity}
                            value={qtyEditing[batch.id]}
                            onChange={(e) => setQtyEditing((p) => ({ ...p, [batch.id]: e.target.value }))}
                            className="h-7 w-24 text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleQtyUpdate(batch)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => setQtyEditing((p) => { const c = { ...p }; delete c[batch.id]; return c; })}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => setQtyEditing((p) => ({ ...p, [batch.id]: String(bs.completedQty) }))}>
                          <Edit2 className="w-3 h-3" />
                          Edit qty ({bs.completedQty})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* ── Shortages ── */}
                  {bs.shortages.length > 0 && (
                    <div className="space-y-1.5">
                      {bs.shortages.map((shortage, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-orange-700 dark:text-orange-400 flex-1">{shortage}</p>
                          <button onClick={() => resolveShortage(batch.id, i)}
                            className="text-[10px] text-orange-600 hover:text-orange-800 font-medium underline flex-shrink-0">
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Add shortage ── */}
                  {bs.status !== "COMPLETED" && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Log a shortage (e.g. Kaju katli stock low)…"
                        value={shortageInputs[batch.id] ?? ""}
                        onChange={(e) => setShortageInputs((p) => ({ ...p, [batch.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addShortage(batch.id)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" variant="outline" className="h-8 shrink-0"
                        onClick={() => addShortage(batch.id)}>
                        <Plus className="w-3.5 h-3.5" />Shortage
                      </Button>
                    </div>
                  )}

                  {/* ── Expandable: ingredients + notes ── */}
                  {bs.expanded && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Ingredients */}
                      {batch.ingredients.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <FlaskConical className="w-3 h-3 inline mr-1" />Raw Materials
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {batch.ingredients.map((ing) => {
                              const stock   = ing.inventoryItem.currentStock;
                              const needed  = ing.quantityNeeded;
                              const isLow   = stock < needed;
                              const pctIng  = Math.min(100, Math.round((stock / needed) * 100));
                              return (
                                <div key={ing.id} className={cn(
                                  "p-3 rounded-lg border text-xs",
                                  isLow ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40"
                                        : "bg-muted/30 border-border"
                                )}>
                                  <div className="flex items-start justify-between gap-1 mb-1.5">
                                    <p className="font-medium leading-snug">{ing.inventoryItem.name}</p>
                                    {isLow && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                  </div>
                                  <p className={cn("text-[11px] mb-1.5", isLow ? "text-red-600 font-semibold" : "text-muted-foreground")}>
                                    {stock} / {needed} {ing.unit}
                                    {isLow && " — INSUFFICIENT"}
                                  </p>
                                  <Progress
                                    value={pctIng}
                                    className={cn("h-1.5", isLow ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500")}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Internal Notes</p>
                        <Textarea
                          value={bs.notes}
                          onChange={(e) => update(batch.id, { notes: e.target.value })}
                          placeholder="Add notes for this batch…"
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}
