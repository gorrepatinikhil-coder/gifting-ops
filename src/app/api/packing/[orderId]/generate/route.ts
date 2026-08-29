import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ orderId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "packing")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await req.json();
  const quantity = Math.max(1, parseInt(body.quantity) || 1);

  // Ensure the order exists and is in a packable state
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { _count: { select: { packingUnits: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Delete existing units if regenerating
  if (order._count.packingUnits > 0) {
    await prisma.packingUnit.deleteMany({ where: { orderId } });
  }

  const units = await prisma.$transaction(
    Array.from({ length: quantity }, (_, i) =>
      prisma.packingUnit.create({
        data: {
          orderId,
          unitNumber: i + 1,
          status: "PENDING",
        },
      })
    )
  );

  // Advance order to PACKING
  await prisma.order.update({ where: { id: orderId }, data: { status: "PACKING" } });

  return NextResponse.json(units, { status: 201 });
}
