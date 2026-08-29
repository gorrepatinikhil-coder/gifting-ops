import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateQuoteNumber } from "@/lib/utils";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const quoteItemSchema = z.object({
  productName: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  packagingType: z.string().optional(),
  brandingNotes: z.string().optional(),
  // Accepted for calculation; not stored on QuoteItem (schema doesn't have these columns)
  discount: z.number().min(0).max(100).optional(),
  gstRate: z.number().min(0).max(28).optional(),
});

const createQuoteSchema = z.object({
  // leadId is required — Quote.leadId is a non-nullable FK in the schema
  leadId: z.string().min(1, "Lead is required"),
  clientName: z.string().min(1),
  // Accepted as "clientCompany" from frontend; mapped to schema field "companyName"
  clientCompany: z.string().optional(),
  companyName: z.string().optional(),
  eventType: z.string().optional(),
  // "eventDate" from frontend → schema field "expectedDate"
  eventDate: z.string().optional(),
  expectedDate: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  // Quote-level discount / GST overrides (take precedence over per-item values)
  discountPct: z.number().min(0).max(100).optional(),
  gstPct: z.number().min(0).max(28).optional(),
  // Frontend sends these as "deliveryCharge" etc.; schema uses "deliveryCost"
  deliveryCharge: z.number().nonnegative().optional(),
  deliveryCost: z.number().nonnegative().optional(),
  packagingCharge: z.number().nonnegative().optional(),
  packagingCost: z.number().nonnegative().optional(),
  brandingCharge: z.number().nonnegative().optional(),
  brandingCost: z.number().nonnegative().optional(),
  items: z.array(quoteItemSchema).min(1),
});

// ─── GET /api/quotations ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "quotations")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const leadId = searchParams.get("leadId");

  const quotes = await prisma.quote.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(leadId && { leadId }),
    },
    include: {
      items: true,
      // Lead fields: companyName + contactPerson (Lead has no "clientName" or "company")
      lead: { select: { companyName: true, contactPerson: true } },
      createdBy: { select: { name: true } },
      // Quote model has NO approvedBy relation — omitted
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotes);
}

// ─── POST /api/quotations ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "quotations")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;

  // ── Resolve field aliases (frontend may send either name) ────────────────
  const companyName = d.clientCompany ?? d.companyName ?? null;
  const expectedDate = d.eventDate ?? d.expectedDate ?? null;
  const deliveryCost = d.deliveryCharge ?? d.deliveryCost ?? 0;
  const packagingCost = d.packagingCharge ?? d.packagingCost ?? 0;
  const brandingCost = d.brandingCharge ?? d.brandingCost ?? 0;

  // ── Per-item calculation ─────────────────────────────────────────────────
  // discount / gstRate are used for computation only; not stored on QuoteItem
  let rawSubtotal = 0;
  let totalDiscountAmt = 0;
  let totalGstAmt = 0;

  const itemsForCreate = d.items.map((item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount ?? 0;
    const itemGstRate = item.gstRate ?? 18;
    const discountAmt = lineSubtotal * (itemDiscount / 100);
    const afterDiscount = lineSubtotal - discountAmt;
    const gstAmt = afterDiscount * (itemGstRate / 100);
    const totalPrice = afterDiscount + gstAmt;

    rawSubtotal += lineSubtotal;
    totalDiscountAmt += discountAmt;
    totalGstAmt += gstAmt;

    // Only include columns that exist on QuoteItem in the schema
    return {
      productName: item.productName,
      description: item.description ?? null,
      sku: item.sku ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice,
      packagingType: item.packagingType ?? null,
      brandingNotes: item.brandingNotes ?? null,
    };
  });

  // ── Quote-level aggregates ───────────────────────────────────────────────
  // If caller supplied explicit quote-level discountPct/gstPct, recalculate
  let discountPct: number;
  let discountAmt: number;
  let gstPct: number;
  let gstAmt: number;

  if (d.discountPct !== undefined) {
    discountPct = d.discountPct;
    discountAmt = rawSubtotal * (discountPct / 100);
    gstPct = d.gstPct ?? 18;
    gstAmt = (rawSubtotal - discountAmt) * (gstPct / 100);
  } else {
    // Derive from per-item computation
    discountAmt = totalDiscountAmt;
    discountPct = rawSubtotal > 0 ? (discountAmt / rawSubtotal) * 100 : 0;
    gstAmt = totalGstAmt;
    const taxableAmount = rawSubtotal - discountAmt;
    gstPct = taxableAmount > 0 ? (gstAmt / taxableAmount) * 100 : 18;
  }

  const subtotal = rawSubtotal; // pre-discount
  const extras = deliveryCost + packagingCost + brandingCost;
  const totalAmount = subtotal - discountAmt + gstAmt + extras;

  // ── Approval gate ────────────────────────────────────────────────────────
  const maxItemDiscount = Math.max(...d.items.map((i) => i.discount ?? 0));
  const needsApproval =
    maxItemDiscount > 10 && !["ADMIN", "OWNER"].includes(session.user.role as string);

  // ── Persist ──────────────────────────────────────────────────────────────
  const quote = await prisma.quote.create({
    data: {
      quoteNumber: generateQuoteNumber(),
      leadId: d.leadId,
      clientName: d.clientName,
      companyName,                                  // schema field
      eventType: (d.eventType as any) ?? "OTHER",
      expectedDate: expectedDate ? new Date(expectedDate) : null,  // schema field
      validUntil: d.validUntil ? new Date(d.validUntil) : null,
      subtotal,
      discountPct,
      discountAmt,                                  // schema field (not "totalDiscount")
      gstPct,
      gstAmt,                                       // schema field (not "totalGst")
      packagingCost,                                // schema field (not "packagingCharge")
      brandingCost,                                 // schema field (not "brandingCharge")
      deliveryCost,                                 // schema field (not "deliveryCharge")
      totalAmount,                                  // schema field (not "grandTotal")
      notes: d.notes ?? null,
      terms: d.terms ?? null,
      status: needsApproval ? "PENDING_APPROVAL" : "DRAFT",
      createdById: session.user.id!,
      items: { create: itemsForCreate },
    },
    include: { items: true, lead: { select: { companyName: true, contactPerson: true } }, createdBy: { select: { name: true } } },
  });

  await createAuditLog({
    userId: session.user.id!,
    entity: "Quote",
    entityId: quote.id,
    action: "created",
  });

  return NextResponse.json(quote, { status: 201 });
}
