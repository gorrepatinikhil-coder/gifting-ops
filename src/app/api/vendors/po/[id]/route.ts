import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyVendorLate } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import type { Role, VendorOrderStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  vendorNotes: z.string().optional(),
  delayReason: z.string().optional(),
  receivedDate: z.string().optional(),
  expectedDate: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "vendors")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const po = await prisma.vendorOrder.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, companyName: true, phone: true, email: true } },
      items: { include: { inventoryItem: { select: { id: true, name: true, sku: true, unit: true } } } },
    },
  });

  if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  return NextResponse.json(po);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "vendors")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { receivedDate, expectedDate, status, ...rest } = parsed.data;

  const po = await prisma.vendorOrder.update({
    where: { id },
    data: {
      ...rest,
      ...(status && { status: status as VendorOrderStatus }),
      ...(receivedDate && { receivedDate: new Date(receivedDate) }),
      ...(expectedDate && { expectedDate: new Date(expectedDate) }),
    },
    include: { vendor: { select: { name: true, companyName: true } } },
  });

  if (body.status === "DELAYED") {
    await notifyVendorLate(po.vendor.companyName ?? po.vendor.name, po.poNumber);
  }

  await createAuditLog({
    userId: session.user.id,
    entity: "VendorOrder",
    entityId: id,
    action: body.status ? `status → ${body.status}` : "updated",
    newValues: rest,
  });

  return NextResponse.json(po);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "STORE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const po = await prisma.vendorOrder.findUnique({ where: { id } });
  if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  if (["RECEIVED", "PARTIAL_RECEIVED"].includes(po.status)) {
    return NextResponse.json({ error: "Cannot delete a received purchase order" }, { status: 400 });
  }

  await prisma.vendorOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
