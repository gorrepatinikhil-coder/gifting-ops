import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { QCClient } from "./qc-client";
import type { Role } from "@prisma/client";

export default async function QCPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "qc")) {
    return <AccessDenied role={role} pageName="QC Inspection" />;
  }

  const [orders, recentLogs] = await Promise.all([
    // Orders in QC stages with their packing units and existing QC logs
    prisma.order.findMany({
      where: { status: { in: ["QC_PENDING", "QC_PASSED"] } },
      orderBy: { deliveryDate: "asc" },
      include: {
        packingUnits: {
          orderBy: { unitNumber: "asc" },
          include: {
            qcLogs: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { inspectedBy: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    // Recent QC activity log across all orders
    prisma.qCLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        order: { select: { id: true, orderNumber: true, clientName: true } },
        packingUnit: { select: { unitNumber: true } },
        inspectedBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <QCClient
      orders={orders as any}
      recentLogs={recentLogs as any}
      currentUser={{ id: session.user.id ?? "", name: session.user.name ?? "", role }}
    />
  );
}
