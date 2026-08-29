"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Gift,
  Building2,
  Mail,
  Phone,
  Calendar,
  Package,
  Tag,
  Truck,
  FileText,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  productId?: string;
  productName: string;
  description: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  gstRate: number;
}

const EVENT_TYPES = [
  "CORPORATE",
  "DIWALI",
  "WEDDING",
  "BIRTHDAY",
  "HOLI",
  "CHRISTMAS",
  "EID",
  "CUSTOM",
  "OTHER",
] as const;

const GST_RATES = [0, 5, 12, 18] as const;

const DEFAULT_TERMS = `1. All prices are exclusive of GST unless stated otherwise.
2. 50% advance payment required to confirm the order.
3. Balance payment due within 3 days of delivery.
4. Cancellations accepted up to 7 days before production start.
5. Delivery timelines subject to advance payment receipt.
6. GiftingOps is not liable for delays due to force majeure events.`;

function newLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    productId: undefined,
    productName: "",
    description: "",
    qty: 1,
    unitPrice: 0,
    discountPct: 0,
    gstRate: 5,
  };
}

function getDefaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

// ─── Product Dropdown ─────────────────────────────────────────────────────────

interface ProductDropdownProps {
  item: LineItem;
  onUpdate: (id: string, updates: Partial<LineItem>) => void;
}

function ProductDropdown({ item, onUpdate }: ProductDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(item.productName);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_PRODUCTS.slice(0, 8);
    const q = search.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync external changes
  useEffect(() => {
    setSearch(item.productName);
  }, [item.productName]);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onUpdate(item.id, { productName: e.target.value, productId: undefined });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type a product name…"
          className="pl-8 h-8 text-sm"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((o) => !o)}
          tabIndex={-1}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[320px] rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No products found — your custom name will be used
              </div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors group"
                  onClick={() => {
                    onUpdate(item.id, {
                      productId: p.id,
                      productName: p.name,
                      description: p.description,
                      unitPrice: p.basePrice,
                      gstRate: p.gstRate,
                    });
                    setSearch(p.name);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-brand-600">
                        {p.basePrice > 0 ? formatCurrency(p.basePrice) : "Custom"}
                      </p>
                      <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
                        GST {p.gstRate}%
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t px-3 py-1.5 bg-muted/30">
            <p className="text-[10px] text-muted-foreground">
              Select from catalog or type a custom product name
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null;
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 shadow-xl text-sm font-medium transition-all animate-in slide-in-from-bottom-2",
        toast.type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      )}
    >
      {toast.type === "success" ? (
        <Check className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      )}
      {toast.message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function QuotationBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [eventType, setEventType] = useState("CORPORATE");
  const [validUntil, setValidUntil] = useState(getDefaultValidUntil());
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [packagingCharge, setPackagingCharge] = useState(0);
  const [brandingCharge, setBrandingCharge] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [internalNotes, setInternalNotes] = useState("");
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });
  const [errors, setErrors] = useState<string[]>([]);

  // ── URL param hydration ──────────────────────────────────────────────────────
  useEffect(() => {
    const contact = searchParams.get("contact");
    const company = searchParams.get("company");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const evtType = searchParams.get("eventType");
    const qty = searchParams.get("qty");

    if (contact) setClientName(contact);
    if (company) setClientCompany(company);
    if (email) setClientEmail(email);
    if (phone) setClientPhone(phone);
    if (evtType && (EVENT_TYPES as readonly string[]).includes(evtType)) {
      setEventType(evtType);
    }
    if (qty) {
      const parsed = parseInt(qty, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setItems((prev) => {
          if (prev[0]?.qty === 1) {
            return prev.map((it, i) => (i === 0 ? { ...it, qty: parsed } : it));
          }
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lead pill ───────────────────────────────────────────────────────────────
  const leadId = searchParams.get("leadId");
  const leadCompany = searchParams.get("company");

  // ── Calculations ─────────────────────────────────────────────────────────────
  const computed = useMemo(() => {
    const lines = items.map((item) => {
      const lineSubtotal = item.qty * item.unitPrice;
      const lineDiscount = lineSubtotal * (item.discountPct / 100);
      const lineAfterDisc = lineSubtotal - lineDiscount;
      const lineGst = lineAfterDisc * (item.gstRate / 100);
      const lineTotal = lineAfterDisc + lineGst;
      return { ...item, lineSubtotal, lineDiscount, lineAfterDisc, lineGst, lineTotal };
    });
    const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
    const totalDiscount = lines.reduce((s, l) => s + l.lineDiscount, 0);
    const taxableAmount = subtotal - totalDiscount;
    const totalGst = lines.reduce((s, l) => s + l.lineGst, 0);
    const extras = deliveryCharge + packagingCharge + brandingCharge;
    const grandTotal = taxableAmount + totalGst + extras;
    return {
      lines,
      subtotal,
      totalDiscount,
      taxableAmount,
      totalGst,
      extras,
      grandTotal,
    };
  }, [items, deliveryCharge, packagingCharge, brandingCharge]);

  // ── Item helpers ─────────────────────────────────────────────────────────────
  function updateItem(id: string, updates: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, newLineItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  }

  // ── Toast helper ─────────────────────────────────────────────────────────────
  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  function validate(): string[] {
    const errs: string[] = [];
    if (!clientName.trim()) errs.push("Client name is required");
    const validItems = items.filter(
      (it) => it.productName.trim() && it.qty > 0 && it.unitPrice > 0
    );
    if (validItems.length === 0) {
      errs.push("At least one line item with name, quantity, and price is required");
    }
    return errs;
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  function handleSaveDraft() {
    showToast("Saved as draft", "success");
    setTimeout(() => router.push("/quotations"), 1000);
  }

  function handleSubmit() {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      showToast(errs[0], "error");
      return;
    }
    setErrors([]);
    showToast("Submitted for approval", "success");
    setTimeout(() => router.push("/quotations"), 1000);
  }

  // ── Preview helpers ──────────────────────────────────────────────────────────
  const previewDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const previewValidUntil = validUntil
    ? new Date(validUntil).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const termsPreview = terms
    .split("\n")
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Toast toast={toast} />

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
              <Link href="/quotations">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground leading-tight">
                New Quotation
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Fill in the details below to generate a quote
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              Submit for Approval
            </Button>
          </div>
        </div>
      </div>

      {/* ── Validation Banner ─────────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <ul className="space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">
          {/* ── LEFT: Form (60%) ────────────────────────────────────────────── */}
          <div className="flex-[3] min-w-0 space-y-5">
            {/* Section 1: Client Details */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {/* Lead pill */}
                {leadId && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                    <Tag className="h-3 w-3" />
                    Linked to lead: {leadCompany || leadId}
                  </div>
                )}

                {/* Client Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-xs font-medium">
                    Client Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Vikram Reddy"
                    className={cn(
                      "h-9",
                      !clientName.trim() && errors.length > 0 && "border-red-400 focus-visible:ring-red-400"
                    )}
                  />
                </div>

                {/* Company + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="clientCompany" className="text-xs font-medium">
                      Company Name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="clientCompany"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        placeholder="e.g. Infosys Ltd"
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="clientEmail" className="text-xs font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@company.com"
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone + Event Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="clientPhone" className="text-xs font-medium">
                      Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="clientPhone"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((et) => (
                          <SelectItem key={et} value={et}>
                            {et.charAt(0) + et.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Valid Until + Delivery Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="validUntil" className="text-xs font-medium">
                      Valid Until
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="validUntil"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryDate" className="text-xs font-medium">
                      Expected Delivery
                    </Label>
                    <div className="relative">
                      <Truck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Gift Items */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Line Items
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                {/* Column headers */}
                <div className="grid items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground px-1"
                  style={{ gridTemplateColumns: "1fr 140px 72px 100px 68px 80px 80px 28px" }}>
                  <span>Product</span>
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span>Unit Price</span>
                  <span>Disc %</span>
                  <span>GST %</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>

                <Separator />

                {/* Line items */}
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const computed_line = computed.lines[idx];
                    return (
                      <div
                        key={item.id}
                        className="group rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-colors p-3 space-y-2"
                      >
                        {/* Row 1: Product search + delete */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <ProductDropdown item={item} onUpdate={updateItem} />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0",
                              items.length === 1 && "invisible"
                            )}
                            onClick={() => removeItem(item.id)}
                            tabIndex={items.length === 1 ? -1 : 0}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Row 2: Description + numerics */}
                        <div className="flex items-center gap-2">
                          {/* Description */}
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, { description: e.target.value })
                            }
                            placeholder="Description (optional)"
                            className="h-7 text-xs italic text-muted-foreground flex-1 min-w-0"
                          />

                          {/* Qty */}
                          <div className="relative w-[72px] flex-shrink-0">
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  qty: Math.max(1, parseInt(e.target.value) || 1),
                                })
                              }
                              className="h-7 text-xs text-center pr-1"
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="relative w-[100px] flex-shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              ₹
                            </span>
                            <Input
                              type="number"
                              min={0}
                              value={item.unitPrice || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  unitPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0"
                              className="h-7 text-xs pl-5"
                            />
                          </div>

                          {/* Discount % */}
                          <div className="relative w-[68px] flex-shrink-0">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPct || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  discountPct: Math.min(
                                    100,
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  ),
                                })
                              }
                              placeholder="0"
                              className="h-7 text-xs text-center pr-4"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              %
                            </span>
                          </div>

                          {/* GST % */}
                          <div className="w-[80px] flex-shrink-0">
                            <Select
                              value={String(item.gstRate)}
                              onValueChange={(v) =>
                                updateItem(item.id, { gstRate: Number(v) })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GST_RATES.map((r) => (
                                  <SelectItem key={r} value={String(r)} className="text-xs">
                                    {r}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Line total */}
                          <div className="w-[80px] flex-shrink-0 text-right">
                            <span className="text-xs font-semibold text-foreground">
                              {computed_line
                                ? formatCurrency(computed_line.lineTotal)
                                : "₹0.00"}
                            </span>
                            {computed_line &&
                              computed_line.lineDiscount > 0 && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  -{formatCurrency(computed_line.lineDiscount)}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal row */}
                <div className="flex justify-end pt-2">
                  <div className="text-xs text-muted-foreground space-y-0.5 text-right">
                    <div className="flex gap-8 justify-between">
                      <span>Items subtotal</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(computed.subtotal)}
                      </span>
                    </div>
                    {computed.totalDiscount > 0 && (
                      <div className="flex gap-8 justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Total discount</span>
                        <span className="font-medium">
                          -{formatCurrency(computed.totalDiscount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Extra Charges */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Extra Charges
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Delivery (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={deliveryCharge || ""}
                        onChange={(e) =>
                          setDeliveryCharge(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-9 pl-6"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Packaging & Boxing (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={packagingCharge || ""}
                        onChange={(e) =>
                          setPackagingCharge(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-9 pl-6"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Branding & Logo (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={brandingCharge || ""}
                        onChange={(e) =>
                          setBrandingCharge(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-9 pl-6"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Notes & Terms */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Client Notes</Label>
                    <span className="text-[10px] text-muted-foreground">
                      Shown on the quotation
                    </span>
                  </div>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions, customisation requests, or messages for the client…"
                    className="text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Terms & Conditions</Label>
                    <span className="text-[10px] text-muted-foreground">
                      Visible to client
                    </span>
                  </div>
                  <Textarea
                    rows={6}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="text-sm font-mono resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Internal Notes
                    </Label>
                    <span className="text-[10px] text-muted-foreground italic">
                      Not shown on quotation
                    </span>
                  </div>
                  <Textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Notes visible only to the team (margin targets, negotiation notes, etc.)"
                    className="text-sm resize-none border-dashed"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Live Preview (40%) ────────────────────────────────────── */}
          <div className="flex-[2] min-w-0">
            <div className="sticky top-[73px]">
              <Card className="border-border/60 overflow-hidden">
                {/* Preview header */}
                <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Gift className="h-4 w-4 opacity-90" />
                        <span className="font-bold text-base leading-tight">
                          GiftingOps
                        </span>
                      </div>
                      <p className="text-[11px] opacity-75">Thoughtful Gifting Co.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-semibold opacity-90">
                        QT-26-DRAFT
                      </p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        Date: {previewDate}
                      </p>
                      <p className="text-[10px] opacity-70">
                        Valid: {previewValidUntil}
                      </p>
                      {eventType && (
                        <span className="inline-block mt-1 text-[9px] bg-white/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                          {eventType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  {/* Bill To */}
                  <div className="px-5 py-3 border-b border-border/50 bg-muted/30">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Bill To
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {clientName || (
                        <span className="text-muted-foreground italic font-normal">
                          Client Name
                        </span>
                      )}
                    </p>
                    {clientCompany && (
                      <p className="text-xs text-muted-foreground">{clientCompany}</p>
                    )}
                    {(clientEmail || clientPhone) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {[clientEmail, clientPhone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {deliveryDate && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery:{" "}
                        {new Date(deliveryDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Line items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/20">
                          <th className="text-left px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-6">
                            #
                          </th>
                          <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Item
                          </th>
                          <th className="text-center px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-10">
                            Qty
                          </th>
                          <th className="text-right px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-24">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {computed.lines.map((line, idx) => (
                          <tr
                            key={line.id}
                            className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                          >
                            <td className="pl-5 pr-2 py-2 text-muted-foreground font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-2">
                              <p className="font-medium text-foreground leading-tight truncate max-w-[140px]">
                                {line.productName || (
                                  <span className="text-muted-foreground italic">
                                    Unnamed item
                                  </span>
                                )}
                              </p>
                              {line.discountPct > 0 && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  {line.discountPct}% disc · GST {line.gstRate}%
                                </p>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center text-muted-foreground">
                              {line.qty}
                            </td>
                            <td className="pl-2 pr-5 py-2 text-right font-semibold text-foreground">
                              {formatCurrency(line.lineTotal)}
                            </td>
                          </tr>
                        ))}
                        {computed.lines.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-4 text-center text-muted-foreground italic text-[11px]"
                            >
                              No items added yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="px-5 py-3 border-t border-border/50 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(computed.subtotal)}</span>
                    </div>
                    {computed.totalDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <span>Discount</span>
                        <span>-{formatCurrency(computed.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Taxable Amount</span>
                      <span>{formatCurrency(computed.taxableAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>GST</span>
                      <span>+{formatCurrency(computed.totalGst)}</span>
                    </div>
                    {computed.extras > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Extras
                          {[
                            deliveryCharge > 0 && "delivery",
                            packagingCharge > 0 && "packaging",
                            brandingCharge > 0 && "branding",
                          ]
                            .filter(Boolean)
                            .join(", ")
                            .replace(/^/, " (")}
                          {computed.extras > 0 && ")"}
                        </span>
                        <span>+{formatCurrency(computed.extras)}</span>
                      </div>
                    )}

                    {/* Grand total box */}
                    <div className="mt-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                        Grand Total
                      </span>
                      <span className="text-base font-bold text-brand-700 dark:text-brand-300">
                        {formatCurrency(computed.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Notes & Terms preview */}
                  {(notes || termsPreview) && (
                    <div className="px-5 py-3 border-t border-border/50 space-y-2">
                      {notes && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                            Notes
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {notes}
                          </p>
                        </div>
                      )}
                      {termsPreview && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                            Terms
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {termsPreview}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-5 py-2.5 border-t border-border/30 bg-muted/20 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      This is a draft quotation — not a tax invoice
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      GiftingOps · hello@giftingops.com
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick stats below preview */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Items
                  </p>
                  <p className="text-lg font-bold text-foreground">{items.length}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Total Qty
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {items.reduce((s, i) => s + i.qty, 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page export with Suspense ────────────────────────────────────────────────

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-muted-foreground text-sm">Loading quotation builder…</div>
      }
    >
      <QuotationBuilderContent />
    </Suspense>
  );
}
