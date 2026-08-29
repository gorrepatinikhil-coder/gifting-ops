import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { SamplesClient } from "./samples-client";
import type { Role } from "@prisma/client";

export default async function SamplesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "samples")) {
    return <AccessDenied role={role} pageName="Sample Requests" />;
  }

  const samples = await prisma.sample.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true } },
      lead: { select: { companyName: true } },
      items: {
        select: { id: true, productName: true, quantity: true },
      },
    },
  });

  return <SamplesClient samples={samples as any} currentUser={{ role }} />;
}
