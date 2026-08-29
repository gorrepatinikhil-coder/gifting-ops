import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      order: { select: { orderNumber: true, clientName: true } },
    },
  });

  return (
    <NotificationsClient
      notifications={notifications as any}
      currentUser={{ id: session.user.id! }}
    />
  );
}
