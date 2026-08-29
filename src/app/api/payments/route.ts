import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { notifyBalanceDue } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

// ─── GET /api/payments  —  List payment records ───────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "payments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const verified = searchParams.get("verified"); // "true" | "false"
  const take = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const skip = parseInt(searchParams.get("offset") ?? "0", 10);

  const payments = await prisma.payment.findMany({
    where: {
      ...(orderId && { orderId }),
      // "verified" = has a non-null verifiedAt timestamp
      ...(verified === "true" && { verifiedAt: { not: null } }),
      ...(verified === "false" && { verifiedAt: null }),
    },
    include: {
      order: { select: { orderNumber: true, clientName: true, companyName: true } },
      verifiedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json(payments);
}

// ─── POST /api/payments  —  Record a payment against an order ────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "payments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.orderId || !body.amount) {
    return NextResponse.json(
      { error: "orderId and amount are required" },
      { status: 400 }
    );
  }

  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      orderId: body.orderId,
      type: body.type ?? "BALANCE",
      amount,
      transactionId: body.transactionId ?? null,
      screenshotUrl: body.screenshotUrl ?? null,
      notes: body.notes ?? null,
    },
  });

  // Recalculate totals from all payments on this order
  // Use verifiedAt to determine which are "paid" (consistent with invoice route)
  const allPayments = await prisma.payment.findMany({
    where: { orderId: body.orderId },
    select: { amount: true, verifiedAt: true },
  });

  const totalPaid = allPayments
    .filter((p) => p.verifiedAt !== null)
    .reduce((s, p) => s + p.amount, 0);

  const balance = Math.max(0, order.totalAmount - totalPaid);
  const paymentStatus =
    balance <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "PENDING";

  await prisma.order.update({
    where: { id: body.orderId },
    data: {
      balanceAmount: balance,
      advanceAmount: totalPaid,
      paymentStatus: paymentStatus as any,
    },
  });

  await createAuditLog({
    userId: session.user.id!,
    entity: "Payment",
    entityId: payment.id,
    action: "recorded",
    orderId: body.orderId,
  });

  // Notify if balance still due after delivery
  if (order.status === "DELIVERED" && balance > 0) {
    await notifyBalanceDue(order.id, order.orderNumber);
  }

  return NextResponse.json(payment, { status: 201 });
}
