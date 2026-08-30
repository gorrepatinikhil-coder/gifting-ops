import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SalesDashboard } from "@/components/dashboard/sales-dashboard";
import { AccountsDashboard } from "@/components/dashboard/accounts-dashboard";
import { OpsDashboard } from "@/components/dashboard/ops-dashboard";
import { DashboardClient } from "./dashboard-client";
import type { Role } from "@prisma/client";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS: Record<string, string> = {
  ADVANCE_PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PRODUCTION: "#8b5cf6",
  PACKING: "#f97316",
  QC_PENDING: "#eab308",
  QC_PASSED: "#10b981",
  DISPATCHED: "#06b6d4",
  DELIVERED: "#22c55e",
};
const STATUS_LABELS: Record<string, string> = {
  ADVANCE_PENDING: "Advance Pending",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "In Production",
  PACKING: "Packing",
  QC_PENDING: "QC Pending",
  QC_PASSED: "QC Passed",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
};

function getNextSeason(now: Date): { name: string; days: number } {
  const y = now.getFullYear();
  const upcoming = [
    { name: "Raksha Bandhan", date: new Date(y, 7, 9) },
    { name: "Ganesh Chaturthi", date: new Date(y, 8, 18) },
    { name: "Navratri", date: new Date(y, 9, 2) },
    { name: "Diwali", date: new Date(y, 10, 20) },
    { name: "Christmas", date: new Date(y, 11, 25) },
    { name: "New Year", date: new Date(y + 1, 0, 1) },
    { name: "Valentine's Day", date: new Date(y + 1, 1, 14) },
    { name: "Holi", date: new Date(y + 1, 2, 10) },
  ];
  for (const s of upcoming) {
    const diff = Math.ceil((s.date.getTime() - now.getTime()) / 86400000);
    if (diff > 0) return { name: s.name, days: diff };
  }
  return { name: "Diwali", days: 365 };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  const userName = session.user.name ?? "User";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  // ── SALES dashboard ────────────────────────────────────────────────────────
  if (role === "SALES") {
    const [
      leads,
      recentOrders,
      activeOrdersCount,
      pendingPaymentsAgg,
      monthlyRevenueAgg,
      totalLeadsCount,
      wonLeadsCount,
    ] = await Promise.all([
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          clientName: true,
          companyName: true,
          status: true,
          budget: true,
          requirementType: true,
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { lead: { select: { companyName: true } } },
      }),
      prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
      prisma.order.aggregate({
        where: { paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        _sum: { balanceAmount: true },
      }),
      prisma.order.aggregate({
        where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "WON" } }),
    ]);

    const conversionRate =
      totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

    return (
      <SalesDashboard
        data={{
          userName,
          stats: {
            totalLeads: totalLeadsCount,
            activeOrders: activeOrdersCount,
            conversionRate,
            pendingPayments: pendingPaymentsAgg._sum.balanceAmount ?? 0,
            monthlyRevenue: monthlyRevenueAgg._sum.totalAmount ?? 0,
          },
          recentOrders: recentOrders as any,
          leads: leads.map((l) => ({
            id: l.id,
            clientName: l.clientName,
            companyName: l.companyName,
            status: l.status,
            estimatedValue: l.budget ? Number(l.budget) : 0,
            requirement: l.requirementType ?? undefined,
          })),
        }}
      />
    );
  }

  // ── ACCOUNTS dashboard ─────────────────────────────────────────────────────
  if (role === "ACCOUNTS") {
    const [
      payments,
      recentOrders,
      activeOrdersCount,
      monthlyRevenueAgg,
      pendingPaymentsAgg,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        take: 20,
        include: {
          order: { select: { orderNumber: true, clientName: true } },
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          clientName: true,
          totalAmount: true,
          status: true,
        },
      }),
      prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
      prisma.order.aggregate({
        where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        _sum: { balanceAmount: true },
      }),
    ]);

    const transformedPayments = payments.map((p) => ({
      id: p.id,
      orderNumber: p.order.orderNumber,
      clientName: p.order.clientName,
      companyName: p.order.clientName,
      amount: p.balanceAmount,
      status: p.status,
      dueDate: p.dueDate,
      paidAt: null,
      type: "BALANCE" as const,
    }));

    return (
      <AccountsDashboard
        data={{
          userName,
          stats: {
            monthlyRevenue: monthlyRevenueAgg._sum.totalAmount ?? 0,
            pendingPayments: pendingPaymentsAgg._sum.balanceAmount ?? 0,
            activeOrders: activeOrdersCount,
          },
          payments: transformedPayments as any,
          recentOrders: recentOrders as any,
        }}
      />
    );
  }

  // ── OPS dashboards (CHEF_OPS / PRODUCTION / PACKING / QC / DISPATCH) ──────
  const OPS_ROLES: Role[] = ["CHEF_OPS", "PRODUCTION", "PACKING", "QC", "DISPATCH"];
  if (OPS_ROLES.includes(role)) {
    const [
      recentOrders,
      activeOrdersCount,
      pendingQCCount,
      pendingDispatchCount,
      inventoryItems,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
        orderBy: { deliveryDate: "asc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          clientName: true,
          status: true,
          deliveryDate: true,
          totalAmount: true,
          isRushOrder: true,
        },
      }),
      prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
      prisma.order.count({ where: { status: "QC_PENDING" } }),
      prisma.order.count({ where: { status: "QC_PASSED" } }),
      prisma.inventoryItem.findMany({
        select: { currentStock: true, minStockLevel: true },
      }),
    ]);

    const inventoryAlertsCount = inventoryItems.filter(
      (i) => i.currentStock <= i.minStockLevel
    ).length;

    return (
      <OpsDashboard
        data={{
          userName,
          role,
          stats: {
            activeOrders: activeOrdersCount,
            pendingQC: pendingQCCount,
            pendingDispatch: pendingDispatchCount,
            inventoryAlerts: inventoryAlertsCount,
          },
          recentOrders: recentOrders as any,
        }}
      />
    );
  }

  // ── ADMIN / OWNER: full operations dashboard ───────────────────────────────

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const ninetyDaysOut = new Date(now.getTime() + 90 * 86400000);

  const [
    activeOrdersCount,
    totalOrdersCount,
    pendingQCCount,
    pendingDispatchCount,
    rushOrdersCount,
    monthlyRevenueAgg,
    prevMonthRevenueAgg,
    pendingPaymentsCount,
    pendingPaymentsAgg,
    avgOrderAgg,
    overduePaymentsAgg,
    totalLeadsCount,
    wonLeadsCount,
    followUpsDueTodayCount,
    inventoryItems,
    activeBatchesCount,
    hamsersInProdAgg,
    todayPackedUnits,
    todayQCPassedCount,
    todayQCFailedCount,
    todayDispatchesCount,
    recentOrders,
    revenueOrders,
    orderStatusCounts,
    upcomingOrdersRaw,
    overdueOrdersRaw,
    lowStockItemsRaw,
    nextSeasonOrdersAgg,
    nextSeasonLeads,
  ] = await Promise.all([
    // ── Order counts ────────────────────────────────────────────────────────
    prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "QC_PENDING" } }),
    prisma.order.count({ where: { status: "QC_PASSED" } }),
    prisma.order.count({
      where: { isRushOrder: true, status: { notIn: ["DELIVERED", "CANCELLED"] } },
    }),

    // ── Financials ──────────────────────────────────────────────────────────
    prisma.order.aggregate({
      where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { notIn: ["CANCELLED"] },
        createdAt: { gte: prevMonthStart, lt: monthStart },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
      _sum: { balanceAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: { notIn: ["CANCELLED"] } },
      _avg: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "OVERDUE" },
      _sum: { balanceAmount: true },
    }),

    // ── Leads ───────────────────────────────────────────────────────────────
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { nextFollowUp: { lte: todayEnd } } }),

    // ── Inventory ───────────────────────────────────────────────────────────
    prisma.inventoryItem.findMany({
      select: { currentStock: true, minStockLevel: true },
    }),

    // ── Production ──────────────────────────────────────────────────────────
    prisma.productionBatch.count({ where: { status: { not: "COMPLETED" } } }),
    prisma.orderItem.aggregate({
      where: { order: { status: "IN_PRODUCTION" } },
      _sum: { quantity: true },
    }),

    // ── Today floor ─────────────────────────────────────────────────────────
    prisma.packingUnit.count({
      where: { status: { not: "PENDING" }, updatedAt: { gte: todayStart } },
    }),
    prisma.qCLog.count({ where: { result: "PASS", createdAt: { gte: todayStart } } }),
    prisma.qCLog.count({ where: { result: { not: "PASS" }, createdAt: { gte: todayStart } } }),
    prisma.dispatch.count({ where: { createdAt: { gte: todayStart } } }),

    // ── Lists ────────────────────────────────────────────────────────────────
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        clientName: true,
        totalAmount: true,
        status: true,
        deliveryDate: true,
        isRushOrder: true,
        eventType: true,
        lead: { select: { companyName: true } },
      },
    }),
    prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED"] }, createdAt: { gte: sixMonthsAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { notIn: ["CANCELLED"] } },
    }),
    prisma.order.findMany({
      where: {
        status: {
          in: ["QC_PASSED", "DISPATCHED", "PACKING", "QC_PENDING", "IN_PRODUCTION", "ADVANCE_PENDING"],
        },
        deliveryDate: { gte: todayStart },
      },
      orderBy: { deliveryDate: "asc" },
      take: 5,
      include: {
        lead: { select: { companyName: true } },
        deliveryAddresses: { take: 1, select: { city: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        deliveryDate: { lt: todayStart },
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      select: { id: true, orderNumber: true, clientName: true, deliveryDate: true },
      take: 3,
      orderBy: { deliveryDate: "asc" },
    }),
    prisma.inventoryItem.findMany({
      where: { currentStock: { lte: 5 } },
      select: { id: true, name: true, currentStock: true },
      take: 3,
      orderBy: { currentStock: "asc" },
    }),

    // ── Season pipeline ──────────────────────────────────────────────────────
    prisma.order.aggregate({
      where: {
        status: { notIn: ["CANCELLED"] },
        deliveryDate: { gte: todayStart, lte: ninetyDaysOut },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.lead.findMany({
      where: {
        status: { in: ["NEW", "CONTACTED", "SAMPLE_SENT", "NEGOTIATION"] },
        nextFollowUp: { gte: todayStart, lte: ninetyDaysOut },
      },
      select: { budget: true },
    }),
  ]);

  // ── Derive stats ───────────────────────────────────────────────────────────
  const inventoryAlertsCount = inventoryItems.filter(
    (i) => i.currentStock <= i.minStockLevel
  ).length;

  const monthlyRevenue = monthlyRevenueAgg._sum.totalAmount ?? 0;
  const prevMonthRevenue = prevMonthRevenueAgg._sum.totalAmount ?? 0;
  const revenueGrowth =
    prevMonthRevenue > 0
      ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 0;

  const pendingAmount = pendingPaymentsAgg._sum.balanceAmount ?? 0;
  const avgOrderValue = avgOrderAgg._avg.totalAmount ?? 0;
  const overdueAmount = overduePaymentsAgg._sum.balanceAmount ?? 0;
  const conversionRate =
    totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

  const nextSeason = getNextSeason(now);

  const seasonOrdersConfirmed = nextSeasonOrdersAgg._count ?? 0;
  const seasonConfirmedValue = nextSeasonOrdersAgg._sum.totalAmount ?? 0;
  const seasonPipelineLeads = nextSeasonLeads.length;
  const seasonPipelineValue = nextSeasonLeads.reduce(
    (sum, l) => sum + (l.budget ?? 0),
    0
  );

  // ── Revenue chart (last 6 months) ──────────────────────────────────────────
  const revenueByMonth: Record<string, { label: string; revenue: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth[key] = { label: MONTH_NAMES[d.getMonth()], revenue: 0 };
  }
  for (const order of revenueOrders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (revenueByMonth[key]) {
      revenueByMonth[key].revenue += order.totalAmount;
    }
  }
  const revenueChart = Object.values(revenueByMonth).map(({ label, revenue }) => ({
    month: label,
    revenue,
  }));

  // ── Order stages pie ───────────────────────────────────────────────────────
  const orderStages = orderStatusCounts
    .filter((s) => s._count._all > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s._count._all,
      color: STATUS_COLORS[s.status] ?? "#6b7280",
      status: s.status,
    }));

  // ── Upcoming deliveries ────────────────────────────────────────────────────
  const upcomingDeliveries = upcomingOrdersRaw.map((o) => ({
    orderId: o.id,
    company: o.lead?.companyName ?? o.clientName,
    quantity: o._count.items,
    city: o.deliveryAddresses[0]?.city ?? "",
    status: o.status,
    deliveryDate: o.deliveryDate,
    isRushOrder: o.isRushOrder,
  }));

  // ── Alerts (overdue + low stock) ───────────────────────────────────────────
  const alerts = [
    ...overdueOrdersRaw.map((o) => ({
      id: `overdue-${o.id}`,
      severity: "high" as const,
      title: `Overdue: ${o.orderNumber}`,
      message: `${o.clientName} — delivery was overdue`,
      link: `/orders/${o.id}`,
    })),
    ...lowStockItemsRaw.map((i) => ({
      id: `stock-${i.id}`,
      severity: "info" as const,
      title: `Low Stock: ${i.name}`,
      message: `Only ${i.currentStock} units remaining`,
      link: `/inventory`,
    })),
  ];

  return (
    <DashboardClient
      currentUser={{ name: userName, role }}
      stats={{
        activeOrders: activeOrdersCount,
        totalOrders: totalOrdersCount,
        monthlyRevenue,
        revenueGrowth,
        pendingPayments: pendingPaymentsCount,
        pendingAmount,
        pendingQC: pendingQCCount,
        pendingDispatch: pendingDispatchCount,
        inventoryAlerts: inventoryAlertsCount,
        rushOrders: rushOrdersCount,
        conversionRate,
        wonLeads: wonLeadsCount,
        totalLeads: totalLeadsCount,
      }}
      extendedStats={{
        hamsersInProduction: hamsersInProdAgg._sum.quantity ?? 0,
        batchesInProgress: activeBatchesCount,
        qcFailedToday: todayQCFailedCount,
        awaitingDispatch: pendingDispatchCount,
        avgOrderValue,
        overdueAmount,
        nextSeasonName: nextSeason.name,
        nextSeasonDays: nextSeason.days,
        seasonOrdersConfirmed,
        seasonConfirmedValue,
        seasonPipelineLeads,
        seasonPipelineValue,
        followUpsDueToday: followUpsDueTodayCount,
      }}
      todayFloor={{
        unitsPacked: todayPackedUnits,
        qcPassed: todayQCPassedCount,
        shipmentsOut: todayDispatchesCount,
      }}
      recentOrders={recentOrders as any}
      revenueChart={revenueChart}
      orderStages={orderStages}
      upcomingDeliveries={upcomingDeliveries as any}
      alerts={alerts}
    />
  );
}
