import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { LeadsClient } from "./leads-client";
import type { Role } from "@prisma/client";

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "leads")) {
    return <AccessDenied role={role} pageName="Leads & Enquiries" />;
  }

  const [leads, salesUsers] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { quotes: true, orders: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SALES", "ADMIN", "OWNER"] }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <LeadsClient
      leads={leads as any}
      salesUsers={salesUsers}
      currentUser={{ id: session.user.id, name: session.user.name ?? "", role }}
    />
  );
}
