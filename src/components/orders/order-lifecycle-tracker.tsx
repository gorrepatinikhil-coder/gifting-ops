"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Users, FlaskConical, FileCheck, FileText, IndianRupee,
  ChefHat, Package, ClipboardCheck, ShieldCheck, Truck,
  PackageCheck, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Zap, ArrowRight, AlertTriangle, Info,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LifecycleStageKey =
  | "LEAD"
  | "SAMPLE_REQUESTED"
  | "SAMPLE_APPROVED"
  | "QUOTE_SENT"
  | "CONFIRMED"
  | "ADVANCE_RECEIVED"
  | "IN_PRODUCTION"
  | "PACKING"
  | "QC_PENDING"
  | "QC_PASSED"
  | "DISPATCHED"
  | "DELIVERED"
  | "PAYMENT_CLOSED";

export interface LifecycleHistoryEntry {
  stage: LifecycleStageKey;
  enteredAt: Date;
  by: string;
  note?: string;
}

interface StageConfig {
  key: LifecycleStageKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  group: "sales" | "finance" | "factory" | "dispatch";
  role: string;
  actions: Array<{
    label: string;
    href?: string;
    variant?: "default" | "outline";
    description: string;
  }>;
  requiredBefore?: string;
  colorClass: {
    dot: string;
    bg: string;
    border: string;
    text: string;
    iconBg: string;
    iconText: string;
    trackActive: string;
    trackDone: string;
  };
}

// ─── Stage configuration ─────────────────────────────────────────────────────

export const LIFECYCLE_STAGES: StageConfig[] = [
  {
    key: "LEAD",
    label: "Lead Captured",
    shortLabel: "Lead",
    description: "Client enquiry received and logged in CRM.",
    icon: Users,
    group: "sales",
    role: "Sales Team",
    actions: [
      { label: "View Lead", href: "/leads", variant: "outline", description: "Open the lead record" },
      { label: "Schedule Follow-up", href: "/leads", variant: "outline", description: "Set next follow-up date" },
    ],
    colorClass: {
      dot: "bg-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800/40",
      text: "text-blue-700 dark:text-blue-300",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      iconText: "text-blue-600 dark:text-blue-400",
      trackActive: "bg-blue-500",
      trackDone: "bg-blue-400",
    },
  },
  {
    key: "SAMPLE_REQUESTED",
    label: "Sample Requested",
    shortLabel: "Sample",
    description: "Client has requested a sample kit to evaluate quality and presentation.",
    icon: FlaskConical,
    group: "sales",
    role: "Sales + Kitchen",
    actions: [
      { label: "Create Sample Request", href: "/samples", variant: "default", description: "Raise a sample request for the kitchen" },
      { label: "View Samples", href: "/samples", variant: "outline", description: "Track existing sample requests" },
    ],
    colorClass: {
      dot: "bg-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      border: "border-violet-200 dark:border-violet-800/40",
      text: "text-violet-700 dark:text-violet-300",
      iconBg: "bg-violet-100 dark:bg-violet-900/60",
      iconText: "text-violet-600 dark:text-violet-400",
      trackActive: "bg-violet-500",
      trackDone: "bg-violet-400",
    },
  },
  {
    key: "SAMPLE_APPROVED",
    label: "Sample Approved",
    shortLabel: "Approved",
    description: "Client has tasted and approved the sample. Ready to proceed with quotation.",
    icon: FileCheck,
    group: "sales",
    role: "Sales Team",
    actions: [
      { label: "Record Approval", href: "/samples", variant: "default", description: "Mark sample as client-approved" },
      { label: "Create Quotation", href: "/quotations", variant: "outline", description: "Prepare a formal quote" },
    ],
    colorClass: {
      dot: "bg-teal-500",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      border: "border-teal-200 dark:border-teal-800/40",
      text: "text-teal-700 dark:text-teal-300",
      iconBg: "bg-teal-100 dark:bg-teal-900/60",
      iconText: "text-teal-600 dark:text-teal-400",
      trackActive: "bg-teal-500",
      trackDone: "bg-teal-400",
    },
  },
  {
    key: "QUOTE_SENT",
    label: "Quotation Sent",
    shortLabel: "Quote",
    description: "Formal quotation with itemised pricing sent to the client for review.",
    icon: FileText,
    group: "sales",
    role: "Sales Team",
    actions: [
      { label: "View Quotation", href: "/quotations", variant: "outline", description: "Open the quote sent to client" },
      { label: "Confirm Order", href: "/orders/new", variant: "default", description: "Convert quote to confirmed order" },
    ],
    colorClass: {
      dot: "bg-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      border: "border-cyan-200 dark:border-cyan-800/40",
      text: "text-cyan-700 dark:text-cyan-300",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/60",
      iconText: "text-cyan-600 dark:text-cyan-400",
      trackActive: "bg-cyan-500",
      trackDone: "bg-cyan-400",
    },
  },
  {
    key: "CONFIRMED",
    label: "Order Confirmed",
    shortLabel: "Confirmed",
    description: "Client has confirmed the order. Now collect 50% advance to proceed.",
    icon: ClipboardCheck,
    group: "finance",
    role: "Sales + Accounts",
    actions: [
      { label: "Request Advance Payment", href: "/payments", variant: "default", description: "Send payment link or share bank details" },
      { label: "View Order Details", href: "#", variant: "outline", description: "Review full order specifications" },
    ],
    colorClass: {
      dot: "bg-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      border: "border-indigo-200 dark:border-indigo-800/40",
      text: "text-indigo-700 dark:text-indigo-300",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/60",
      iconText: "text-indigo-600 dark:text-indigo-400",
      trackActive: "bg-indigo-500",
      trackDone: "bg-indigo-400",
    },
  },
  {
    key: "ADVANCE_RECEIVED",
    label: "Advance Received",
    shortLabel: "Advance",
    description: "50% advance payment confirmed. Production can now begin.",
    icon: IndianRupee,
    group: "finance",
    role: "Accounts",
    actions: [
      { label: "Record Payment", href: "/payments", variant: "default", description: "Log payment received and upload proof" },
      { label: "Start Production", href: "/production", variant: "outline", description: "Create production batch for kitchen" },
    ],
    colorClass: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/40",
      text: "text-emerald-700 dark:text-emerald-300",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      iconText: "text-emerald-600 dark:text-emerald-400",
      trackActive: "bg-emerald-500",
      trackDone: "bg-emerald-400",
    },
  },
  {
    key: "IN_PRODUCTION",
    label: "In Production",
    shortLabel: "Production",
    description: "Hampers being assembled in the kitchen. Monitor batch progress and ingredient availability.",
    icon: ChefHat,
    group: "factory",
    role: "Kitchen Team",
    actions: [
      { label: "View Kitchen Schedule", href: "/production", variant: "default", description: "Monitor batches and assign team" },
      { label: "Check Inventory", href: "/inventory", variant: "outline", description: "Verify ingredient stock levels" },
    ],
    colorClass: {
      dot: "bg-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800/40",
      text: "text-purple-700 dark:text-purple-300",
      iconBg: "bg-purple-100 dark:bg-purple-900/60",
      iconText: "text-purple-600 dark:text-purple-400",
      trackActive: "bg-purple-500",
      trackDone: "bg-purple-400",
    },
  },
  {
    key: "PACKING",
    label: "Packing",
    shortLabel: "Packing",
    description: "Hamper contents packed, branded, ribboned, and labelled per order specs.",
    icon: Package,
    group: "factory",
    role: "Packing Team",
    actions: [
      { label: "Manage Packing Queue", href: "/packing", variant: "default", description: "Open packing checklist for this order" },
      { label: "View Checklist", href: "/packing", variant: "outline", description: "Verify each packing unit" },
    ],
    colorClass: {
      dot: "bg-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800/40",
      text: "text-orange-700 dark:text-orange-300",
      iconBg: "bg-orange-100 dark:bg-orange-900/60",
      iconText: "text-orange-600 dark:text-orange-400",
      trackActive: "bg-orange-500",
      trackDone: "bg-orange-400",
    },
  },
  {
    key: "QC_PENDING",
    label: "QC Inspection",
    shortLabel: "QC",
    description: "Packed units undergoing quality control — contents, presentation, branding, and labels.",
    icon: ClipboardCheck,
    group: "factory",
    role: "QC Inspector",
    actions: [
      { label: "Open QC Queue", href: "/qc", variant: "default", description: "Start inspecting units for this order" },
      { label: "View QC Logs", href: "/qc", variant: "outline", description: "See previous inspection results" },
    ],
    colorClass: {
      dot: "bg-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800/40",
      text: "text-amber-700 dark:text-amber-300",
      iconBg: "bg-amber-100 dark:bg-amber-900/60",
      iconText: "text-amber-600 dark:text-amber-400",
      trackActive: "bg-amber-500",
      trackDone: "bg-amber-400",
    },
  },
  {
    key: "QC_PASSED",
    label: "QC Cleared",
    shortLabel: "Cleared",
    description: "All units passed QC. Raise delivery challan and book vehicle for dispatch.",
    icon: ShieldCheck,
    group: "dispatch",
    role: "Dispatch Team",
    actions: [
      { label: "Create Dispatch", href: "/dispatch", variant: "default", description: "Raise challan and assign driver" },
      { label: "View Addresses", href: "#", variant: "outline", description: "Verify all delivery addresses" },
    ],
    colorClass: {
      dot: "bg-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800/40",
      text: "text-green-700 dark:text-green-300",
      iconBg: "bg-green-100 dark:bg-green-900/60",
      iconText: "text-green-600 dark:text-green-400",
      trackActive: "bg-green-500",
      trackDone: "bg-green-400",
    },
  },
  {
    key: "DISPATCHED",
    label: "Dispatched",
    shortLabel: "Dispatched",
    description: "Consignment picked up. Driver en route with challan. Awaiting proof of delivery.",
    icon: Truck,
    group: "dispatch",
    role: "Dispatch Team",
    actions: [
      { label: "Update POD", href: "/dispatch", variant: "default", description: "Record delivery confirmation and receiver name" },
      { label: "Track Challan", href: "/dispatch", variant: "outline", description: "View challan details and route" },
    ],
    colorClass: {
      dot: "bg-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800/40",
      text: "text-blue-700 dark:text-blue-300",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      iconText: "text-blue-600 dark:text-blue-400",
      trackActive: "bg-blue-500",
      trackDone: "bg-blue-400",
    },
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    shortLabel: "Delivered",
    description: "Client received the order. Collect feedback and raise balance payment request.",
    icon: PackageCheck,
    group: "dispatch",
    role: "Sales + Accounts",
    actions: [
      { label: "Collect Feedback", href: "/feedback", variant: "default", description: "Record client satisfaction rating" },
      { label: "Request Balance Payment", href: "/payments", variant: "outline", description: "Send balance due reminder to client" },
    ],
    colorClass: {
      dot: "bg-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/40",
      text: "text-emerald-700 dark:text-emerald-300",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      iconText: "text-emerald-600 dark:text-emerald-400",
      trackActive: "bg-emerald-600",
      trackDone: "bg-emerald-500",
    },
  },
  {
    key: "PAYMENT_CLOSED",
    label: "Payment Closed",
    shortLabel: "Closed",
    description: "Balance payment received and verified. Order fully complete. Generate final invoice.",
    icon: CheckCircle2,
    group: "finance",
    role: "Accounts",
    actions: [
      { label: "Record Balance Payment", href: "/payments", variant: "default", description: "Log final payment and mark order closed" },
      { label: "Generate Invoice", href: "/accounts", variant: "outline", description: "Create GST invoice for the client" },
    ],
    colorClass: {
      dot: "bg-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800/40",
      text: "text-green-800 dark:text-green-200",
      iconBg: "bg-green-100 dark:bg-green-900/60",
      iconText: "text-green-700 dark:text-green-300",
      trackActive: "bg-green-600",
      trackDone: "bg-green-500",
    },
  },
];

export const STAGE_KEYS = LIFECYCLE_STAGES.map((s) => s.key);

export function getStageConfig(key: string): StageConfig | undefined {
  return LIFECYCLE_STAGES.find((s) => s.key === key);
}

export function mapOrderStatusToLifecycle(orderStatus: string): LifecycleStageKey {
  const map: Record<string, LifecycleStageKey> = {
    CONFIRMED: "CONFIRMED",
    ADVANCE_PENDING: "CONFIRMED",
    IN_PRODUCTION: "IN_PRODUCTION",
    PACKING: "PACKING",
    QC_PENDING: "QC_PENDING",
    QC_PASSED: "QC_PASSED",
    DISPATCHED: "DISPATCHED",
    DELIVERED: "DELIVERED",
  };
  return map[orderStatus] ?? "CONFIRMED";
}

// ─── Group definitions ────────────────────────────────────────────────────────

const GROUPS = [
  { key: "sales", label: "Sales Pipeline", color: "text-blue-600" },
  { key: "finance", label: "Finance", color: "text-emerald-600" },
  { key: "factory", label: "Factory Floor", color: "text-purple-600" },
  { key: "dispatch", label: "Last Mile", color: "text-orange-600" },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderLifecycleTrackerProps {
  currentStage: LifecycleStageKey;
  history: LifecycleHistoryEntry[];
  orderId: string;
  isRushOrder?: boolean;
  deliveryDate?: Date;
  paymentStatus?: string;
  canAdvance?: boolean;
  onAdvanceStage?: (nextStage: LifecycleStageKey) => Promise<void>;
}

export function OrderLifecycleTracker({
  currentStage,
  history,
  orderId,
  isRushOrder,
  deliveryDate,
  paymentStatus,
  canAdvance = true,
  onAdvanceStage,
}: OrderLifecycleTrackerProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const currentIdx = STAGE_KEYS.indexOf(currentStage);
  const currentConfig = getStageConfig(currentStage)!;
  const nextStage = currentIdx < STAGE_KEYS.length - 1 ? STAGE_KEYS[currentIdx + 1] : null;
  const nextConfig = nextStage ? getStageConfig(nextStage) : null;
  const isComplete = currentStage === "PAYMENT_CLOSED";

  const handleAdvance = async () => {
    if (!nextStage || !onAdvanceStage) return;
    setAdvancing(true);
    await onAdvanceStage(nextStage);
    setAdvancing(false);
  };

  const stageHistory = (key: LifecycleStageKey) =>
    history.find((h) => h.stage === key);

  return (
    <div className="space-y-4">
      {/* ── Horizontal track ─────────────────────────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          {/* Group labels */}
          <div className="flex border-b border-border/40 bg-muted/30">
            {GROUPS.map((group) => {
              const groupStages = LIFECYCLE_STAGES.filter((s) => s.group === group.key);
              const widthPct = (groupStages.length / LIFECYCLE_STAGES.length) * 100;
              return (
                <div
                  key={group.key}
                  className="border-r border-border/40 last:border-0 py-1.5 px-3"
                  style={{ width: `${widthPct}%` }}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${group.color}`}>
                    {group.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stage dots */}
          <div className="flex overflow-x-auto px-4 py-4 gap-0">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const isDone = STAGE_KEYS.indexOf(stage.key) < currentIdx;
              const isCurrent = stage.key === currentStage;
              const isUpcoming = STAGE_KEYS.indexOf(stage.key) > currentIdx;
              const Icon = stage.icon;
              const hist = stageHistory(stage.key);

              return (
                <TooltipProvider key={stage.key} delayDuration={100}>
                  <div className="flex items-center flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex flex-col items-center group cursor-default">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                            isDone && "bg-emerald-500 border-emerald-500 text-white",
                            isCurrent && "border-current ring-4 ring-offset-2",
                            isCurrent && `${stage.colorClass.trackActive} border-current text-white ring-${stage.colorClass.trackActive}/20`,
                            isUpcoming && "bg-muted border-muted-foreground/20 text-muted-foreground/50",
                          )}>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Icon className={cn("w-3.5 h-3.5", isCurrent ? "text-white" : "")} />
                            )}
                          </div>
                          <p className={cn(
                            "text-[9px] mt-1.5 whitespace-nowrap font-medium max-w-[56px] text-center leading-tight",
                            isDone && "text-emerald-600 dark:text-emerald-400",
                            isCurrent && `${stage.colorClass.text} font-bold`,
                            isUpcoming && "text-muted-foreground/50",
                          )}>
                            {stage.shortLabel}
                          </p>
                          {hist && (
                            <p className="text-[8px] text-muted-foreground/60 whitespace-nowrap mt-0.5">
                              {formatDate(hist.enteredAt)}
                            </p>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                        <p className="font-semibold">{stage.label}</p>
                        <p className="text-muted-foreground mt-0.5">{stage.description}</p>
                        {hist && (
                          <p className="text-muted-foreground mt-1">
                            Entered: {formatDateTime(hist.enteredAt)} by {hist.by}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>

                    {i < LIFECYCLE_STAGES.length - 1 && (
                      <div className={cn(
                        "h-0.5 w-6 mx-0.5 mb-5 flex-shrink-0 transition-colors",
                        STAGE_KEYS.indexOf(LIFECYCLE_STAGES[i + 1].key) <= currentIdx
                          ? "bg-emerald-400"
                          : STAGE_KEYS.indexOf(LIFECYCLE_STAGES[i].key) < currentIdx
                            ? "bg-emerald-400"
                            : "bg-muted",
                      )} />
                    )}
                  </div>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Current stage action card ─────────────────────────────────────── */}
      <div className={cn(
        "rounded-xl border-2 p-5",
        isComplete
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700"
          : `${currentConfig.colorClass.bg} ${currentConfig.colorClass.border}`,
      )}>
        <div className="flex items-start gap-4">
          {/* Stage icon */}
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
            isComplete ? "bg-emerald-100 dark:bg-emerald-900/60" : currentConfig.colorClass.iconBg,
          )}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <currentConfig.icon className={cn("w-5 h-5", currentConfig.colorClass.iconText)} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={cn("font-bold text-base", isComplete ? "text-emerald-800 dark:text-emerald-200" : currentConfig.colorClass.text)}>
                {isComplete ? "Order Complete" : `Current Stage: ${currentConfig.label}`}
              </h3>
              <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", isComplete ? "border-emerald-400 text-emerald-700" : `${currentConfig.colorClass.border} ${currentConfig.colorClass.text}`)}>
                {STAGE_KEYS.indexOf(currentStage) + 1} / {STAGE_KEYS.length}
              </Badge>
              {isRushOrder && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" /> RUSH
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isComplete
                ? "This order has been fully delivered and payment closed. Generate final invoice and file records."
                : currentConfig.description}
            </p>

            {/* Role + delivery date */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80">
                <Users className="w-3 h-3" />
                {currentConfig.role}
              </span>
              {deliveryDate && !isComplete && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-medium",
                  daysUntilHelper(deliveryDate) <= 2 ? "text-red-600 dark:text-red-400" : "text-muted-foreground/80"
                )}>
                  <Clock className="w-3 h-3" />
                  Delivery {formatDate(deliveryDate)}
                  {daysUntilHelper(deliveryDate) <= 2 && daysUntilHelper(deliveryDate) >= 0 && (
                    <span className="ml-0.5 font-bold">· {daysUntilHelper(deliveryDate)}d left</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Next stage advance */}
          {!isComplete && nextConfig && canAdvance && onAdvanceStage && (
            <div className="flex-shrink-0">
              <Button
                size="sm"
                onClick={handleAdvance}
                disabled={advancing}
                className="gap-1.5"
              >
                {advancing ? (
                  <span className="text-xs">Moving…</span>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="text-xs">→ {nextConfig.shortLabel}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Stage actions */}
        {!isComplete && (
          <div className="mt-4 pt-4 border-t border-current/10">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Actions at this stage
            </p>
            <div className="flex flex-wrap gap-2">
              {currentConfig.actions.map((action, i) => (
                <a key={i} href={action.href ?? "#"}>
                  <Button
                    size="sm"
                    variant={action.variant ?? "outline"}
                    className="h-7 text-xs gap-1"
                  >
                    {action.label}
                  </Button>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Stage timeline (history) ──────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-0 pt-4 px-5">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <CardTitle className="text-sm font-semibold">Stage History</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{history.length} stages completed</span>
              {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
        </CardHeader>

        {showHistory && (
          <CardContent className="pt-4 pb-4 px-5">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No stage history recorded yet.</p>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />

                <div className="space-y-4">
                  {[...history].reverse().map((entry, i) => {
                    const config = getStageConfig(entry.stage);
                    if (!config) return null;
                    const Icon = config.icon;
                    const isCurrent = entry.stage === currentStage;

                    return (
                      <div key={i} className="flex gap-4 relative">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10",
                          isCurrent
                            ? `${config.colorClass.trackActive} border-transparent text-white`
                            : "bg-emerald-500 border-emerald-500 text-white",
                        )}>
                          {isCurrent ? <Icon className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className={cn(
                              "text-sm font-semibold",
                              isCurrent ? config.colorClass.text : "text-foreground",
                            )}>
                              {config.label}
                              {isCurrent && (
                                <span className={cn("ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full", config.colorClass.iconBg, config.colorClass.iconText)}>
                                  CURRENT
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(entry.enteredAt)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">By {entry.by}</p>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground/80 mt-1 italic">"{entry.note}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function daysUntilHelper(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
