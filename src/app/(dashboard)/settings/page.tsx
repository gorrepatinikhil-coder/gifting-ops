import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDenied } from "@/components/shared/access-denied";
import { SettingsClient } from "./settings-client";
import type { Role } from "@prisma/client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!["ADMIN", "OWNER"].includes(role)) {
    return <AccessDenied role={role} pageName="Settings" />;
  }

  const [currentUser, users] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  if (!currentUser) redirect("/login");

  return (
    <SettingsClient
      currentUser={currentUser as any}
      users={users as any}
      userRole={role}
    />
  );
}
