"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Download,
  Check,
  X,
  Gift,
  Building2,
  Mail,
  Phone,
  Send,
  Clock,
  FileText,
  Edit,
} from "lucide-react";
import type { MockQuote } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Amount in words helper ────────────────────────────────────────────────────

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000)
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "");
  if (n < 100000)
    return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "");
  if (n < 10000000)
    return numToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWords(n % 100000) : "");
  return numToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWords(n % 10000000) : "");
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = "Rupees " + numToWords(rupees);
  if (paise > 0) result += " and " + numToWords(paise) + " Paise";
  result += " Only";
  return result;
}

// ─── API → MockQuote mapper ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiQuote(data: any): MockQuote {
  return {
    id: data.id,
    quoteNumber: data.quoteNumber,
    clientName: data.clientName ?? data.lead?.contactPerson ?? "",
    clientEmail: data.lead?.email ?? "",
    clientPhone: data.lead?.phone ?? undefined,
    clientCompany: data.companyName ?? data.lead?.companyName ?? "",
    eventType: data.eventType ?? "OTHER",
    validUntil: data.validUntil ? new Date(data.validUntil) : new Date(),
    subtotal: data.subtotal ?? 0,
    totalDiscount: data.discountAmt ?? 0,
    totalGst: data.gstAmt ?? 0,
    deliveryCharge: data.deliveryCost ?? 0,
    packagingCharge: data.packagingCost ?? 0,
    brandingCharge: data.brandingCost ?? 0,
    grandTotal: data.totalAmount ?? 0,
    status: data.status ?? "DRAFT",
    notes: data.notes ?? undefined,
    terms: data.terms ?? undefined,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    createdBy: data.createdBy ? { name: data.createdBy.name } : undefined,
    approvedBy: null,
    items: (data.items ?? []).map((item: { productName: string; description?: string; quantity: number; unitPrice: number; totalPrice?: number }) => ({
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: 0,
      gstRate: data.gstPct ?? 18,
    })),
  };
}

// ─── QuoteNotFound ─────────────────────────────────────────────────────────────

function QuoteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Quotation not found</h2>
        <p className="text-muted-foreground mt-1">
          The quotation you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/quotations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quotations
        </Link>
      </Button>
    </div>
  );
}

// ─── Line item amount calculator ───────────────────────────────────────────────

function lineAmount(qty: number, unitPrice: number, discount: number, gstRate: number): number {
  const afterDiscount = qty * unitPrice * (1 - discount / 100);
  return afterDiscount * (1 + gstRate / 100);
}

// ─── QuoteDetailView ───────────────────────────────────────────────────────────

function QuoteDetailView({ quote }: { quote: MockQuote }) {
  const [status, setStatus] = useState(quote.status);

  const today = new Date();
  const validUntil = new Date(quote.validUntil);
  const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  // Computed totals
  const subtotalBeforeDiscount = quote.subtotal;
  const totalDiscount = quote.totalDiscount;
  const taxableAmount = subtotalBeforeDiscount - totalDiscount;
  const gst = quote.totalGst;
  const subtotalWithGst = taxableAmount + gst;
  const grandTotal = quote.grandTotal;

  // Discount % for display
  const discountPct =
    subtotalBeforeDiscount > 0
      ? ((totalDiscount / subtotalBeforeDiscount) * 100).toFixed(0)
      : "0";

  const handleAction = (action: string) => {
    const statusMap: Record<string, string> = {
      submit: "PENDING_APPROVAL",
      approve: "APPROVED",
      reject: "REJECTED",
      send: "SENT",
      accept: "ACCEPTED",
      "mark-rejected": "REJECTED",
    };
    const toastMap: Record<string, { fn: typeof toast.success; msg: string }> = {
      submit: { fn: toast.success, msg: "Submitted for approval" },
      approve: { fn: toast.success, msg: "Quotation approved" },
      reject: { fn: toast.error, msg: "Quotation rejected" },
      send: { fn: toast.success, msg: "Quotation sent to client" },
      accept: { fn: toast.success, msg: "Marked as accepted" },
      "mark-rejected": { fn: toast.error, msg: "Marked as rejected" },
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;
    setStatus(newStatus);
    toastMap[action].fn(toastMap[action].msg);
    fetch(`/api/quotations/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => console.error("Failed to persist quotation status"));
  };

  const renderActionButtons = () => {
    switch (status) {
      case "DRAFT":
        return (
          <>
            <Button onClick={() => handleAction("submit")}>Submit for Approval</Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </>
        );
      case "PENDING_APPROVAL":
        return (
          <>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleAction("approve")}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button variant="destructive" onClick={() => handleAction("reject")}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </>
        );
      case "APPROVED":
        return (
          <>
            <Button onClick={() => handleAction("send")}>
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </>
        );
      case "SENT":
        return (
          <>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleAction("accept")}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as Accepted
            </Button>
            <Button variant="outline" onClick={() => handleAction("mark-rejected")}>
              <X className="mr-2 h-4 w-4" />
              Mark Rejected
            </Button>
          </>
        );
      case "ACCEPTED":
      case "REJECTED":
      case "EXPIRED":
      default:
        return (
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </>
        );
    }
  };

  const termsLines = quote.terms
    ? quote.terms.split(/\n|\./).map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-muted/30">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-doc { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* ── Sticky header bar ── */}
      <div className="no-print sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto gap-3">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/quotations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-semibold text-sm truncate">
                {quote.quoteNumber}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {renderActionButtons()}
            <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Document wrapper ── */}
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-card shadow-md rounded-xl overflow-hidden print-doc">

          {/* ── Section 1: Document header ── */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 px-8 py-8 border-b">
            <div className="flex items-start justify-between gap-6">
              {/* Left: Brand + address */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100 dark:bg-orange-900/40 p-2.5">
                    <Gift className="h-7 w-7 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">GiftingOps</div>
                    <div className="text-xs text-muted-foreground">Thoughtful Gifting, Delivered.</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 pl-1">
                  <div>Mumbai, Maharashtra 400001</div>
                  <div>GST: 27AABCG1234F1Z5</div>
                </div>
              </div>

              {/* Right: Quote identity */}
              <div className="text-right space-y-1.5 flex-shrink-0">
                <div className="text-3xl font-black tracking-widest text-orange-600 dark:text-orange-400 uppercase">
                  Quotation
                </div>
                <div className="font-mono text-sm text-muted-foreground">{quote.quoteNumber}</div>
                <div className="text-sm text-foreground">
                  <span className="text-muted-foreground">Date: </span>
                  {formatDate(quote.createdAt)}
                </div>
                <div
                  className={
                    "text-sm " +
                    (isExpired
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : isExpiringSoon
                      ? "text-amber-600 dark:text-amber-400 font-medium"
                      : "text-foreground")
                  }
                >
                  <span className="text-muted-foreground">Valid Until: </span>
                  {formatDate(quote.validUntil)}
                  {isExpired && " (Expired)"}
                  {isExpiringSoon && !isExpired && ` (${daysUntilExpiry}d left)`}
                </div>
                {/* Status badges */}
                {status === "ACCEPTED" && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
                      <Check className="h-3 w-3" /> Accepted
                    </span>
                  </div>
                )}
                {status === "PENDING_APPROVAL" && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1">
                      <Clock className="h-3 w-3" /> Pending Approval
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 2: Client & Reference Details ── */}
          <div className="grid grid-cols-2 gap-8 px-8 py-6 border-b">
            {/* Bill To */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Bill To
              </div>
              <div className="font-semibold text-foreground text-base">{quote.clientName}</div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                {quote.clientCompany}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                {quote.clientEmail}
              </div>
              {quote.clientPhone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  {quote.clientPhone}
                </div>
              )}
            </div>

            {/* Quote Reference */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Quote Reference
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prepared by</span>
                  <span className="font-medium">{quote.createdBy?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved by</span>
                  <span className="font-medium">{quote.approvedBy?.name ?? "Pending"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(quote.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Until</span>
                  <span
                    className={
                      "font-medium " +
                      (isExpired
                        ? "text-red-600"
                        : isExpiringSoon
                        ? "text-amber-600"
                        : "")
                    }
                  >
                    {formatDate(quote.validUntil)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Type</span>
                  <span className="font-medium capitalize">{quote.eventType.toLowerCase()}</span>
                </div>
              </div>
              {quote.notes && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                    &ldquo;{quote.notes}&rdquo;
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Line Items Table ── */}
          <div className="border-b">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide w-8">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Product / Description
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide w-16">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide w-28">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide w-20">
                    Disc %
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide w-20">
                    GST %
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      "border-b last:border-b-0 " +
                      (idx % 2 === 1 ? "bg-muted/30" : "bg-white dark:bg-card")
                    }
                  >
                    <td className="px-4 py-3.5 text-muted-foreground text-xs align-top">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-foreground">{item.productName}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground italic mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right align-top tabular-nums">
                      {item.quantity.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-right align-top tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right align-top tabular-nums">
                      {item.discount > 0 ? (
                        <span className="text-red-600 dark:text-red-400">{item.discount}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right align-top tabular-nums text-muted-foreground">
                      {item.gstRate}%
                    </td>
                    <td className="px-4 py-3.5 text-right align-top tabular-nums font-medium">
                      {formatCurrency(
                        lineAmount(item.quantity, item.unitPrice, item.discount, item.gstRate)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Section 4: Totals ── */}
          <div className="px-8 py-6 border-b">
            <div className="flex justify-end">
              <div className="w-80 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotalBeforeDiscount)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Discount ({discountPct}%)</span>
                    <span className="tabular-nums">−{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span className="tabular-nums">{formatCurrency(taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST</span>
                  <span className="tabular-nums">+{formatCurrency(gst)}</span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between font-medium">
                  <span>Subtotal (incl. GST)</span>
                  <span className="tabular-nums">{formatCurrency(subtotalWithGst)}</span>
                </div>
                {quote.deliveryCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span className="tabular-nums">{formatCurrency(quote.deliveryCharge)}</span>
                  </div>
                )}
                {quote.packagingCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Packaging</span>
                    <span className="tabular-nums">{formatCurrency(quote.packagingCharge)}</span>
                  </div>
                )}
                {quote.brandingCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Branding</span>
                    <span className="tabular-nums">{formatCurrency(quote.brandingCharge)}</span>
                  </div>
                )}

                <div className="pt-1">
                  <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2.5">
                    <span className="font-bold text-base text-foreground">Grand Total</span>
                    <span className="font-black text-base tabular-nums text-orange-600 dark:text-orange-400">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in words */}
            <div className="mt-4 pt-4 border-t border-dashed">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Amount in Words: </span>
                {amountInWords(grandTotal)}
              </p>
            </div>
          </div>

          {/* ── Section 5: Notes + Terms & Conditions ── */}
          <div className="bg-muted/20 dark:bg-muted/10 px-8 py-6 border-b space-y-5">
            {quote.notes && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Client Notes
                </div>
                <p className="text-sm text-foreground italic leading-relaxed">{quote.notes}</p>
              </div>
            )}

            {termsLines.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Terms &amp; Conditions
                </div>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  {termsLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* ── Section 6: Signature section ── */}
          <div className="px-8 py-8 flex justify-between items-end gap-8">
            {/* Left: Our signature */}
            <div className="flex-1 space-y-8">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                For GiftingOps
              </div>
              <div>
                <div className="border-b border-foreground/30 w-48 mb-1.5" />
                <div className="text-sm font-medium text-foreground">
                  {quote.createdBy?.name ?? "Authorised Signatory"}
                </div>
                <div className="text-xs text-muted-foreground">Authorised Signatory</div>
              </div>
            </div>

            {/* Right: Client signature */}
            <div className="flex-1 space-y-8 text-right">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                For {quote.clientCompany}
              </div>
              <div>
                <div className="border-b border-foreground/30 w-48 mb-1.5 ml-auto" />
                <div className="text-sm font-medium text-foreground">&nbsp;</div>
                <div className="text-xs text-muted-foreground">Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/30 px-8 py-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              This is a computer-generated quotation and does not require a physical signature unless specified.
              &nbsp;·&nbsp; GiftingOps &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page export ───────────────────────────────────────────────────────────────

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quote, setQuote] = useState<MockQuote | null | "loading">("loading");

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setQuote(data ? mapApiQuote(data) : null))
      .catch(() => setQuote(null));
  }, [id]);

  if (quote === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm">Loading quotation…</div>
      </div>
    );
  }
  if (!quote) return <QuoteNotFound />;
  return <QuoteDetailView quote={quote} />;
}
