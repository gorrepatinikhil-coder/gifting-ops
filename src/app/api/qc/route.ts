import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyQCFail } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "qc")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { orderId, packingUnitId, result, ...checks } = body;

  const qcLog = await prisma.qCLog.create({
    data: {
      orderId,
      packingUnitId: packingUnitId ?? null,
      result,
      productQuality: checks.productQuality ?? true,
      appearance: checks.appearance ?? true,
      branding: checks.branding ?? true,
      quantityCorrect: checks.quantityCorrect ?? true,
      sealed: checks.sealed ?? true,
      labelCorrect: checks.labelCorrect ?? true,
      failureReason: checks.failureReason ?? null,
      actionTaken: checks.actionTaken ?? null,
      inspectedById: session.user.id,
    },
  });

  // Update packing unit status
  if (packingUnitId) {
    await prisma.packingUnit.update({
      where: { id: packingUnitId },
      data: {
        status: result === "PASS" ? "APPROVED" : "REJECTED",
      },
    });
  }

  // Route failures
  if (result !== "PASS") {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      const newStatus = result === "FAIL_PACKING" ? "PACKING" : "IN_PRODUCTION";
      await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
      await notifyQCFail(orderId, order.orderNumber);
    }
  } else {
    // Check if all units passed — update order to QC_PASSED
    const allUnits = await prisma.packingUnit.findMany({ where: { orderId } });
    const allPassed = allUnits.every((u) => u.status === "APPROVED");
    if (allPassed && allUnits.length > 0) {
      await prisma.order.update({ where: { id: orderId }, data: { status: "QC_PASSED" } });
    }
  }

  await createAuditLog({
    userId: session.user.id,
    entity: "QCLog",
    entityId: qcLog.id,
    action: `QC ${result}`,
    orderId,
  });

  return NextResponse.json(qcLog, { status: 201 });
}
