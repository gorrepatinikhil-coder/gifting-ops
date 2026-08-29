import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const createLeadSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  requirementType: z.string().optional(),
  eventType: z.string().optional(),
  expectedQty: z.coerce.number().optional(),
  budget: z.coerce.number().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "leads")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId");

  const leads = await prisma.lead.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(assignedToId && { assignedToId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { quotes: true, orders: true } },
    },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "leads")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, eventType, ...rest } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...rest,
      email: email || null,
      eventType: (eventType as never) ?? "OTHER",
      createdById: session.user.id,
      assignedToId: parsed.data.assignedToId || session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entity: "Lead",
    entityId: lead.id,
    action: "created",
    newValues: { companyName: lead.companyName, status: lead.status },
    leadId: lead.id,
  });

  return NextResponse.json(lead, { status: 201 });
}
