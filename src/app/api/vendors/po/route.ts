import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "CHEF_OPS", "STORE"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const items = body.items ?? [];
  const totalAmount = items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + (parseFloat(String(i.unitPrice)) * parseFloat(String(i.quantity))), 0);

  const po = await prisma.vendorOrder.create({
    data: {
      poNumber: body.poNumber,
      vendorId: body.vendorId,
      expectedDate: new Date(body.expectedDate),
      totalAmount,
      notes: body.notes || null,
      status: "PLACED",
      items: {
        create: items.map((item: { itemName: string; quantity: number; unit: string; unitPrice: number }) => ({
          itemName: item.itemName,
          quantity: parseFloat(String(item.quantity)),
          unit: item.unit,
          unitPrice: parseFloat(String(item.unitPrice)),
          totalPrice: parseFloat(String(item.unitPrice)) * parseFloat(String(item.quantity)),
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(po, { status: 201 });
}
