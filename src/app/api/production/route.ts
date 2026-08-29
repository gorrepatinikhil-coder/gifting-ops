import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBatchNumber } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "production")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const batches = await prisma.productionBatch.findMany({
    orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    include: {
      order: { select: { orderNumber: true, clientName: true, isRushOrder: true } },
      assignedTo: { select: { name: true } },
    },
  });
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "production")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const batch = await prisma.productionBatch.create({
    data: {
      batchNumber: generateBatchNumber(),
      orderId: body.orderId,
      productName: body.productName,
      quantity: parseInt(body.quantity),
      scheduledDate: new Date(body.scheduledDate),
      deadline: new Date(body.deadline),
      assignedToId: body.assignedToId ?? null,
      notes: body.notes ?? null,
      priority: body.priority ?? 0,
    },
  });
  return NextResponse.json(batch, { status: 201 });
}
