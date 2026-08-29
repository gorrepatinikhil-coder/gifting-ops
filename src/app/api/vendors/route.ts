import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as Role, "vendors")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendors = await prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return NextResponse.json(vendors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "CHEF_OPS", "STORE"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const vendor = await prisma.vendor.create({
    data: {
      name: body.name,
      companyName: body.companyName || null,
      email: body.email || null,
      phone: body.phone,
      address: body.address || null,
      gstNumber: body.gstNumber || null,
      category: body.category || null,
    },
  });
  return NextResponse.json(vendor, { status: 201 });
}
