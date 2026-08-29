import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Users can view themselves; admins can view anyone
  if (session.user.id !== id && !["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true, avatar: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isSelf = session.user.id === id;
  const isAdmin = ["ADMIN", "OWNER"].includes(session.user.role);

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;

  // Only admins can change role / active status
  if (isAdmin) {
    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
  });

  await createAuditLog({
    userId: session.user.id,
    entity: "User",
    entityId: id,
    action: "updated",
    newValues: data,
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only Admin can delete users" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // Soft delete — deactivate instead of hard delete
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
