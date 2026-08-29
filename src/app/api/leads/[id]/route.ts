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
  if (!hasPermission(session.user.role as Role, "leads")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      quotes: { orderBy: { createdAt: "desc" }, select: { id: true, quoteNumber: true, status: true, totalAmount: true } },
      orders: { orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, status: true, totalAmount: true } },
      samples: { orderBy: { createdAt: "desc" }, select: { id: true, clientName: true, status: true, rating: true } },
      _count: { select: { quotes: true, orders: true, samples: true } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "leads")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...body,
      ...(body.nextFollowUp && { nextFollowUp: new Date(body.nextFollowUp) }),
      email: body.email || null,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entity: "Lead",
    entityId: lead.id,
    action: "updated",
    oldValues: { status: existing.status },
    newValues: { status: lead.status },
    leadId: lead.id,
  });

  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only Admin or Owner can delete leads" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
