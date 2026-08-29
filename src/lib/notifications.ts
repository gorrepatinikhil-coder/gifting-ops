import { prisma } from "@/lib/prisma";
import type { NotificationType, Role } from "@prisma/client";

interface NotifyParams {
  type: NotificationType;
  title: string;
  message: string;
  roles?: Role[];
  userIds?: string[];
  orderId?: string;
  link?: string;
}

export async function sendNotification(params: NotifyParams) {
  let targetUserIds: string[] = params.userIds ?? [];

  if (params.roles && params.roles.length > 0) {
    const users = await prisma.user.findMany({
      where: { role: { in: params.roles }, isActive: true },
      select: { id: true },
    });
    targetUserIds = [...new Set([...targetUserIds, ...users.map((u) => u.id)])];
  }

  if (targetUserIds.length === 0) return;

  await prisma.notification.createMany({
    data: targetUserIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      orderId: params.orderId,
      link: params.link,
      channel: "IN_APP" as const,
    })),
  });
}

export async function notifyOrderDelayed(orderId: string, orderNumber: string) {
  await sendNotification({
    type: "ORDER_DELAYED",
    title: "Order Delayed",
    message: `Order ${orderNumber} is at risk of missing its delivery deadline.`,
    roles: ["SALES", "OWNER", "ADMIN"],
    orderId,
    link: `/orders/${orderId}`,
  });
}

export async function notifyQCFail(orderId: string, orderNumber: string) {
  await sendNotification({
    type: "QC_FAIL",
    title: "QC Failure Alert",
    message: `Order ${orderNumber} has failed QC inspection.`,
    roles: ["CHEF_OPS", "OWNER", "ADMIN"],
    orderId,
    link: `/orders/${orderId}`,
  });
}

export async function notifyVendorLate(vendorName: string, poNumber: string) {
  await sendNotification({
    type: "VENDOR_LATE",
    title: "Vendor Delivery Delayed",
    message: `Vendor ${vendorName} is late on PO ${poNumber}.`,
    roles: ["CHEF_OPS", "STORE", "ADMIN"],
  });
}

export async function notifyAdvancePending(orderId: string, orderNumber: string) {
  await sendNotification({
    type: "ADVANCE_PENDING",
    title: "Advance Payment Pending",
    message: `Advance not received for order ${orderNumber}.`,
    roles: ["ACCOUNTS", "SALES"],
    orderId,
    link: `/orders/${orderId}/payments`,
  });
}

export async function notifyBalanceDue(orderId: string, orderNumber: string) {
  await sendNotification({
    type: "BALANCE_DUE",
    title: "Balance Payment Due",
    message: `Balance amount pending after delivery for order ${orderNumber}.`,
    roles: ["ACCOUNTS"],
    orderId,
    link: `/accounts`,
  });
}

export async function notifyRushOrder(orderId: string, orderNumber: string) {
  await sendNotification({
    type: "RUSH_ORDER",
    title: "Rush Order Received",
    message: `Rush order ${orderNumber} needs priority handling.`,
    roles: ["CHEF_OPS", "PRODUCTION", "PACKING", "DISPATCH", "ADMIN"],
    orderId,
    link: `/orders/${orderId}`,
  });
}
