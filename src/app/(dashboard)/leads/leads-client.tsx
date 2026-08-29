"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Phone, Mail, Building2,
  Calendar, Banknote, Package, UserCircle2, X,
  ShoppingCart, FlaskConical, Users2, FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetHeader, SheetTitle, SheetDescription,
  SheetBody, SheetFooter, SheetSection,
} from "@/components/ui/sheet";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { MockLead, LeadStatus, EventType } from "@/lib/mock-data";

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  value: LeadStatus;
  label: string;
  dot: string;
  activePill: string;
  badge: string;
}

const STATUSES: StatusConfig[] = [
  {
    value: "NEW",
    label: "New",
    dot: "bg-blue-500",
    activePill: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
    dot: "bg-yellow-500",
    activePill: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-300",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  {
    value: "SAMPLE_SENT",
    label: "Sample Sent",
    dot: "bg-purple-500",
    activePill: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    value: "NEGOTIATION",
    label: "Negotiation",
    dot: "bg-orange-500",
    activePill: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    value: "WON",
    label: "Won",
    dot: "bg-emerald-500",
    activePill: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    value: "LOST",
    label: "Lost",
    dot: "bg-red-400",
    activePill: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
];

const EVENT_TYPES: EventType[] = [
  "CORPORATE", "DIWALI", "WEDDING", "BIRTHDAY",
  "CHRISTMAS", "EID", "HOLI", "CUSTOM", "OTHER",
];

const EVENT_LABELS: Record<EventType, string> = {
  CORPORATE: "Corporate", DIWALI: "Diwali", WEDDING: "Wedding",
  BIRTHDAY: "Birthday", CHRISTMAS: "Christmas", EID: "Eid",
  HOLI: "Holi", CUSTOM: "Custom", OTHER: "Other",
};

// ─── Event type colors ────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  DIWALI: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CORPORATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  WEDDING: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  BIRTHDAY: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  CHRISTMAS: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  EID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  HOLI: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  CUSTOM: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// ─── Stage timeline config ────────────────────────────────────────────────────

const LEAD_STAGES: LeadStatus[] = ["NEW", "CONTACTED", "SAMPLE_SENT", "NEGOTIATION", "WON"];

const STAGE_LABELS: Record<string, string> = {
  NEW: "New Enquiry",
  CONTACTED: "Contacted",
  SAMPLE_SENT: "Sample Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadsClientProps {
  leads: MockLead[];
  salesUsers: { id: string; name: string }[];
  currentUser: { id: string; name: string; role: string };
}

const EMPTY_FORM = {
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  eventType: "CORPORATE" as EventType,
  requirementType: "",
  expectedQty: "",
  budget: "",
  notes: "",
  assignedToId: "",
};

// ─── StatusBadge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUSES.find((s) => s.value === status)!;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
      meta.badge
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", meta.dot)} />
      {meta.label}
    </span>
  );
}

// ─── LeadDetailPanel ──────────────────────────────────────────────────────────

function LeadDetailPanel({ lead, onClose }: { lead: MockLead; onClose: () => void }) {
  const router = useRouter();

  const handleConvertToQuotation = () => {
    router.push(
      `/quotations/new?leadId=${lead.id}&company=${encodeURIComponent(lead.companyName)}&contact=${encodeURIComponent(lead.contactPerson)}&email=${encodeURIComponent(lead.email || "")}&phone=${encodeURIComponent(lead.phone)}&eventType=${lead.eventType}&qty=${lead.expectedQty || ""}&budget=${lead.budget || ""}`
    );
  };

  // Build timeline: for LOST leads show LOST at the end, otherwise normal stages
  const isLost = lead.status === "LOST";
  const currentStageIndex = isLost
    ? LEAD_STAGES.length // treat as past all normal stages
    : LEAD_STAGES.indexOf(lead.status);

  return (
    <>
      {/* ── Header ── */}
      <SheetHeader onClose={onClose}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-[15px]">{lead.companyName}</SheetTitle>
            <SheetDescription className="mt-0.5">{lead.contactPerson}</SheetDescription>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Phone className="w-3 h-3 flex-shrink-0" />
                {lead.phone}
              </span>
              {lead.email && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {lead.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 mt-0.5">
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </SheetHeader>

      {/* ── Body ── */}
      <SheetBody>

        {/* Section — Lead Details */}
        <SheetSection title="Lead Details">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Event Type */}
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Event Type</p>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold",
                EVENT_COLORS[lead.eventType] ?? EVENT_COLORS.OTHER
              )}>
                {EVENT_LABELS[lead.eventType] ?? lead.eventType}
              </span>
            </div>

            {/* Budget */}
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Budget</p>
              <p className="text-[13px] font-semibold text-foreground tabular-nums">
                {lead.budget ? formatCurrency(lead.budget) : (
                  <span className="text-muted-foreground/50 font-normal">Not specified</span>
                )}
              </p>
            </div>

            {/* Expected Qty */}
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Expected Qty</p>
              <p className="text-[13px] font-semibold text-foreground tabular-nums">
                {lead.expectedQty
                  ? lead.expectedQty.toLocaleString("en-IN")
                  : <span className="text-muted-foreground/50 font-normal">—</span>
                }
              </p>
            </div>

            {/* Requirement Type */}
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Requirement Type</p>
              <p className="text-[13px] text-foreground/80">
                {lead.requirementType ?? (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </p>
            </div>
          </div>

          {/* Next Follow-up */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Next Follow-up</p>
            </div>
            <p className="text-[13px] text-foreground mt-1.5 ml-5">
              {lead.nextFollowUp
                ? formatDate(lead.nextFollowUp)
                : <span className="text-muted-foreground/50">None set</span>
              }
            </p>
          </div>
        </SheetSection>

        {/* Section — Pipeline */}
        <SheetSection title="Pipeline">
          <div className="grid grid-cols-3 gap-3">
            {/* Quotations */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
              <p className="text-xl font-bold text-foreground tabular-nums">{lead._count.quotes}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">Quotations</p>
            </div>
            {/* Sample Requests */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
              <p className="text-xl font-bold text-foreground tabular-nums">{lead._count.samples}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">Samples</p>
            </div>
            {/* Orders */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
              <p className="text-xl font-bold text-foreground tabular-nums">{lead._count.orders}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">Orders</p>
            </div>
          </div>
        </SheetSection>

        {/* Section — Stage History */}
        <SheetSection title="Stage History">
          <div className="space-y-0">
            {LEAD_STAGES.map((stage, idx) => {
              const isCompleted = !isLost && currentStageIndex > idx;
              const isCurrent = !isLost && currentStageIndex === idx;
              const isFuture = isLost ? true : currentStageIndex < idx;

              return (
                <div key={stage} className="flex items-start gap-3">
                  {/* dot + line */}
                  <div className="flex flex-col items-center flex-shrink-0 w-5">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ring-2 ring-offset-background",
                      isCompleted
                        ? "bg-emerald-500 ring-emerald-200 dark:ring-emerald-800"
                        : isCurrent
                          ? "bg-blue-500 ring-blue-200 dark:ring-blue-800"
                          : "bg-muted-foreground/20 ring-transparent"
                    )} />
                    {idx < LEAD_STAGES.length - 1 && (
                      <div className={cn(
                        "w-px flex-1 min-h-[20px] mt-1",
                        isCompleted
                          ? "bg-emerald-300 dark:bg-emerald-800"
                          : "bg-border/60"
                      )} />
                    )}
                  </div>
                  {/* label */}
                  <p className={cn(
                    "text-[12px] pb-4",
                    isCompleted
                      ? "text-emerald-700 dark:text-emerald-400 font-medium"
                      : isCurrent
                        ? "text-blue-700 dark:text-blue-400 font-semibold"
                        : "text-muted-foreground/50"
                  )}>
                    {STAGE_LABELS[stage]}
                  </p>
                </div>
              );
            })}

            {/* Lost node — only rendered when status is LOST */}
            {isLost && (
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0 w-5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 bg-red-500 ring-2 ring-red-200 dark:ring-red-800 ring-offset-background" />
                </div>
                <p className="text-[12px] text-red-600 dark:text-red-400 font-semibold">
                  {STAGE_LABELS["LOST"]}
                </p>
              </div>
            )}
          </div>
        </SheetSection>

        {/* Section — Assigned */}
        <SheetSection title="Assigned">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Users2 className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">
                {lead.assignedTo?.name ?? lead.createdBy.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Created {formatDate(lead.createdAt)}
              </p>
            </div>
          </div>
        </SheetSection>

      </SheetBody>

      {/* ── Footer ── */}
      <SheetFooter className="flex-wrap gap-2">
        {/* Convert to Quotation — primary */}
        <Button
          onClick={handleConvertToQuotation}
          size="sm"
          className="flex-1 gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Convert to Quotation
        </Button>

        {/* Sample Request — secondary */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/samples")}
          className="gap-1.5"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Sample Request
        </Button>

        {/* Close — ghost */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Close
        </Button>
      </SheetFooter>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeadsClient({ leads, salesUsers, currentUser }: LeadsClientProps) {
  const [rows, setRows] = useState<MockLead[]>(leads);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<LeadStatus | "ALL">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, assignedToId: currentUser.id });
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<MockLead | null>(null);

  // ── Filtered rows ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((l) => {
      const matchSearch =
        !q ||
        l.companyName.toLowerCase().includes(q) ||
        l.contactPerson.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email ?? "").toLowerCase().includes(q);
      const matchStatus = activeStatus === "ALL" || l.status === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [rows, search, activeStatus]);

  // ── Status counts ──────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: rows.length };
    for (const s of STATUSES) {
      map[s.value] = rows.filter((l) => l.status === s.value).length;
    }
    return map;
  }, [rows]);

  // ── Add lead ───────────────────────────────────────────────────────────────

  const openDialog = () => {
    setForm({ ...EMPTY_FORM, assignedToId: currentUser.id });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.companyName.trim()) return toast.error("Company name is required.");
    if (!form.contactPerson.trim()) return toast.error("Contact person is required.");
    if (!form.phone.trim()) return toast.error("Phone number is required.");

    setSaving(true);
    await new Promise((r) => setTimeout(r, 380));

    const newLead: MockLead = {
      id: `lead-${Date.now()}`,
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      requirementType: form.requirementType.trim() || null,
      eventType: form.eventType,
      expectedQty: form.expectedQty ? Number(form.expectedQty) : null,
      budget: form.budget ? Number(form.budget) : null,
      status: "NEW",
      nextFollowUp: null,
      createdAt: new Date(),
      createdBy: { id: currentUser.id, name: currentUser.name },
      assignedTo: salesUsers.find((u) => u.id === form.assignedToId) ?? null,
      _count: { quotes: 0, orders: 0, samples: 0 },
    };

    setRows((prev) => [newLead, ...prev]);
    toast.success(`Lead created — ${newLead.companyName}`);
    setDialogOpen(false);
    setSaving(false);
  };

  const handleStatusChange = (id: string, status: LeadStatus) => {
    setRows((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    toast.success("Status updated.");
  };

  const statusOf = (s: LeadStatus) => STATUSES.find((x) => x.value === s)!;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Leads & Enquiries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rows.length} total &middot; {counts["WON"] ?? 0} won &middot;{" "}
            {counts["NEGOTIATION"] ?? 0} in negotiation
          </p>
        </div>
        <Button onClick={openDialog} size="sm" className="gap-1.5 flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
          Add Lead
        </Button>
      </div>

      {/* ── Search + status pills ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* All pill */}
          <button
            onClick={() => setActiveStatus("ALL")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
              activeStatus === "ALL"
                ? "bg-foreground text-background border-transparent"
                : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            All
            <span className={cn(
              "text-[10px] tabular-nums",
              activeStatus === "ALL" ? "text-background/60" : "text-muted-foreground/70"
            )}>
              {counts["ALL"]}
            </span>
          </button>

          {STATUSES.map((s) => {
            const active = activeStatus === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setActiveStatus(active ? "ALL" : s.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                  active
                    ? cn(s.activePill, "shadow-sm")
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  active ? s.dot : "bg-muted-foreground/30"
                )} />
                {s.label}
                {(counts[s.value] ?? 0) > 0 && (
                  <span className="text-[10px] tabular-nums opacity-70">
                    {counts[s.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[22%]">Company</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[20%]">Contact</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[18%]">Gift Requirement</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[12%]">Budget</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[8%]">Qty</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[14%]">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[12%]">Assigned</th>
                <th className="w-[4%]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                        <Building2 className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium">No leads found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search || activeStatus !== "ALL"
                          ? "Try adjusting your search or filter."
                          : "Click 'Add Lead' to get started."}
                      </p>
                      {!search && activeStatus === "ALL" && (
                        <Button size="sm" onClick={openDialog} className="mt-4 gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Add Lead
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const meta = statusOf(lead.status);
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* Company */}
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-semibold text-[13px] text-foreground leading-tight">{lead.companyName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-muted-foreground bg-muted/70 px-1.5 py-px rounded-md leading-tight">
                            {EVENT_LABELS[lead.eventType] ?? lead.eventType}
                          </span>
                          {lead._count.orders > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-px rounded-md">
                              {lead._count.orders} order{lead._count.orders > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 align-top">
                        <p className="text-[13px] text-foreground">{lead.contactPerson}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                          <span className="text-[11px] text-muted-foreground">{lead.phone}</span>
                        </div>
                      </td>

                      {/* Requirement */}
                      <td className="px-4 py-3.5 align-top">
                        <p className="text-[13px] text-foreground/80">
                          {lead.requirementType ?? <span className="text-muted-foreground/30">—</span>}
                        </p>
                        {lead.nextFollowUp && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-muted-foreground/40" />
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(lead.nextFollowUp, "dd MMM")}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3.5 text-right align-top">
                        {lead.budget ? (
                          <span className="text-[13px] font-medium tabular-nums text-foreground">
                            {formatCurrency(lead.budget)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-[13px]">—</span>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3.5 text-right align-top">
                        {lead.expectedQty ? (
                          <span className="text-[13px] tabular-nums text-foreground/80">
                            {lead.expectedQty.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-[13px]">—</span>
                        )}
                      </td>

                      {/* Status — inline select */}
                      <td className="px-4 py-3.5 align-top">
                        <Select
                          value={lead.status}
                          onValueChange={(v) => handleStatusChange(lead.id, v as LeadStatus)}
                        >
                          <SelectTrigger
                            className="h-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 hover:bg-transparent w-fit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer",
                              meta.badge
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", meta.dot)} />
                              {meta.label}
                            </div>
                          </SelectTrigger>
                          <SelectContent align="start">
                            {STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Assigned */}
                      <td className="px-4 py-3.5 align-top">
                        <p className="text-[12px] text-muted-foreground truncate max-w-[100px]">
                          {lead.assignedTo?.name ?? lead.createdBy.name}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 align-top text-center">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto text-muted-foreground/30 hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{filtered.length}</span>
              {" "}of{" "}
              <span className="font-medium text-foreground">{rows.length}</span> leads
            </p>
            {filtered.some((l) => l.budget) && (
              <p className="text-xs text-muted-foreground">
                Pipeline value:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(filtered.reduce((s, l) => s + (l.budget ?? 0), 0))}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Lead Detail Sheet ── */}
      <Sheet open={selectedLead !== null} onClose={() => setSelectedLead(null)} className="w-[520px] max-w-[calc(100vw-1rem)]">
        {selectedLead && (
          <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
        )}
      </Sheet>

      {/* ── Add Lead Dialog ── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => { if (!saving) setDialogOpen(o); }}
      >
        <DialogContent className="max-w-[560px] p-0 gap-0 overflow-hidden">

          {/* Dialog header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
            <DialogTitle className="text-base font-semibold">Add New Lead</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter the contact and requirement details below.
            </p>
          </DialogHeader>

          {/* Dialog body */}
          <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[65vh]">

            {/* Section 1 — Contact */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCircle2 className="w-3.5 h-3.5" />
                Contact Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    placeholder="Infosys Limited"
                    className="h-9"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Contact Person <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.contactPerson}
                    onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    placeholder="Rahul Sharma"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="h-9 pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="rahul@company.com"
                      className="h-9 pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border/60" />

            {/* Section 2 — Requirement */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Requirement Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Event Type</Label>
                  <Select
                    value={form.eventType}
                    onValueChange={(v) => setForm((f) => ({ ...f, eventType: v as EventType }))}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((e) => (
                        <SelectItem key={e} value={e} className="text-sm">{EVENT_LABELS[e]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Requirement Type</Label>
                  <Input
                    value={form.requirementType}
                    onChange={(e) => setForm((f) => ({ ...f, requirementType: e.target.value }))}
                    placeholder="e.g. Dry Fruit Hampers"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Expected Qty</Label>
                  <div className="relative">
                    <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <Input
                      type="number"
                      min={1}
                      value={form.expectedQty}
                      onChange={(e) => setForm((f) => ({ ...f, expectedQty: e.target.value }))}
                      placeholder="500"
                      className="h-9 pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Budget (₹)</Label>
                  <div className="relative">
                    <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <Input
                      type="number"
                      min={0}
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      placeholder="250000"
                      className="h-9 pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-medium">Assign To</Label>
                  <Select
                    value={form.assignedToId}
                    onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-sm">{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-medium">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Any context about this lead, their timeline, or specific requirements…"
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dialog footer */}
          <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-destructive">*</span> Required fields
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : (
                  "Create Lead"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
