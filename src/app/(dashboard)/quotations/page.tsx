import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { QuotationsClient } from "./quotations-client";
import type { Role } from "@prisma/client";

export default async function QuotationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;

  if (!hasPermission(role, "quotations")) {
    return <AccessDenied role={role} pageName="Quotations" />;
  }

  const [quotesRaw, leads] = await Promise.all([
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lead: { select: { id: true, contactPerson: true, companyName: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    }),
    prisma.lead.findMany({
      where: { status: { notIn: ["LOST"] } },
      orderBy: { companyName: "asc" },
      select: { id: true, contactPerson: true, companyName: true },
    }),
  ]);

  // Map Prisma Quote fields to the shape QuotationsClient expects
  const quotes = quotesRaw.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    clientName: q.clientName,
    clientEmail: undefined,
    clientPhone: undefined,
    clientCompany: q.lead?.companyName ?? undefined,
    eventType: q.eventType ?? undefined,
    eventDate: q.expectedDate?.toISOString() ?? undefined,
    validUntil: q.validUntil?.toISOString() ?? undefined,
    subtotal: q.subtotal,
    totalDiscount: q.discountAmt,
    totalGst: q.gstAmt,
    deliveryCharge: q.deliveryCost,
    packagingCharge: q.packagingCost,
    brandingCharge: q.brandingCost,
    grandTotal: q.totalAmount,
    status: q.status,
    notes: q.notes ?? undefined,
    terms: q.terms ?? undefined,
    items: q.items,
    lead: q.lead ? { clientName: q.lead.companyName, company: q.lead.companyName } : undefined,
    createdBy: q.createdBy ? { name: q.createdBy.name } : undefined,
    approvedBy: undefined,
    createdAt: q.createdAt.toISOString(),
  }));

  const leadOptions = leads.map((l) => ({
    id: l.id,
    clientName: l.contactPerson,
    company: l.companyName,
  }));

  return (
    <QuotationsClient
      quotes={quotes as any}
      leads={leadOptions}
      userRole={role}
    />
  );
}
