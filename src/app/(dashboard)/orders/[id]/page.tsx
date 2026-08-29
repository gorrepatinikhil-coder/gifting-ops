import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./order-detail-client";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      lead: { select: { companyName: true, contactPerson: true, phone: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      items: true,
      deliveryAddresses: true,
      payments: {
        include: { verifiedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      productionBatches: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      packingUnits: { orderBy: { unitNumber: "asc" } },
      qcLogs: {
        include: { inspectedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      dispatches: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  // Compute payment-derived fields
  const paidPayments = order.payments.filter((p) => p.verifiedAt !== null);
  const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);
  const advanceAmount = paidPayments
    .filter((p) => p.type === "ADVANCE")
    .reduce((s, p) => s + p.amount, 0);
  const balanceAmount = Math.max(0, order.totalAmount - totalPaid);
  const paymentStatus =
    balanceAmount <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "PENDING";

  const enrichedOrder = {
    ...order,
    paymentStatus,
    advanceAmount,
    paidAmount: totalPaid,
    balanceAmount,
    clientPhone: order.lead?.phone ?? null,
    clientEmail: null,
    clientCompany: order.lead?.companyName ?? null,
    items: order.items.map((i) => ({
      ...i,
      packaging: (i as any).packagingType ?? null,
      branding: (i as any).brandingNotes ?? null,
    })),
    dispatches: order.dispatches.map((d) => ({
      ...d,
      dispatchedAt: d.createdAt,
    })),
    packingUnits: order.packingUnits.map((u) => ({
      ...u,
      packedAt: u.updatedAt,
    })),
    auditLogs: [], // fetched separately if needed
  };

  return (
    <OrderDetailClient
      order={enrichedOrder as any}
      currentUser={{
        id: session.user.id!,
        name: session.user.name ?? "",
        role: session.user.role as string,
      }}
    />
  );
}
