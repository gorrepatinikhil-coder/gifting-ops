import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { VendorsClient } from "./vendors-client";
import type { Role } from "@prisma/client";

export default async function VendorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "vendors")) {
    return <AccessDenied role={role} pageName="Vendors & Procurement" />;
  }

  const [vendors, pendingPOs] = await Promise.all([
    prisma.vendor.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { purchaseOrders: true } },
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            poNumber: true,
            status: true,
            expectedDate: true,
            totalAmount: true,
          },
        },
      },
    }),
    prisma.vendorOrder.findMany({
      where: { status: { notIn: ["RECEIVED", "CANCELLED"] } },
      orderBy: { expectedDate: "asc" },
      include: {
        vendor: { select: { name: true } },
        items: { select: { itemName: true, quantity: true, unit: true } },
      },
    }),
  ]);

  return (
    <VendorsClient
      vendors={vendors as any}
      pendingPOs={pendingPOs as any}
      currentUser={{ role }}
    />
  );
}
