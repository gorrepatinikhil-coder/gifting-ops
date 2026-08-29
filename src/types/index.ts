import type {
  User, Lead, Sample, Quote, QuoteItem, Order, OrderItem,
  Payment, ProductionBatch, InventoryItem, Vendor, VendorOrder,
  PackingUnit, QCLog, Dispatch, Invoice, Feedback, Notification,
  AuditLog, DiscountApproval, DeliveryAddress,
} from "@prisma/client";

export type {
  User, Lead, Sample, Quote, QuoteItem, Order, OrderItem,
  Payment, ProductionBatch, InventoryItem, Vendor, VendorOrder,
  PackingUnit, QCLog, Dispatch, Invoice, Feedback, Notification,
  AuditLog, DiscountApproval, DeliveryAddress,
};

export type LeadWithRelations = Lead & {
  createdBy: Pick<User, "id" | "name" | "email">;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  _count?: { quotes: number; orders: number; samples: number };
};

export type QuoteWithRelations = Quote & {
  createdBy: Pick<User, "id" | "name" | "email">;
  lead: Pick<Lead, "id" | "companyName" | "contactPerson">;
  items: QuoteItem[];
  discountApprovals: DiscountApproval[];
};

export type OrderWithRelations = Order & {
  lead: Pick<Lead, "id" | "companyName" | "contactPerson">;
  createdBy: Pick<User, "id" | "name" | "email">;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  items: OrderItem[];
  deliveryAddresses: DeliveryAddress[];
  payments: Payment[];
  _count?: {
    productionBatches: number;
    packingUnits: number;
    qcLogs: number;
    dispatches: number;
  };
};

export type DashboardStats = {
  totalOrders: number;
  activeOrders: number;
  monthlyRevenue: number;
  pendingPayments: number;
  delayedOrders: number;
  totalLeads: number;
  conversionRate: number;
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
}
