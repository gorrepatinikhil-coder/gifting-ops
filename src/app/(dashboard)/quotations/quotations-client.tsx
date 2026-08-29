"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, FileText, Trash2, CheckCircle, XCircle, Eye, Download,
  Search, Filter, Calculator, Package, Truck, Tag, ArrowRight,
  ShoppingCart, Clock, AlertTriangle, Send,
} from "lucide-react";

interface QuoteItem {
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstRate: number;
  totalPrice: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  eventType?: string;
  eventDate?: string;
  validUntil?: string;
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  deliveryCharge: number;
  packagingCharge: number;
  brandingCharge: number;
  grandTotal: number;
  status: string;
  notes?: string;
  terms?: string;
  items: QuoteItem[];
  lead?: { clientName: string; company?: string };
  createdBy?: { name: string };
  approvedBy?: { name: string };
  createdAt: string;
}

interface Lead {
  id: string;
  clientName: string;
  company?: string;
}

interface Props {
  quotes: Quote[];
  leads: Lead[];
  userRole: string;
}

const STATUS_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Approval", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Sent", value: "SENT" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
];

const EVENT_TYPES = ["DIWALI", "CHRISTMAS", "CORPORATE", "WEDDING", "BIRTHDAY", "CUSTOM"];
const GST_RATES = [0, 5, 12, 18, 28];

const defaultItem: QuoteItem = {
  productName: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  gstRate: 18,
  totalPrice: 0,
};

function calcItemTotal(item: QuoteItem): number {
  const line = item.quantity * item.unitPrice;
  const afterDiscount = line * (1 - item.discount / 100);
  return afterDiscount * (1 + item.gstRate / 100);
}

export function QuotationsClient({ quotes: initialQuotes, leads, userRole }: Props) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    leadId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    eventType: "",
    eventDate: "",
    validUntil: "",
    notes: "",
    terms: "50% advance required to confirm order. Balance due on or before delivery. Prices inclusive of 18% GST. Custom branding & packaging charges as quoted. Cancellations accepted up to 7 days before delivery.",
    deliveryCharge: 0,
    packagingCharge: 0,
    brandingCharge: 0,
  });
  const [items, setItems] = useState<QuoteItem[]>([{ ...defaultItem }]);

  const filtered = quotes.filter((q) => {
    const matchSearch =
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      (q.clientCompany ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function addItem() {
    setItems((prev) => [...prev, { ...defaultItem }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof QuoteItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        updated.totalPrice = calcItemTotal(updated);
        return updated;
      })
    );
  }

  const subtotal = items.reduce((acc, item) => {
    const line = item.quantity * item.unitPrice;
    return acc + line * (1 - item.discount / 100);
  }, 0);

  const totalGst = items.reduce((acc, item) => {
    const line = item.quantity * item.unitPrice * (1 - item.discount / 100);
    return acc + line * (item.gstRate / 100);
  }, 0);

  const totalDiscount = items.reduce((acc, item) => {
    return acc + item.quantity * item.unitPrice * (item.discount / 100);
  }, 0);

  const extras = form.deliveryCharge + form.packagingCharge + form.brandingCharge;
  const grandTotal = subtotal + totalGst + extras;

  async function handleCreate() {
    if (!form.clientName) return toast.error("Client name required");
    if (items.some((i) => !i.productName || i.unitPrice <= 0)) {
      return toast.error("All items need a product name and unit price");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuotes((prev) => [data, ...prev]);
      setOpen(false);
      resetForm();
      toast.success("Quotation created");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: data.status } : q)));
      toast.success("Status updated");
    } else {
      toast.error(data.error);
    }
  }

  async function handleApprove(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/quotations/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: data.status } : q)));
      toast.success(action === "approve" ? "Quotation approved" : "Quotation rejected");
    } else {
      toast.error(data.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quotation?")) return;
    const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      toast.success("Deleted");
    } else {
      toast.error("Cannot delete");
    }
  }

  function resetForm() {
    setForm({
      leadId: "", clientName: "", clientEmail: "", clientPhone: "",
      clientCompany: "", eventType: "", eventDate: "", validUntil: "", notes: "",
      terms: "50% advance required to confirm order. Balance due on or before delivery. Prices inclusive of 18% GST. Custom branding & packaging charges as quoted. Cancellations accepted up to 7 days before delivery.",
      deliveryCharge: 0, packagingCharge: 0, brandingCharge: 0,
    });
    setItems([{ ...defaultItem }]);
  }

  function handleLeadSelect(leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setForm((prev) => ({
        ...prev,
        leadId,
        clientName: lead.clientName,
        clientCompany: lead.company ?? "",
      }));
    } else {
      setForm((prev) => ({ ...prev, leadId: "" }));
    }
  }

  function printQuote(q: Quote) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Quotation ${q.quoteNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { color: #ea580c; margin-bottom: 4px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f97316; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; }
        .total-row { font-weight: bold; }
        .grand-total { font-size: 1.2em; color: #ea580c; }
        .footer { margin-top: 40px; font-size: 0.85em; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        @media print { button { display: none; } }
      </style></head><body>
      <div class="header">
        <div>
          <h1>QUOTATION</h1>
          <p><strong>${q.quoteNumber}</strong></p>
          <p>Date: ${new Date(q.createdAt).toLocaleDateString("en-IN")}</p>
          ${q.validUntil ? `<p>Valid Until: ${new Date(q.validUntil).toLocaleDateString("en-IN")}</p>` : ""}
        </div>
        <div style="text-align: right;">
          <h2 style="color: #ea580c;">GiftingOps</h2>
          <p>Corporate Gifting Solutions</p>
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <strong>To:</strong><br/>
        ${q.clientName}<br/>
        ${q.clientCompany ? q.clientCompany + "<br/>" : ""}
        ${q.clientEmail ? q.clientEmail + "<br/>" : ""}
        ${q.clientPhone ? q.clientPhone : ""}
      </div>
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>GST</th><th>Total</th></tr></thead>
        <tbody>
          ${q.items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.productName}${item.description ? `<br/><small style="color:#666">${item.description}</small>` : ""}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unitPrice.toLocaleString("en-IN")}</td>
              <td>${item.discount}%</td>
              <td>${item.gstRate}%</td>
              <td>₹${item.totalPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div style="text-align: right; margin-top: 10px;">
        <table style="margin-left: auto; width: 300px;">
          <tr><td>Subtotal</td><td style="text-align:right">₹${q.subtotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
          <tr><td>Discount</td><td style="text-align:right; color: green;">-₹${q.totalDiscount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
          <tr><td>GST</td><td style="text-align:right">₹${q.totalGst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td></tr>
          ${q.deliveryCharge ? `<tr><td>Delivery</td><td style="text-align:right">₹${q.deliveryCharge.toLocaleString("en-IN")}</td></tr>` : ""}
          ${q.packagingCharge ? `<tr><td>Packaging</td><td style="text-align:right">₹${q.packagingCharge.toLocaleString("en-IN")}</td></tr>` : ""}
          ${q.brandingCharge ? `<tr><td>Branding</td><td style="text-align:right">₹${q.brandingCharge.toLocaleString("en-IN")}</td></tr>` : ""}
          <tr class="grand-total"><td><strong>Grand Total</strong></td><td style="text-align:right"><strong>₹${q.grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></td></tr>
        </table>
      </div>
      ${q.notes ? `<div style="margin-top: 20px;"><strong>Notes:</strong><br/>${q.notes}</div>` : ""}
      ${q.terms ? `<div class="footer"><strong>Terms & Conditions:</strong><br/>${q.terms}</div>` : ""}
      <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  const pendingApprovals = quotes.filter((q) => q.status === "PENDING_APPROVAL");
  const canApprove = ["ADMIN", "OWNER"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Pending approvals alert */}
      {canApprove && pendingApprovals.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {pendingApprovals.length} quotation{pendingApprovals.length > 1 ? "s" : ""} pending your approval
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const count = opt.value ? quotes.filter((q) => q.status === opt.value).length : null;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === opt.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                )}
              >
                {opt.label}
                {count != null && count > 0 && (
                  <span className="text-[10px] px-1 py-0.5 rounded-full bg-current/10 font-semibold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button asChild>
            <Link href="/quotations/new">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Link>
          </Button>
          {/* Keep the old dialog for quick edits — hidden trigger kept for programmatic use */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="hidden" />
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Quotation</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Link to Lead (optional)</Label>
                      <Select value={form.leadId} onValueChange={handleLeadSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select existing lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No lead</SelectItem>
                          {leads.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.clientName} {l.company ? `— ${l.company}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Client Name *</Label>
                      <Input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input value={form.clientCompany} onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Event Type</Label>
                      <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Event Date</Label>
                      <Input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Valid Until</Label>
                      <Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Line Items</h3>
                    <Button size="sm" variant="outline" onClick={addItem}>
                      <Plus className="h-3 w-3 mr-1" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="rounded-lg border p-3 space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Product Name *</Label>
                            <Input
                              placeholder="e.g. Diwali Hamper Box Premium"
                              value={item.productName}
                              onChange={(e) => updateItem(idx, "productName", e.target.value)}
                            />
                          </div>
                          {items.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="mt-5 text-destructive"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Optional details"
                            value={item.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit Price (₹)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Discount %</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discount}
                              onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">GST %</Label>
                            <Select
                              value={String(item.gstRate)}
                              onValueChange={(v) => updateItem(idx, "gstRate", Number(v))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {GST_RATES.map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-right text-sm font-medium text-primary">
                          Line Total: {formatCurrency(calcItemTotal(item))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Extra Charges */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extra Charges</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.deliveryCharge}
                        onChange={(e) => setForm((f) => ({ ...f, deliveryCharge: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Package className="h-3 w-3" /> Packaging</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.packagingCharge}
                        onChange={(e) => setForm((f) => ({ ...f, packagingCharge: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Tag className="h-3 w-3" /> Branding</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.brandingCharge}
                        onChange={(e) => setForm((f) => ({ ...f, brandingCharge: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-1.5">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatCurrency(totalDiscount)}</span></div>
                  <div className="flex justify-between text-sm"><span>GST</span><span>{formatCurrency(totalGst)}</span></div>
                  {extras > 0 && <div className="flex justify-between text-sm"><span>Extra Charges</span><span>{formatCurrency(extras)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                  {items.some((i) => i.discount > 10) && !["ADMIN", "OWNER"].includes(userRole) && (
                    <p className="text-xs text-yellow-600 mt-2">⚠ Discount &gt;10% requires owner/admin approval</p>
                  )}
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={3}
                      placeholder="Internal notes..."
                    />
                  </div>
                  <div>
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      value={form.terms}
                      onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Quotation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quotes Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations found"
          description="Create your first quotation to get started."
          action={{ label: "New Quote", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((q) => {
            const cardClasses = cn(
              "relative flex flex-col hover:shadow-md transition-shadow",
              ["APPROVED","ACCEPTED"].includes(q.status) && "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/10",
              ["REJECTED","EXPIRED"].includes(q.status) && "opacity-60",
              q.status === "PENDING_APPROVAL" && "border-amber-200 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10",
            );
            const daysToExpiry = q.validUntil
              ? Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 7
              && !["REJECTED","EXPIRED","ACCEPTED"].includes(q.status);
            return (
            <Card key={q.id} className={cardClasses}>
              <Link href={`/quotations/${q.id}`} className="block">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{q.quoteNumber}</p>
                    <CardTitle className="text-base leading-tight mt-0.5">{q.clientName}</CardTitle>
                    {q.clientCompany && <p className="text-sm text-muted-foreground">{q.clientCompany}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isExpiringSoon && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] border">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        {daysToExpiry === 0 ? "Expires today" : `${daysToExpiry}d left`}
                      </Badge>
                    )}
                    <StatusBadge status={q.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                </div>
              </CardHeader>
              </Link>
              <CardContent className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Grand Total</p>
                    <p className="font-bold text-primary">{formatCurrency(q.grandTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Items</p>
                    <p className="font-medium">{q.items.length} line{q.items.length !== 1 ? "s" : ""}</p>
                  </div>
                  {q.eventType && (
                    <div>
                      <p className="text-muted-foreground text-xs">Event</p>
                      <p className="font-medium">{q.eventType}</p>
                    </div>
                  )}
                  {q.validUntil && (
                    <div>
                      <p className="text-muted-foreground text-xs">Valid Until</p>
                      <p className="font-medium">{formatDate(q.validUntil)}</p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Created by {q.createdBy?.name} · {formatDate(q.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/quotations/${q.id}`}>
                      <Eye className="h-3 w-3 mr-1" /> Open
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => printQuote(q)}>
                    <Download className="h-3 w-3 mr-1" /> Print
                  </Button>

                  {q.status === "PENDING_APPROVAL" && canApprove && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                        onClick={() => handleApprove(q.id, "approve")}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                        onClick={() => handleApprove(q.id, "reject")}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </>
                  )}

                  {q.status === "DRAFT" && (
                    <Button size="sm" variant="outline"
                      onClick={() => handleStatusChange(q.id, "SENT")}>
                      Send to Client
                    </Button>
                  )}

                  {q.status === "APPROVED" && (
                    <>
                      <Button size="sm" className="text-xs gap-1" asChild>
                        <Link href={`/orders/new?quoteId=${q.id}`}>
                          <ShoppingCart className="h-3 w-3" /> Create Order
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs"
                        onClick={() => handleStatusChange(q.id, "SENT")}>
                        Mark Sent
                      </Button>
                    </>
                  )}

                  {q.status === "SENT" && (
                    <Button size="sm"
                      onClick={() => handleStatusChange(q.id, "ACCEPTED")}>
                      Mark Accepted
                    </Button>
                  )}

                  {["DRAFT", "REJECTED"].includes(q.status) && (
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => handleDelete(q.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}
