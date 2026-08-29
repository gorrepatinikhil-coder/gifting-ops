import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { ProductionClient } from "./production-client";
import type { Role } from "@prisma/client";

export default async function ProductionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "production")) {
    return <AccessDenied role={role} pageName="Kitchen & Assembly" />;
  }

  const [activeBatches, completedBatches, productionUsers] = await Promise.all([
    prisma.productionBatch.findMany({
      where: { status: { notIn: ["COMPLETED"] } },
      orderBy: [{ deadline: "asc" }, { priority: "desc" }],
      include: {
        assignedTo: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true, clientName: true, deliveryDate: true } },
        ingredients: {
          include: {
            inventoryItem: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
          },
        },
      },
    }),
    prisma.productionBatch.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        assignedTo: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true, clientName: true, deliveryDate: true } },
        ingredients: {
          include: {
            inventoryItem: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["CHEF_OPS", "PRODUCTION", "ADMIN"] }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProductionClient
      batches={[...activeBatches, ...completedBatches] as any}
      productionUsers={productionUsers}
      currentUser={{ role }}
    />
  );
}
