import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, DISCOUNT_THRESHOLD, canApproveDiscount } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "quotations")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: true,
      lead: { select: { id: true, companyName: true, contactPerson: true, phone: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      discountApprovals: {
        include: { requester: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, ...rest } = body;

  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  // Only ADMIN/OWNER can approve quotes
  if (status === "APPROVED" && !["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only Admin or Owner can approve quotations" }, { status: 403 });
  }

  // Re-apply the same discount threshold gate as POST: if discountPct is being updated,
  // check it against the role's threshold and force PENDING_APPROVAL if it exceeds it.
  let resolvedStatus = status;
  if (rest.discountPct !== undefined) {
    const role = session.user.role as Role;
    const threshold = DISCOUNT_THRESHOLD[role] ?? 0;
    if (!canApproveDiscount(role) && rest.discountPct > threshold) {
      resolvedStatus = "PENDING_APPROVAL";
    }
  }

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      ...rest,
      ...(resolvedStatus && { status: resolvedStatus }),
      ...(rest.validUntil && { validUntil: new Date(rest.validUntil) }),
      ...(rest.expectedDate && { expectedDate: new Date(rest.expectedDate) }),
    },
    include: { items: true },
  });

  await createAuditLog({
    userId: session.user.id,
    entity: "Quote",
    entityId: quote.id,
    action: resolvedStatus ? `status → ${resolvedStatus}` : "updated",
    oldValues: { status: existing.status },
    newValues: { status: quote.status },
    leadId: quote.leadId,
  });

  return NextResponse.json(quote);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (["APPROVED", "CONVERTED"].includes(quote.status)) {
    return NextResponse.json({ error: "Cannot delete an approved or converted quotation" }, { status: 400 });
  }

  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
