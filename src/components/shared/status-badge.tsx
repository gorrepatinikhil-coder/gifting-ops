import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "info" | "outline" | "purple" | "orange" | "secondary" }> = {
  // Lead
  NEW: { label: "New", variant: "info" },
  CONTACTED: { label: "Contacted", variant: "warning" },
  SAMPLE_SENT: { label: "Sample Sent", variant: "purple" },
  NEGOTIATION: { label: "Negotiation", variant: "orange" },
  WON: { label: "Won", variant: "success" },
  LOST: { label: "Lost", variant: "destructive" },
  // Order
  CONFIRMED: { label: "Confirmed", variant: "info" },
  ADVANCE_PENDING: { label: "Advance Pending", variant: "warning" },
  IN_PRODUCTION: { label: "In Production", variant: "purple" },
  PACKING: { label: "Packing", variant: "purple" },
  QC_PENDING: { label: "QC Pending", variant: "orange" },
  QC_PASSED: { label: "QC Passed", variant: "success" },
  DISPATCHED: { label: "Dispatched", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  ON_HOLD: { label: "On Hold", variant: "secondary" },
  // QC
  PASS: { label: "Pass", variant: "success" },
  FAIL_PACKING: { label: "Fail — Packing", variant: "orange" },
  FAIL_PRODUCT: { label: "Fail — Product", variant: "destructive" },
  // Payment
  PENDING: { label: "Pending", variant: "warning" },
  PARTIAL: { label: "Partial", variant: "orange" },
  PAID: { label: "Paid", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
  // Sample
  REQUESTED: { label: "Requested", variant: "info" },
  IN_KITCHEN: { label: "In Kitchen", variant: "purple" },
  READY: { label: "Ready for Delivery", variant: "success" },
  APPROVED: { label: "Client Approved", variant: "success" },
  NEEDS_CHANGES: { label: "Changes Needed", variant: "orange" },
  CLOSED: { label: "Closed", variant: "secondary" },
  // Quote
  DRAFT: { label: "Draft", variant: "secondary" },
  SENT: { label: "Sent", variant: "info" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "warning" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  CONVERTED: { label: "Converted", variant: "success" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  // Lifecycle
  LEAD: { label: "Lead", variant: "info" },
  SAMPLE_REQUESTED: { label: "Sample Requested", variant: "purple" },
  SAMPLE_APPROVED: { label: "Sample Approved", variant: "success" },
  QUOTE_SENT: { label: "Quote Sent", variant: "info" },
  ADVANCE_RECEIVED: { label: "Advance Received", variant: "success" },
  PAYMENT_CLOSED: { label: "Payment Closed", variant: "success" },
  // Production
  SCHEDULED: { label: "Scheduled", variant: "info" },
  IN_PROGRESS: { label: "In Progress", variant: "purple" },
  PAUSED: { label: "Paused", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  DELAYED: { label: "Delayed", variant: "destructive" },
  // Vendor PO
  PLACED: { label: "PO Placed", variant: "info" },
  PARTIAL_RECEIVED: { label: "Partially Received", variant: "orange" },
  RECEIVED: { label: "Received", variant: "success" },
  // Dispatch
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "info" },
  FAILED: { label: "Failed", variant: "destructive" },
  RESCHEDULED: { label: "Rescheduled", variant: "warning" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "outline" as const };
  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {config.label}
    </Badge>
  );
}
