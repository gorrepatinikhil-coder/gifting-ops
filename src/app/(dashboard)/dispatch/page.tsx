import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { DispatchClient } from "./dispatch-client";
import type { Role } from "@prisma/client";

export default async function DispatchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "dispatch")) {
    return <AccessDenied role={role} pageName="Dispatch & Delivery" />;
  }

  // Orders that are QC_PASSED, DISPATCHED, or recently DELIVERED
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["QC_PASSED", "DISPATCHED", "DELIVERED"] },
    },
    orderBy: { deliveryDate: "asc" },
    include: {
      deliveryAddresses: true,
      dispatches: {
        orderBy: { createdAt: "desc" },
        include: { dispatchedBy: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <DispatchClient
      orders={orders as any}
      currentUser={{ role }}
    />
  );
}
