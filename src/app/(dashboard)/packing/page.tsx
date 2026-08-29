import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { PackingClient } from "./packing-client";
import type { Role } from "@prisma/client";

export default async function PackingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "packing")) {
    return <AccessDenied role={role} pageName="Packing" />;
  }

  // Orders in PACKING status with their items and existing packing units
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PACKING", "QC_PENDING"] } },
    orderBy: { deliveryDate: "asc" },
    include: {
      items: true,
      packingUnits: { orderBy: { unitNumber: "asc" } },
      deliveryAddresses: true,
    },
  });

  return (
    <PackingClient
      orders={orders as any}
      currentUser={{ role }}
    />
  );
}
