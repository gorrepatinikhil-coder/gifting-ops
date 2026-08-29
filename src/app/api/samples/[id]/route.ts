import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import type { Role, SampleStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.string().optional(),
  clientFeedback: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  kitchenNotes: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "samples")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const sample = await prisma.sample.findUnique({
    where: { id },
    include: {
      items: true,
      requestedBy: { select: { id: true, name: true } },
      lead: { select: { id: true, companyName: true, contactPerson: true } },
    },
  });

  if (!sample) return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  return NextResponse.json(sample);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "samples")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.sample.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Sample not found" }, { status: 404 });

  const { status, ...restData } = parsed.data;
  const sample = await prisma.sample.update({
    where: { id },
    data: {
      ...restData,
      ...(status && { status: status as SampleStatus }),
      ...(status === "DELIVERED" && !existing.deliveredAt && { deliveredAt: new Date() }),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    entity: "Sample",
    entityId: id,
    action: "updated",
    oldValues: { status: existing.status },
    newValues: { status: sample.status },
  });

  return NextResponse.json(sample);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.sample.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
