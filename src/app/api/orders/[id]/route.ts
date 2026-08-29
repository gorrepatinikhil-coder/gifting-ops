import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { notifyOrderDelayed } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "orders")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, companyName: true, contactPerson: true, phone: true, email: true } },
      quote: { select: { id: true, quoteNumber: true, totalAmount: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      items: true,
      deliveryAddresses: true,
      payments: {
        orderBy: { createdAt: "desc" },
        include: { verifiedBy: { select: { id: true, name: true } } },
      },
      productionBatches: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { scheduledDate: "asc" },
      },
      packingUnits: { orderBy: { unitNumber: "asc" } },
      qcLogs: {
        include: { inspectedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      dispatches: {
        include: { dispatchedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      invoices: { orderBy: { createdAt: "desc" } },
      feedback: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "orders")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Guard: modifying items after production starts needs ADMIN/OWNER
  if (
    ["IN_PRODUCTION", "PACKING", "QC_PENDING"].includes(existing.status) &&
    body.items &&
    !["ADMIN", "OWNER"].includes(session.user.role)
  ) {
    return NextResponse.json(
      { error: "Modifying order items after production starts requires Owner approval." },
      { status: 403 }
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...body,
      ...(body.deliveryDate && { deliveryDate: new Date(body.deliveryDate) }),
      ...(body.productionStartDate && { productionStartDate: new Date(body.productionStartDate) }),
      ...(body.productionDeadline && { productionDeadline: new Date(body.productionDeadline) }),
    },
  });

  // Notify if the order is now overdue
  if (
    body.status &&
    body.status !== existing.status &&
    new Date(order.deliveryDate) < new Date() &&
    !["DELIVERED", "CANCELLED"].includes(order.status)
  ) {
    await notifyOrderDelayed(order.id, order.orderNumber);
  }

  await createAuditLog({
    userId: session.user.id,
    entity: "Order",
    entityId: order.id,
    action: "updated",
    oldValues: { status: existing.status, paymentStatus: existing.paymentStatus },
    newValues: { status: order.status, ...body },
    orderId: order.id,
  });

  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only Admin or Owner can delete orders" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!["CONFIRMED", "ADVANCE_PENDING", "CANCELLED"].includes(order.status)) {
    return NextResponse.json({ error: "Only draft or cancelled orders can be deleted" }, { status: 400 });
  }

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
