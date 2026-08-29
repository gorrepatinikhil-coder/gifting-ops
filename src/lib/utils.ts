import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string, fmt = "dd MMM yyyy"): string {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function generateOrderNumber(): string {
  const prefix = "ORD";
  const year = new Date().getFullYear().toString().slice(2);
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${random}`;
}

export function generateQuoteNumber(): string {
  const prefix = "QT";
  const year = new Date().getFullYear().toString().slice(2);
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${random}`;
}

export function generateChallanNumber(): string {
  const prefix = "DC";
  const year = new Date().getFullYear().toString().slice(2);
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${random}`;
}

export function generatePONumber(): string {
  const prefix = "PO";
  const year = new Date().getFullYear().toString().slice(2);
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${random}`;
}

export function generateBatchNumber(): string {
  const prefix = "BTH";
  const year = new Date().getFullYear().toString().slice(2);
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${random}`;
}

export function generateInvoiceNumber(): string {
  const prefix = "INV";
  const year = new Date().getFullYear().toString().slice(2);
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${year}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date | string): boolean {
  return new Date(date) < new Date();
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  OWNER: "Owner",
  SALES: "Sales",
  CHEF_OPS: "Chef / Ops Head",
  PRODUCTION: "Production",
  PACKING: "Packing",
  QC: "QC",
  DISPATCH: "Dispatch",
  ACCOUNTS: "Accounts",
  STORE: "Store",
  VENDOR: "Vendor Portal",
};

export const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  SAMPLE_SENT: "bg-purple-100 text-purple-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  ADVANCE_PENDING: "bg-yellow-100 text-yellow-800",
  IN_PRODUCTION: "bg-indigo-100 text-indigo-800",
  PACKING: "bg-purple-100 text-purple-800",
  QC_PENDING: "bg-orange-100 text-orange-800",
  QC_PASSED: "bg-teal-100 text-teal-800",
  DISPATCHED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-gray-100 text-gray-800",
  PASS: "bg-green-100 text-green-800",
  FAIL_PACKING: "bg-orange-100 text-orange-800",
  FAIL_PRODUCT: "bg-red-100 text-red-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PARTIAL: "bg-orange-100 text-orange-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};
