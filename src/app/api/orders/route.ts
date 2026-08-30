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
  leadId: z.string().optional(),
  quoteId: z.string().optional(),
  clientName: z.string().min(1),
  clientPhone: z.string().optional(),
  clientEmail: z.string().optional(),
  companyName: z.string().optional(),
  clientCompany: z.string().optional(),
  eventType: z.string().optional(),
  deliveryDate: z.string(),
  totalAmount: z.coerce.number().optional(),
  gstAmount: z.coerce.number().default(0),
  advanceAmount: z.coerce.number().default(0),
  advanceRequired: z.coerce.number().default(0),
  isRush: z.boolean().default(false),
  isRushOrder: z.boolean().default(false),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
  cardMessage: z.string().optional(),
  ribbonColor: z.string().optional(),
  logoPlacement: z.string().optional(),
  brandingNotes: z.string().optional(),
  dietaryNotes: z.string().optional(),
  packagingNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(z.object({
    productName: z.string(),
    description: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.coerce.number(),
    unitPrice: z.coerce.number(),
    totalPrice: z.coerce.number(),
    packaging: z.string().optional(),
    branding: z.string().optional(),
    packagingType: z.string().optional(),
    brandingNotes: z.string().optional(),
  })).optional(),
  deliveryAddress: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string().optional(),
    pincode: z.string(),
    landmark: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
  }).optional(),
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

  const {
    items, deliveryAddresses, deliveryAddress,
    eventType, isRush, clientPhone, clientEmail, clientCompany,
    notes, specialInstructions, advanceRequired,
    totalAmount: providedTotal,
    ...orderData
  } = parsed.data;

  const orderNumber = generateOrderNumber();

  // Compute total from items if not explicitly provided
  const totalAmount = providedTotal ??
    (items ?? []).reduce((sum, i) => sum + i.totalPrice, 0);
  const balanceAmount = totalAmount - (orderData.advanceAmount ?? 0);

  // Normalise delivery addresses: form sends a single deliveryAddress object
  const normalizedAddresses = deliveryAddresses ??
    (deliveryAddress ? [{
      recipientName: deliveryAddress.contactName ?? orderData.clientName,
      phone: deliveryAddress.contactPhone ?? clientPhone ?? "",
      addressLine1: deliveryAddress.address,
      addressLine2: deliveryAddress.landmark,
      city: deliveryAddress.city,
      state: deliveryAddress.state ?? "",
      pincode: deliveryAddress.pincode,
      quantity: 1,
    }] : undefined);

  // leadId is required on the Order model — auto-create a walk-in lead if none provided
  let resolvedLeadId = orderData.leadId;
  if (!resolvedLeadId) {
    const lead = await prisma.lead.create({
      data: {
        companyName: clientCompany ?? orderData.companyName ?? orderData.clientName,
        contactPerson: orderData.clientName,
        phone: clientPhone ?? "",
        email: clientEmail,
        status: "WON",
        source: "Direct",
        createdById: session.user.id,
      },
    });
    resolvedLeadId = lead.id;
  }

  const order = await prisma.order.create({
    data: {
      ...orderData,
      leadId: resolvedLeadId,
      companyName: clientCompany ?? orderData.companyName,
      orderNumber,
      eventType: (eventType as never) ?? "OTHER",
      totalAmount,
      balanceAmount,
      deliveryDate: new Date(orderData.deliveryDate),
      isRushOrder: isRush || orderData.isRushOrder,
      paymentStatus: (orderData.advanceAmount ?? 0) > 0 ? "PARTIAL" : "PENDING",
      internalNotes: notes ?? orderData.internalNotes,
      createdById: session.user.id,
      items: items ? {
        create: items.map((i) => ({
          productName: i.productName,
          description: i.description,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          packagingType: i.packaging ?? i.packagingType,
          brandingNotes: i.branding ?? i.brandingNotes,
        })),
      } : undefined,
      deliveryAddresses: normalizedAddresses ? { create: normalizedAddresses } : undefined,
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
