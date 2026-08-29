import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const txnSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const parsed = txnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, quantity, notes, referenceId, referenceType } = parsed.data;

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  const isIn = ["IN", "RETURN"].includes(type);
  const newStock = isIn ? item.currentStock + quantity : Math.max(0, item.currentStock - quantity);

  // Guard against negative stock for OUT transactions
  if (!isIn && item.currentStock < quantity) {
    return NextResponse.json(
      { error: `Insufficient stock. Available: ${item.currentStock} ${item.unit}` },
      { status: 400 }
    );
  }

  const [txn] = await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: id,
        type,
        quantity,
        balanceAfter: newStock,
        unit: item.unit,
        notes: notes ?? null,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
        performedById: session.user.id,
      },
    }),
    prisma.inventoryItem.update({
      where: { id },
      data: { currentStock: newStock },
    }),
  ]);

  return NextResponse.json(txn, { status: 201 });
}

// GET: history for an inventory item
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { inventoryItemId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { performedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(transactions);
}
