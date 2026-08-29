import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ACCOUNTS", "ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only Accounts team can verify payments" }, { status: 403 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.verifiedAt) {
    return NextResponse.json({ error: "Payment already verified" }, { status: 400 });
  }

  const verified = await prisma.payment.update({
    where: { id },
    data: { verifiedAt: new Date(), verifiedById: session.user.id },
  });

  await createAuditLog({
    userId: session.user.id,
    entity: "Payment",
    entityId: id,
    action: "verified",
    newValues: { verifiedAt: verified.verifiedAt },
    orderId: payment.orderId,
  });

  return NextResponse.json(verified);
}
