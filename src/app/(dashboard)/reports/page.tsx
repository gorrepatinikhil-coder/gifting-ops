import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { ReportsClient } from "./reports-client";
import type { Role } from "@prisma/client";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS: Record<string, string> = {
  ADVANCE_PENDING: "#f59e0b", CONFIRMED: "#3b82f6", IN_PRODUCTION: "#8b5cf6",
  PACKING: "#f97316", QC_PENDING: "#eab308", QC_PASSED: "#10b981",
  DISPATCHED: "#06b6d4", DELIVERED: "#22c55e",
};
const STATUS_LABELS: Record<string, string> = {
  ADVANCE_PENDING: "Advance Pending", CONFIRMED: "Confirmed", IN_PRODUCTION: "In Production",
  PACKING: "Packing", QC_PENDING: "QC Pending", QC_PASSED: "QC Passed",
  DISPATCHED: "Dispatched", DELIVERED: "Delivered",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "reports")) {
    return <AccessDenied role={role} pageName="Reports & MIS" />;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    allOrders,
    activeOrdersCount,
    pendingQCCount,
    pendingDispatchCount,
    pendingPaymentsAgg,
    monthlyRevenueAgg,
    prevMonthRevenueAgg,
    totalLeadsCount,
    wonLeadsCount,
    inventoryItems,
    orderStatusCounts,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: sixMonthsAgo } },
      select: { totalAmount: true, createdAt: true, clientName: true, lead: { select: { companyName: true } } },
    }),
    prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.order.count({ where: { status: "QC_PENDING" } }),
    prisma.order.count({ where: { status: "QC_PASSED" } }),
    prisma.order.aggregate({
      where: { paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
      _sum: { balanceAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: prevMonthStart, lt: monthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.inventoryItem.findMany({ select: { currentStock: true, minStockLevel: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, where: { status: { notIn: ["CANCELLED"] } } }),
  ]);

  // ── Build monthly revenue + orders + leads chart data ──────────────────────
  const monthlyMap: Record<string, { label: string; revenue: number; orders: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap[key] = { label: MONTH_NAMES[d.getMonth()], revenue: 0, orders: 0 };
  }
  for (const o of allOrders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += o.totalAmount;
      monthlyMap[key].orders += 1;
    }
  }
  const monthlyData = Object.values(monthlyMap).map(({ label, revenue, orders }) => ({
    month: label,
    revenue,
    orders,
    leads: 0, // Would need a separate query; zero-fill is acceptable for now
  }));

  // ── Top clients by revenue ─────────────────────────────────────────────────
  const clientRevMap: Record<string, number> = {};
  for (const o of allOrders) {
    const name = o.lead?.companyName ?? o.clientName;
    clientRevMap[name] = (clientRevMap[name] ?? 0) + o.totalAmount;
  }
  const topClients = Object.entries(clientRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, revenue]) => ({ name, revenue }));

  // ── Order stage pie ────────────────────────────────────────────────────────
  const orderStages = orderStatusCounts
    .filter((s) => s._count._all > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s._count._all,
      color: STATUS_COLORS[s.status] ?? "#6b7280",
    }));

  // ── Conversion funnel ──────────────────────────────────────────────────────
  const conversionData = [
    { name: "Total Leads", value: totalLeadsCount, color: "#3b82f6" },
    { name: "Won", value: wonLeadsCount, color: "#10b981" },
    { name: "Lost", value: totalLeadsCount - wonLeadsCount, color: "#ef4444" },
  ];

  const pendingAmount = pendingPaymentsAgg._sum.balanceAmount ?? 0;
  const monthlyRevenue = monthlyRevenueAgg._sum.totalAmount ?? 0;
  const prevMonthRevenue = prevMonthRevenueAgg._sum.totalAmount ?? 0;
  const revenueGrowth =
    prevMonthRevenue > 0
      ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;
  const inventoryAlerts = inventoryItems.filter((i) => i.currentStock <= i.minStockLevel).length;
  const conversionRate =
    totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

  const stats = {
    totalOrders: allOrders.length,
    activeOrders: activeOrdersCount,
    monthlyRevenue,
    revenueGrowth,
    pendingPayments: pendingPaymentsAgg._count,
    pendingAmount,
    totalLeads: totalLeadsCount,
    wonLeads: wonLeadsCount,
    conversionRate,
    pendingQC: pendingQCCount,
    pendingDispatch: pendingDispatchCount,
    inventoryAlerts,
  };

  return (
    <ReportsClient
      monthlyData={monthlyData}
      topClients={topClients}
      orderStages={orderStages as any}
      conversionData={conversionData}
      stats={stats as any}
    />
  );
}
