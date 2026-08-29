import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { PaymentsClient } from "./payments-client";
import type { Role } from "@prisma/client";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "payments")) {
    return <AccessDenied role={role} pageName="Payments" />;
  }

  const paymentsRaw = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true, clientName: true, lead: { select: { companyName: true } } } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });

  // Transform to match PaymentsClient expected shape
  const payments = paymentsRaw.map((p) => ({
    id: p.id,
    orderNumber: p.order.orderNumber,
    clientName: p.order.clientName,
    companyName: p.order.lead?.companyName ?? p.order.clientName,
    amount: p.amount,
    status: p.verifiedAt !== null ? "PAID" : "PENDING",
    type: p.type,
    dueDate: null,
    paidAt: p.verifiedAt,
    reference: p.transactionId,
    notes: p.notes,
    verifiedAt: p.verifiedAt,
    verifiedBy: p.verifiedBy,
  }));

  return (
    <PaymentsClient
      payments={payments as any}
      currentUser={{
        id: session.user.id!,
        name: session.user.name ?? "",
        role,
      }}
    />
  );
}
