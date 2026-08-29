import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, activeOrders, monthlyRevenue, pendingPayments, delayedOrders, totalLeads, wonLeads] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { paymentStatus: { in: ["PENDING", "PARTIAL"] } } }),
      prisma.order.count({
        where: { deliveryDate: { lt: now }, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "WON" } }),
    ]);

  return NextResponse.json({
    totalOrders,
    activeOrders,
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    pendingPayments,
    delayedOrders,
    totalLeads,
    conversionRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
  });
}
