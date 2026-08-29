import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const feedback = await prisma.feedback.create({
    data: {
      orderId: body.orderId,
      clientName: order.clientName,
      overallRating: body.overallRating,
      tasteRating: body.tasteRating ?? null,
      packagingRating: body.packagingRating ?? null,
      deliveryRating: body.deliveryRating ?? null,
      comments: body.comments ?? null,
      repeatInterest: body.repeatInterest ?? false,
      collectedById: session.user.id,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
