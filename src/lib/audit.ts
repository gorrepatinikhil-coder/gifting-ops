import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface AuditParams {
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  orderId?: string;
  leadId?: string;
}

export async function createAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      oldValues: (params.oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
      newValues: (params.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
      orderId: params.orderId,
      leadId: params.leadId,
    },
  });
}
