import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyBalanceDue } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "dispatch")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const dispatch = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, orderNumber: true, clientName: true, deliveryDate: true } },
      deliveryAddress: true,
      dispatchedBy: { select: { id: true, name: true } },
    },
  });

  if (!dispatch) return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
  return NextResponse.json(dispatch);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "dispatch")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.dispatch.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });

  const dispatch = await prisma.dispatch.update({
    where: { id },
    data: {
      ...body,
      ...(body.podTimestamp && { podTimestamp: new Date(body.podTimestamp) }),
      ...(body.deliveredAt && { deliveredAt: new Date(body.deliveredAt) }),
      ...(body.estimatedDelivery && { estimatedDelivery: new Date(body.estimatedDelivery) }),
      ...(body.rescheduledTo && { rescheduledTo: new Date(body.rescheduledTo) }),
      // Auto-set deliveredAt when marking as DELIVERED
      ...(body.status === "DELIVERED" && !body.deliveredAt && { deliveredAt: new Date() }),
      ...(body.status === "DELIVERED" && !body.podTimestamp && { podTimestamp: new Date() }),
    },
  });

  // Mark order as DELIVERED when dispatch is delivered
  if (body.status === "DELIVERED") {
    const order = await prisma.order.update({
      where: { id: dispatch.orderId },
      data: { status: "DELIVERED" },
    });

    // Notify accounts if balance still outstanding
    if (order.balanceAmount > 0) {
      await notifyBalanceDue(order.id, order.orderNumber);
    }
  }

  await createAuditLog({
    userId: session.user.id,
    entity: "Dispatch",
    entityId: dispatch.id,
    action: `status updated to ${dispatch.status}`,
    oldValues: { status: existing.status },
    newValues: { status: dispatch.status },
    orderId: dispatch.orderId,
  });

  return NextResponse.json(dispatch);
}
