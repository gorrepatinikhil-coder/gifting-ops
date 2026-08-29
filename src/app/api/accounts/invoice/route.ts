import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateInvoiceNumber } from "@/lib/utils";

// ─── POST /api/accounts/invoice  —  Generate an invoice for an order ─────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "ACCOUNTS"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { orderId, dueDate, notes } = body;

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  // Fetch order — include payments to compute paid/balance amounts
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { select: { amount: true, verifiedAt: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Guard against duplicate invoices
  const existing = await prisma.invoice.findFirst({ where: { orderId } });
  if (existing) {
    return NextResponse.json(
      { error: "Invoice already exists for this order", invoiceId: existing.id },
      { status: 409 }
    );
  }

  // Compute payment totals from payment records
  // "Verified" payments are those with a non-null verifiedAt
  const paidAmt = order.payments
    .filter((p) => p.verifiedAt !== null)
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceAmt = Math.max(0, order.totalAmount - paidAmt);
  const invoiceStatus =
    balanceAmt <= 0 ? "PAID" : paidAmt > 0 ? "PARTIAL" : "PENDING";

  // Derive subtotal from totalAmount - gstAmount (stored on Order as gstAmount)
  const subtotal = order.totalAmount - order.gstAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      orderId,
      clientName: order.clientName,
      companyName: order.companyName ?? null,
      subtotal,
      gstPct: 18,
      gstAmt: order.gstAmount,
      totalAmount: order.totalAmount,
      paidAmount: paidAmt,
      balanceAmount: balanceAmt,
      status: invoiceStatus as any,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
      // Invoice model has no generatedById field — omitted
    },
    include: {
      order: { select: { orderNumber: true, clientName: true, status: true } },
    },
  });

  await createAuditLog({
    userId: session.user.id!,
    entity: "Invoice",
    entityId: invoice.id,
    action: "generated",
    orderId,
  });

  return NextResponse.json(invoice, { status: 201 });
}

// ─── GET /api/accounts/invoice  —  List all invoices ─────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "ACCOUNTS"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status && { status: status as any }),
    },
    include: {
      // Invoice model has no generatedBy relation — only include order info
      order: { select: { orderNumber: true, clientName: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}
