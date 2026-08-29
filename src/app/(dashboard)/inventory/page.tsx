import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { InventoryClient } from "./inventory-client";
import type { Role } from "@prisma/client";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "inventory")) {
    return <AccessDenied role={role} pageName="Store" />;
  }

  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { performedBy: { select: { id: true, name: true } } },
      },
    },
  });

  return <InventoryClient items={items as any} currentUser={{ role }} />;
}
