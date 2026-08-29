import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateOrderNumber } from "@/lib/utils";
import { notifyRushOrder } from "@/lib/notifications";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const createOrderSchema = z.object({
  leadId: z.string(),
  quoteId: z.string().optional(),
  clientName: z.string().min(1),
  companyName: z.string().optional(),
  eventType: z.string().optional(),
  deliveryDate: z.string(),
  totalAmount: z.coerce.number(),
  gstAmount: z.coerce.number().default(0),
  advanceAmount: z.coerce.number().default(0),
  isRushOrder: z.boolean().default(false),
  cardMessage: z.string().optional(),
  ribbonColor: z.string().optional(),
  logoPlacement: z.string().optional(),
  brandingNotes: z.string().optional(),
  dietaryNotes: z.string().optional(),
  packagingNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(z.object({
    productName: z.string(),
    sku: z.string().optional(),
    quantity: z.coerce.number(),
    unitPrice: z.coerce.number(),
    totalPrice: z.coerce.number(),
    packagingType: z.string().optional(),
    brandingNotes: z.string().optional(),
  })).optional(),
  deliveryAddresses: z.array(z.object({
    recipientName: z.string(),
    phone: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    quantity: z.coerce.number().default(1),
  })).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "orders")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50");

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        lead: { select: { companyName: true, contactPerson: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true, payments: true } },
      },
    }),
    prisma.order.count({ where: status ? { status: status as never } : undefined }),
  ]);

  return NextResponse.json({ data: orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "orders")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { items, deliveryAddresses, eventType, ...orderData } = parsed.data;
  const orderNumber = generateOrderNumber();
  const balanceAmount = orderData.totalAmount - orderData.advanceAmount;

  const order = await prisma.order.create({
    data: {
      ...orderData,
      orderNumber,
      eventType: (eventType as never) ?? "OTHER",
      balanceAmount,
      deliveryDate: new Date(orderData.deliveryDate),
      paymentStatus: orderData.advanceAmount > 0 ? "PARTIAL" : "PENDING",
      createdById: session.user.id,
      items: items ? { create: items } : undefined,
      deliveryAddresses: deliveryAddresses ? { create: deliveryAddresses } : undefined,
    },
  });

  if (order.isRushOrder) {
    await notifyRushOrder(order.id, order.orderNumber);
  }

  await createAuditLog({
    userId: session.user.id,
    entity: "Order",
    entityId: order.id,
    action: "created",
    newValues: { orderNumber, status: order.status, totalAmount: order.totalAmount },
    orderId: order.id,
    leadId: order.leadId,
  });

  return NextResponse.json(order, { status: 201 });
}
