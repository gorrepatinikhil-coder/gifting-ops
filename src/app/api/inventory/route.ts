import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Creating new inventory items is restricted to store managers and above
  if (!["ADMIN", "OWNER", "CHEF_OPS", "STORE"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const item = await prisma.inventoryItem.create({
    data: {
      name: body.name,
      sku: body.sku || null,
      category: body.category,
      unit: body.unit,
      currentStock: parseFloat(body.currentStock) || 0,
      minStockLevel: parseFloat(body.minStockLevel) || 0,
      reorderPoint: parseFloat(body.reorderPoint) || 0,
      costPerUnit: parseFloat(body.costPerUnit) || 0,
      location: body.location || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
