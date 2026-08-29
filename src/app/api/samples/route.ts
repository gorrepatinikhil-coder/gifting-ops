import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "samples")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const samples = await prisma.sample.findMany({
    orderBy: { createdAt: "desc" },
    include: { requestedBy: { select: { name: true } }, lead: { select: { companyName: true } }, items: true },
  });
  return NextResponse.json(samples);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "samples")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.clientName || !body.requirements) {
    return NextResponse.json({ error: "Client name and requirements are required." }, { status: 400 });
  }

  const sample = await prisma.sample.create({
    data: {
      clientName: body.clientName,
      requirements: body.requirements,
      quantity: parseInt(body.quantity) || 1,
      leadId: body.leadId || null,
      requestedById: session.user.id,
    },
  });

  return NextResponse.json(sample, { status: 201 });
}
