import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "packing")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const unit = await prisma.packingUnit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Packing unit not found" }, { status: 404 });

  const updated = await prisma.packingUnit.update({
    where: { id },
    data: {
      ...body,
      ...(body.status === "PACKED" && !unit.packedAt && { packedAt: new Date() }),
    },
  });

  // If all units for the order are PACKED → advance to QC_PENDING
  if (body.status === "PACKED") {
    const [total, packed] = await Promise.all([
      prisma.packingUnit.count({ where: { orderId: unit.orderId } }),
      prisma.packingUnit.count({ where: { orderId: unit.orderId, status: { in: ["PACKED", "APPROVED"] } } }),
    ]);
    if (total > 0 && total === packed) {
      await prisma.order.update({ where: { id: unit.orderId }, data: { status: "QC_PENDING" } });
    }
  }

  return NextResponse.json(updated);
}
