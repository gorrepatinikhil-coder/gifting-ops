import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  discountPct: z.coerce.number().min(0).max(100).optional(),
  reason: z.string().min(1).optional(),
  approvalNotes: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only Admin or Owner can approve/reject quotations" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { action, discountPct, reason, approvalNotes } = parsed.data;

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
  const approvalStatus = action === "approve" ? "APPROVED" : "REJECTED";

  const [approval, updatedQuote] = await prisma.$transaction([
    prisma.discountApproval.create({
      data: {
        quoteId: id,
        requestedBy: quote.createdById,
        approvedBy: action === "approve" ? session.user.id : null,
        discountPct: discountPct ?? quote.discountPct,
        reason: reason ?? "Approval request",
        approvalNotes: approvalNotes ?? null,
        revisedPct: action === "approve" ? (discountPct ?? quote.discountPct) : null,
        status: approvalStatus,
      },
    }),
    prisma.quote.update({
      where: { id },
      data: { status: newStatus },
    }),
  ]);

  await createAuditLog({
    userId: session.user.id,
    entity: "Quote",
    entityId: id,
    action: `discount ${action}d`,
    newValues: { status: newStatus, approvalId: approval.id },
    leadId: quote.leadId,
  });

  return NextResponse.json(updatedQuote);
}
