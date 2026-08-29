import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  AlertTriangle,
  Zap,
  Package,
  CheckSquare,
  Truck,
  Factory,
  Paintbrush,
  ClipboardList,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import { AutoPrint } from "./auto-print";

// ─── Batch status display map ─────────────────────────────────────────────────
const BATCH_STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED:   { label: "Scheduled",   cls: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-purple-100 text-purple-700 border-purple-200" },
  COMPLETED:   { label: "Completed",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  PAUSED:      { label: "Paused",      cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  DELAYED:     { label: "Delayed",     cls: "bg-red-100 text-red-700 border-red-200" },
};

const EVENT_LABELS: Record<string, string> = {
  CORPORATE: "Corporate", DIWALI: "Diwali", EID: "Eid",
  HOLI: "Holi", CHRISTMAS: "Christmas", BIRTHDAY: "Birthday",
  WEDDING: "Wedding", ANNIVERSARY: "Anniversary",
  BABY_SHOWER: "Baby Shower", NEW_YEAR: "New Year", OTHER: "Other",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ print?: string }>;
};

export default async function ProductionSheetPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const autoPrint = sp?.print === "1";

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      items: { orderBy: { id: "asc" } },
      deliveryAddresses: { orderBy: { id: "asc" } },
      productionBatches: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { scheduledDate: "asc" },
      },
    },
  });

  if (!order) notFound();

  // Shape items to match JSX expectations
  const items = order.items.map((i) => ({
    ...i,
    packaging: i.packagingType ?? null,
    branding: i.brandingNotes ?? null,
  }));

  const batches = order.productionBatches;
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const days = daysUntil(order.deliveryDate);
  const sheetId = `PS-${order.orderNumber}`;
  const generatedAt = new Date();

  const checklist = [
    { id: "c1",  label: "Raw materials / ingredients sourced and verified",              phase: "PRE-PRODUCTION" },
    { id: "c2",  label: "Production batch(es) created and assigned",                     phase: "PRE-PRODUCTION" },
    { id: "c3",  label: "Assembly / hamper filling complete",                            phase: "PRODUCTION" },
    { id: "c4",  label: "Branding & personalisation applied (logo, name cards, ribbon)", phase: "PRODUCTION" },
    { id: "c5",  label: "Inner packing done (tissue, inserts, fillers)",                 phase: "PACKING" },
    { id: "c6",  label: "Outer box sealed and labeled",                                  phase: "PACKING" },
    { id: "c7",  label: "QC inspection completed — all units approved",                  phase: "QC" },
    { id: "c8",  label: "Units counted and matched against order qty",                   phase: "QC" },
    { id: "c9",  label: "Dispatch challan prepared",                                     phase: "DISPATCH" },
    { id: "c10", label: "Driver assigned and vehicle confirmed",                          phase: "DISPATCH" },
    { id: "c11", label: "Customer notified of dispatch",                                  phase: "DISPATCH" },
  ];

  const phaseColors: Record<string, string> = {
    "PRE-PRODUCTION": "text-blue-600 dark:text-blue-400",
    "PRODUCTION":     "text-purple-600 dark:text-purple-400",
    "PACKING":        "text-orange-600 dark:text-orange-400",
    "QC":             "text-amber-600 dark:text-amber-400",
    "DISPATCH":       "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <>
      {/* ── Print styles injected globally ─────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .print-section { break-inside: avoid; }
        }
      `}</style>

      {/* ── Screen toolbar ──────────────────────────────────────────────────── */}
      <div className="no-print mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/orders/${id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-base">Production Sheet</h1>
            <p className="text-xs text-muted-foreground font-mono">{sheetId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AutoPrint auto={autoPrint} />
        </div>
      </div>

      {/* ── Document ────────────────────────────────────────────────────────── */}
      <div className="print-page max-w-4xl mx-auto bg-white dark:bg-background rounded-xl border border-border shadow-sm overflow-hidden text-sm">

        {/* ── Sheet header ───────────────────────────────────────────────────── */}
        <div className="bg-gray-900 dark:bg-gray-950 text-white px-8 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">GiftingOps</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">Production Order Sheet</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{sheetId}</p>
          </div>
          <div className="text-right text-xs text-gray-400 space-y-0.5">
            <p className="text-white font-semibold text-sm">INTERNAL USE ONLY</p>
            <p>Generated: {formatDate(generatedAt)}</p>
            <p className="font-mono">{generatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        {/* ── Rush banner ────────────────────────────────────────────────────── */}
        {order.isRushOrder && (
          <div className="bg-red-600 text-white px-8 py-2 flex items-center gap-2 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            RUSH ORDER — PRIORITY PROCESSING REQUIRED
          </div>
        )}

        {/* ── Section 1: Order Summary ─────────────────────────────────────── */}
        <div className="px-8 py-6 border-b border-border print-section">
          <SectionTitle icon={<ClipboardList className="w-4 h-4" />} label="Order Summary" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 mt-4">
            <Field label="Order Number" value={<span className="font-mono font-semibold">{order.orderNumber}</span>} />
            <Field label="Event Type" value={EVENT_LABELS[order.eventType] ?? order.eventType} />
            <Field label="Status" value={
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
                order.status === "IN_PRODUCTION" ? "bg-purple-100 text-purple-700 border-purple-200" :
                order.status === "CONFIRMED"     ? "bg-blue-100 text-blue-700 border-blue-200" :
                order.status === "PACKING"       ? "bg-orange-100 text-orange-700 border-orange-200" :
                "bg-gray-100 text-gray-700 border-gray-200"
              )}>
                {order.status.replace(/_/g, " ")}
              </span>
            } />
            <Field label="Client / Company" value={order.companyName ?? order.clientName} />
            <Field label="Contact Person" value={order.clientName} />
            <Field label="Total Units" value={
              <span className="text-lg font-bold text-foreground">{totalUnits.toLocaleString("en-IN")}</span>
            } />
            <Field label="Delivery Date" value={
              <span className={cn(
                "font-semibold",
                days < 0 ? "text-red-600" : days <= 2 ? "text-orange-600" : "text-foreground"
              )}>
                {formatDate(order.deliveryDate)}
                <span className="ml-1.5 font-normal text-muted-foreground text-xs">
                  {days < 0
                    ? `(${Math.abs(days)}d overdue)`
                    : days === 0 ? "(Today!)"
                    : `(${days}d remaining)`}
                </span>
              </span>
            } />
            <Field label="Created By" value={order.createdBy.name} />
            {order.isRushOrder && (
              <Field label="Rush Order" value={
                <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                  <Zap className="w-3.5 h-3.5" /> YES
                </span>
              } />
            )}
          </div>
          {order.internalNotes && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300">
              <span className="font-semibold">Order Notes: </span>{order.internalNotes}
            </div>
          )}
        </div>

        {/* ── Section 2: Batch Plan ─────────────────────────────────────────── */}
        <div className="px-8 py-6 border-b border-border print-section">
          <SectionTitle icon={<Factory className="w-4 h-4" />} label="Batch Plan" />
          {batches.length === 0 ? (
            <p className="text-muted-foreground text-xs mt-3 italic">No production batches created yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border border-border">
                    <Th>Batch #</Th>
                    <Th>Product / Hamper</Th>
                    <Th align="right">Qty</Th>
                    <Th>Assigned To</Th>
                    <Th>Start Date</Th>
                    <Th>Deadline</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch, i) => {
                    const statusCfg = BATCH_STATUS[batch.status] ?? { label: batch.status, cls: "bg-gray-100 text-gray-700 border-gray-200" };
                    const isOverdue = batch.deadline && !["COMPLETED"].includes(batch.status) && new Date(batch.deadline) < new Date();
                    return (
                      <tr
                        key={batch.id}
                        className={cn(
                          "border border-border",
                          i % 2 === 0 ? "bg-white dark:bg-background" : "bg-gray-50/50 dark:bg-gray-900/30"
                        )}
                      >
                        <Td>
                          <span className="font-mono font-medium text-[11px]">{batch.batchNumber}</span>
                        </Td>
                        <Td>
                          <p className="font-medium">{batch.productName}</p>
                          {batch.shortages && (
                            <p className="text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              {batch.shortages}
                            </p>
                          )}
                          {batch.notes && (
                            <p className="text-muted-foreground italic mt-0.5">{batch.notes}</p>
                          )}
                        </Td>
                        <Td align="right">
                          <span className="font-mono font-semibold">{batch.quantity.toLocaleString("en-IN")}</span>
                        </Td>
                        <Td>{batch.assignedTo?.name ?? <span className="text-muted-foreground">Unassigned</span>}</Td>
                        <Td>{formatDate(batch.scheduledDate)}</Td>
                        <Td>
                          {batch.deadline ? (
                            <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                              {formatDate(batch.deadline)}
                            </span>
                          ) : "—"}
                        </Td>
                        <Td>
                          <span className={cn(
                            "inline-flex px-1.5 py-0.5 rounded border text-[10px] font-semibold",
                            statusCfg.cls
                          )}>
                            {statusCfg.label}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border border-border bg-gray-50 dark:bg-gray-900 font-semibold">
                    <td className="px-3 py-2 text-xs" colSpan={2}>Total</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {batches.reduce((s, b) => s + b.quantity, 0).toLocaleString("en-IN")}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Section 3: Item Breakdown + Packing Instructions ──────────────── */}
        <div className="px-8 py-6 border-b border-border print-section">
          <SectionTitle icon={<Package className="w-4 h-4" />} label="Item Breakdown & Packing Instructions" />
          <div className="mt-4 space-y-3">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-border bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-foreground">{item.productName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-foreground">{item.quantity.toLocaleString("en-IN")}</span>
                    <span className="text-xs text-muted-foreground ml-1">units</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 ml-8.5 text-xs">
                  <InlineField
                    label="Packaging"
                    value={item.packaging ?? order.packagingNotes ?? "Standard packaging"}
                  />
                  <InlineField
                    label="Branding"
                    value={item.branding ?? order.brandingNotes ?? "Standard branding"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 4: Global Packing & Branding Instructions ────────────── */}
        <div className="px-8 py-6 border-b border-border print-section">
          <SectionTitle icon={<Paintbrush className="w-4 h-4" />} label="Global Packing & Branding Instructions" />
          <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-3">
            <InlineField label="Special Instructions"     value={order.rushOrderNotes}  multiline />
            <InlineField label="Card Message"             value={order.cardMessage} />
            <InlineField label="Ribbon Colour"            value={order.ribbonColor} />
            <InlineField label="Logo Placement"           value={order.logoPlacement} />
            <InlineField label="Branding Notes"           value={order.brandingNotes} />
            <InlineField label="Dietary / Allergen Notes" value={order.dietaryNotes} />
            <InlineField label="Packaging Notes"          value={order.packagingNotes} />
            <InlineField label="Internal Notes"           value={order.internalNotes} />
          </div>

          {(order.rushOrderNotes || order.cardMessage || order.brandingNotes) && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300">
              <p className="font-semibold mb-1">⚠ Attention Required on Floor:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                {order.rushOrderNotes && <li>{order.rushOrderNotes}</li>}
                {order.cardMessage && <li>Card message: &quot;{order.cardMessage}&quot;</li>}
                {order.brandingNotes && <li>{order.brandingNotes}</li>}
              </ul>
            </div>
          )}
        </div>

        {/* ── Section 5: Delivery Timeline & Addresses ─────────────────────── */}
        <div className="px-8 py-6 border-b border-border print-section">
          <SectionTitle icon={<Truck className="w-4 h-4" />} label="Delivery Timeline & Addresses" />

          {/* Timeline bar */}
          <div className="mt-4 flex items-center gap-0 text-[10px] font-medium mb-5">
            {[
              { label: "Order Confirmed", done: true },
              { label: "In Production",  done: ["IN_PRODUCTION","PACKING","QC_PENDING","QC_PASSED","DISPATCHED","DELIVERED"].includes(order.status) },
              { label: "Packed & QC'd",  done: ["QC_PASSED","DISPATCHED","DELIVERED"].includes(order.status) },
              { label: "Dispatched",     done: ["DISPATCHED","DELIVERED"].includes(order.status) },
              { label: "Delivered",      done: order.status === "DELIVERED" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    step.done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white dark:bg-background border-gray-300 dark:border-gray-600"
                  )}>
                    {step.done && <span className="text-[8px]">✓</span>}
                  </div>
                  <span className={cn(
                    "mt-1 text-center leading-tight",
                    step.done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                  )}>{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mb-4",
                    step.done && arr[i + 1].done ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Delivery date callout */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border mb-4 text-xs",
            days < 0
              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
              : days <= 2
              ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400"
              : "bg-gray-50 border-border text-muted-foreground"
          )}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <strong>Delivery Date:</strong>{" "}
              {formatDate(order.deliveryDate)}{" "}
              {days < 0
                ? `— ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`
                : days === 0
                ? "— TODAY"
                : `— ${days} day${days !== 1 ? "s" : ""} remaining`}
            </span>
          </div>

          {/* Address table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border border-border">
                  <Th>#</Th>
                  <Th>Recipient</Th>
                  <Th>Phone</Th>
                  <Th>Address</Th>
                  <Th>City</Th>
                  <Th>State</Th>
                  <Th>Pincode</Th>
                  <Th align="right">Qty</Th>
                </tr>
              </thead>
              <tbody>
                {order.deliveryAddresses.map((addr, i) => (
                  <tr key={addr.id} className={cn(
                    "border border-border",
                    i % 2 === 0 ? "bg-white dark:bg-background" : "bg-gray-50/50 dark:bg-gray-900/30"
                  )}>
                    <Td>{i + 1}</Td>
                    <Td><span className="font-medium">{addr.recipientName}</span></Td>
                    <Td>{addr.phone}</Td>
                    <Td>
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                    </Td>
                    <Td>{addr.city}</Td>
                    <Td>{addr.state}</Td>
                    <Td><span className="font-mono">{addr.pincode}</span></Td>
                    <Td align="right">
                      <span className="font-mono font-semibold">
                        {addr.quantity ?? totalUnits}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 6: Production Checklist ──────────────────────────────── */}
        <div className="px-8 py-6 border-b border-border print-section">
          <SectionTitle icon={<CheckSquare className="w-4 h-4" />} label="Production Checklist" />
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            To be signed off by the floor supervisor at each stage.
          </p>
          <div className="space-y-0">
            {(["PRE-PRODUCTION", "PRODUCTION", "PACKING", "QC", "DISPATCH"] as const).map((phase) => {
              const phaseItems = checklist.filter((c) => c.phase === phase);
              return (
                <div key={phase} className="mb-4">
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1.5",
                    phaseColors[phase]
                  )}>
                    {phase.replace(/-/g, " ")}
                  </p>
                  <div className="space-y-1.5">
                    {phaseItems.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                        <div className="w-4 h-4 rounded border-2 border-gray-400 dark:border-gray-600 flex-shrink-0 mt-0.5 group-hover:border-emerald-500 transition-colors print:border-gray-400" />
                        <span className="text-xs text-foreground leading-snug">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sign-off row */}
          <div className="mt-6 grid grid-cols-3 gap-8 text-xs">
            {["Floor Supervisor", "QC Inspector", "Dispatch Manager"].map((role) => (
              <div key={role}>
                <div className="border-b-2 border-gray-400 dark:border-gray-600 h-8 mb-1" />
                <p className="text-muted-foreground">{role}</p>
                <p className="text-muted-foreground">Date: ___________</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            <strong className="text-red-600 dark:text-red-400">CONFIDENTIAL</strong>
            {" "}— For internal floor use only. Do not share with clients or vendors.
          </span>
          <span className="font-mono">{sheetId} · Page 1 of 1</span>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <h3 className="font-bold text-sm tracking-tight">{label}</h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm font-medium text-foreground">{value ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function InlineField({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}: </span>
      {value ? (
        <span className={cn("text-xs text-foreground", multiline && "block mt-0.5 pl-2 border-l-2 border-muted italic")}>
          {value}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn(
      "px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-r border-border last:border-r-0",
      align === "right" ? "text-right" : "text-left"
    )}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={cn(
      "px-3 py-2.5 border-r border-border last:border-r-0 align-top",
      align === "right" ? "text-right" : "text-left"
    )}>
      {children}
    </td>
  );
}
