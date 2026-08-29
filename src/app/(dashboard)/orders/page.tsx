import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { OrdersClient } from "./orders-client";
import type { Role } from "@prisma/client";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "orders")) {
    return <AccessDenied role={role} pageName="Orders" />;
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { companyName: true, contactPerson: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { items: true, payments: true } },
    },
  });

  return (
    <OrdersClient
      orders={orders as any}
      currentUser={{ id: session.user.id, name: session.user.name ?? "", role }}
    />
  );
}
