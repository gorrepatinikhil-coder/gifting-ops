import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "production")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const batch = await prisma.productionBatch.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      order: { select: { id: true, orderNumber: true, clientName: true, deliveryDate: true } },
      ingredients: {
        include: {
          inventoryItem: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
        },
      },
    },
  });

  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  return NextResponse.json(batch);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "production")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.productionBatch.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  const batch = await prisma.productionBatch.update({
    where: { id },
    data: {
      ...body,
      ...(body.status === "COMPLETED" && !existing.completedAt && { completedAt: new Date() }),
      ...(body.scheduledDate && { scheduledDate: new Date(body.scheduledDate) }),
      ...(body.deadline && { deadline: new Date(body.deadline) }),
    },
  });

  // If batch completed, check if all batches for the order are done → move order to PACKING
  if (body.status === "COMPLETED") {
    const allBatches = await prisma.productionBatch.findMany({ where: { orderId: batch.orderId } });
    const allDone = allBatches.every((b) => b.status === "COMPLETED");
    if (allDone) {
      await prisma.order.update({ where: { id: batch.orderId }, data: { status: "PACKING" } });
    }
  }

  await createAuditLog({
    userId: session.user.id,
    entity: "ProductionBatch",
    entityId: batch.id,
    action: "updated",
    oldValues: { status: existing.status },
    newValues: { status: batch.status },
    orderId: batch.orderId,
  });

  return NextResponse.json(batch);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "CHEF_OPS"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.productionBatch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
