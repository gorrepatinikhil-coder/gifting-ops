import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateChallanNumber } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

// ─── GET /api/dispatch  —  List dispatch records ──────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "dispatch")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const take = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const skip = parseInt(searchParams.get("offset") ?? "0", 10);

  const dispatches = await prisma.dispatch.findMany({
    where: {
      ...(orderId && { orderId }),
      ...(status && { status: status as any }),
    },
    include: {
      order: { select: { orderNumber: true, clientName: true, companyName: true, deliveryDate: true } },
      deliveryAddress: { select: { recipientName: true, city: true, state: true, phone: true } },
      dispatchedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json(dispatches);
}

// ─── POST /api/dispatch  —  Create a dispatch for an order ───────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["ADMIN", "OWNER", "CHEF_OPS", "DISPATCH"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!["QC_PASSED", "DISPATCHED"].includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot dispatch order in status: ${order.status}. Order must be QC_PASSED first.` },
      { status: 422 }
    );
  }

  // Auto-generate challan number if not provided
  const challanNumber = body.challanNumber ?? generateChallanNumber();

  const dispatch = await prisma.dispatch.create({
    data: {
      orderId: body.orderId,
      deliveryAddressId: body.deliveryAddressId ?? null,
      challanNumber,
      status: "OUT_FOR_DELIVERY",
      driverName: body.driverName ?? null,
      driverPhone: body.driverPhone ?? null,
      vehicleNumber: body.vehicleNumber ?? null,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
      dispatchedAt: new Date(),
      dispatchedById: session.user.id!,
    },
    include: {
      order: { select: { orderNumber: true, clientName: true } },
    },
  });

  // Advance order to DISPATCHED
  await prisma.order.update({
    where: { id: body.orderId },
    data: { status: "DISPATCHED" },
  });

  await createAuditLog({
    userId: session.user.id!,
    entity: "Dispatch",
    entityId: dispatch.id,
    action: "dispatched",
    orderId: body.orderId,
  });

  return NextResponse.json(dispatch, { status: 201 });
}
