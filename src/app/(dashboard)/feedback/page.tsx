import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { FeedbackClient } from "./feedback-client";
import type { Role } from "@prisma/client";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "feedback")) {
    return <AccessDenied role={role} pageName="Client Feedback" />;
  }

  // Delivered orders that don't yet have feedback
  const [feedback, ordersWithoutFeedback] = await Promise.all([
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNumber: true, clientName: true, eventType: true } },
        collectedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        status: "DELIVERED",
        feedback: { none: {} },
      },
      orderBy: { deliveryDate: "desc" },
      select: { id: true, orderNumber: true, clientName: true, deliveryDate: true },
    }),
  ]);

  return (
    <FeedbackClient
      feedback={feedback as any}
      pendingFeedback={ordersWithoutFeedback as any}
      currentUser={{ id: session.user.id!, name: session.user.name ?? "", role } as any}
    />
  );
}
