import type { Role } from "@prisma/client";

export type Module =
  | "leads"
  | "samples"
  | "quotations"
  | "orders"
  | "payments"
  | "production"
  | "inventory"
  | "vendors"
  | "packing"
  | "qc"
  | "dispatch"
  | "accounts"
  | "feedback"
  | "reports"
  | "notifications"
  | "settings"
  | "users";

const ROLE_PERMISSIONS: Record<Role, Module[]> = {
  ADMIN: [
    "leads", "samples", "quotations", "orders", "payments",
    "production", "inventory", "vendors", "packing", "qc",
    "dispatch", "accounts", "feedback", "reports", "notifications",
    "settings", "users",
  ],
  OWNER: [
    "leads", "samples", "quotations", "orders", "payments",
    "production", "inventory", "vendors", "packing", "qc",
    "dispatch", "accounts", "feedback", "reports", "notifications",
    "settings",
  ],
  SALES: [
    "leads", "samples", "quotations", "orders", "payments",
    "feedback", "notifications",
  ],
  CHEF_OPS: [
    "samples", "orders", "production", "inventory", "vendors",
    "packing", "qc", "notifications",
  ],
  PRODUCTION: ["orders", "production", "inventory", "notifications"],
  PACKING:    ["orders", "packing", "notifications"],
  QC:         ["orders", "packing", "qc", "notifications"],
  DISPATCH:   ["orders", "dispatch", "notifications"],
  ACCOUNTS:   ["orders", "payments", "accounts", "reports", "notifications"],
  STORE:      ["inventory", "vendors", "notifications"],
  VENDOR:     ["vendors"],
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:      "Administrator",
  OWNER:      "Owner",
  SALES:      "Sales Executive",
  CHEF_OPS:   "Kitchen Ops Manager",
  PRODUCTION: "Production Team",
  PACKING:    "Packing Team",
  QC:         "QC Inspector",
  DISPATCH:   "Dispatch Team",
  ACCOUNTS:   "Accounts Team",
  STORE:      "Store Manager",
  VENDOR:     "Vendor",
};

export const ALL_ROLES: Role[] = [
  "ADMIN", "OWNER", "SALES", "CHEF_OPS",
  "PRODUCTION", "PACKING", "QC", "DISPATCH",
  "ACCOUNTS", "STORE", "VENDOR",
];

export function hasPermission(role: Role, module: Module): boolean {
  return ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}

export function getPermittedModules(role: Role): Module[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const DISCOUNT_THRESHOLD: Record<Role, number> = {
  SALES:      5,
  CHEF_OPS:   10,
  ADMIN:      100,
  OWNER:      100,
  PRODUCTION: 0,
  PACKING:    0,
  QC:         0,
  DISPATCH:   0,
  ACCOUNTS:   0,
  STORE:      0,
  VENDOR:     0,
};

export function canApproveDiscount(role: Role): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function canAdvanceLifecycle(role: Role): boolean {
  return ["ADMIN", "OWNER", "SALES", "CHEF_OPS"].includes(role);
}
