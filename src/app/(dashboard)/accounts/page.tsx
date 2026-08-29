import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { AccountsClient } from "./accounts-client";
import type { Role } from "@prisma/client";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "accounts")) {
    return <AccessDenied role={role} pageName="Accounts & Billing" />;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [ordersRaw, paymentsRaw, invoices, monthlyRevenueAgg] = await Promise.all([
    // Orders with payment breakdown
    prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: { deliveryDate: "asc" },
      include: {
        lead: { select: { companyName: true } },
        payments: {
          select: { id: true, amount: true, type: true, verifiedAt: true, createdAt: true },
        },
      },
    }),
    // Recent payment records
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        order: { select: { orderNumber: true, clientName: true } },
        verifiedBy: { select: { name: true } },
      },
    }),
    // Invoices
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        order: { select: { orderNumber: true, clientName: true } },
      },
    }),
    // Monthly revenue
    prisma.order.aggregate({
      where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
  ]);

  // Compute balance and advance amounts per order
  const orders = ordersRaw.map((o) => {
    const paidAmt = o.payments
      .filter((p) => p.verifiedAt !== null)
      .reduce((s, p) => s + p.amount, 0);
    const advanceAmt = o.payments
      .filter((p) => p.type === "ADVANCE" && p.verifiedAt !== null)
      .reduce((s, p) => s + p.amount, 0);
    const balanceAmt = Math.max(0, o.totalAmount - paidAmt);
    return {
      ...o,
      advanceAmount: advanceAmt,
      balanceAmount: balanceAmt,
      paymentStatus: balanceAmt <= 0 ? "PAID" : paidAmt > 0 ? "PARTIAL" : "PENDING",
    };
  });

  const totalPending = orders.reduce((s, o) => s + o.balanceAmount, 0);
  const monthlyRevenue = monthlyRevenueAgg._sum.totalAmount ?? 0;

  // Transform payments to match AccountsClient shape
  const payments = paymentsRaw.map((p) => ({
    id: p.id,
    amount: p.amount,
    type: p.type,
    createdAt: p.createdAt,
    transactionId: p.transactionId,
    verifiedAt: p.verifiedAt,
    order: p.order,
    verifiedBy: p.verifiedBy,
  }));

  return (
    <AccountsClient
      orders={orders as any}
      payments={payments as any}
      invoices={invoices as any}
      monthlyRevenue={monthlyRevenue}
      totalPending={totalPending}
      currentUser={{ id: session.user.id!, name: session.user.name ?? "", role } as any}
    />
  );
}
