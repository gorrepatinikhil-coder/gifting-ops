import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermittedModules } from "@/lib/permissions";
import type { Role } from "@prisma/client";

/**
 * GET /api/nav/counts
 *
 * Returns badge counts for sidebar nav items.
 * Each count represents items needing attention right now.
 * Queries are scoped to what the current role can access.
 * Cached for 60 s on the client side (sidebar polls every 60 s).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role      = (session.user as any).role as Role;
  const userId    = (session.user as any).id as string;
  const permitted = getPermittedModules(role);
  const now       = new Date();

  const [
    openLeads,
    pendingQuotes,
    activeSamples,
    urgentOrders,
    productionActive,
    packingPending,
    qcPending,
    dispatchReady,
    lowStockItems,
    overduePayments,
    unreadNotifications,
  ] = await Promise.all([
    // Open leads (not yet WON or LOST)
    permitted.includes("leads")
      ? prisma.lead.count({
          where: { status: { in: ["NEW", "CONTACTED", "SAMPLE_SENT", "NEGOTIATION"] } },
        })
      : Promise.resolve(0),

    // Quotes pending approval
    permitted.includes("quotations")
      ? prisma.quote.count({ where: { status: "PENDING_APPROVAL" } })
      : Promise.resolve(0),

    // Samples actively in progress
    permitted.includes("samples")
      ? prisma.sample.count({ where: { status: { in: ["IN_KITCHEN", "READY"] } } })
      : Promise.resolve(0),

    // Orders that are urgent — rush flag or delivery date already past
    permitted.includes("orders")
      ? prisma.order.count({
          where: {
            OR: [
              { isRushOrder: true, status: { notIn: ["DELIVERED", "CANCELLED"] } },
              { deliveryDate: { lt: now }, status: { notIn: ["DELIVERED", "CANCELLED"] } },
            ],
          },
        })
      : Promise.resolve(0),

    // Batches in active production stages
    permitted.includes("production")
      ? prisma.productionBatch.count({
          where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "PAUSED"] } },
        })
      : Promise.resolve(0),

    // Orders currently in packing
    permitted.includes("packing")
      ? prisma.order.count({ where: { status: "PACKING" } })
      : Promise.resolve(0),

    // Orders at QC stage
    permitted.includes("qc")
      ? prisma.order.count({ where: { status: { in: ["QC_PENDING"] } } })
      : Promise.resolve(0),

    // Dispatch items pending or out for delivery (i.e., not yet completed)
    permitted.includes("dispatch")
      ? prisma.dispatch.count({ where: { status: { in: ["PENDING", "OUT_FOR_DELIVERY"] } } }).catch(() => Promise.resolve(0))
      : Promise.resolve(0),

    // Low stock: items where current_stock <= min_stock_level (needs raw SQL — Prisma can't compare two columns)
    permitted.includes("inventory")
      ? prisma.$queryRaw<[{ c: bigint }]>`
          SELECT COUNT(*)::int AS c FROM inventory_items
          WHERE current_stock <= min_stock_level AND is_active = true
        `
          .then((rows) => Number(rows[0]?.c ?? 0))
          .catch(() => Promise.resolve(0))
      : Promise.resolve(0),

    // Orders with overdue payment (past delivery date, still pending/partial)
    permitted.includes("payments")
      ? prisma.order.count({
          where: {
            paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
            deliveryDate: { lt: now },
            status: { notIn: ["CANCELLED"] },
          },
        })
      : Promise.resolve(0),

    // Unread notifications for this user
    permitted.includes("notifications")
      ? prisma.notification.count({ where: { userId, isRead: false } }).catch(() => Promise.resolve(0))
      : Promise.resolve(0),
  ]);

  return NextResponse.json(
    {
      leads:         openLeads,
      quotations:    pendingQuotes,
      samples:       activeSamples,
      orders:        urgentOrders,
      production:    productionActive,
      packing:       packingPending,
      qc:            qcPending,
      dispatch:      dispatchReady,
      inventory:     lowStockItems,
      payments:      overduePayments,
      notifications: unreadNotifications,
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
