export type Role =
  | "ADMIN" | "OWNER" | "SALES" | "CHEF_OPS"
  | "PRODUCTION" | "PACKING" | "QC" | "DISPATCH"
  | "ACCOUNTS" | "STORE" | "VENDOR";

export type LeadStatus = "NEW" | "CONTACTED" | "SAMPLE_SENT" | "NEGOTIATION" | "WON" | "LOST";
export type EventType = "DIWALI" | "CORPORATE" | "WEDDING" | "BIRTHDAY" | "CUSTOM" | "CHRISTMAS" | "EID" | "HOLI" | "OTHER";
export type OrderStatus = "CONFIRMED" | "ADVANCE_PENDING" | "IN_PRODUCTION" | "PACKING" | "QC_PENDING" | "QC_PASSED" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | "ON_HOLD";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "REFUNDED";
export type PaymentType = "ADVANCE" | "BALANCE" | "FULL";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface MockLead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  requirementType: string | null;
  eventType: EventType;
  expectedQty: number | null;
  budget: number | null;
  status: LeadStatus;
  nextFollowUp: Date | null;
  createdAt: Date;
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  _count: { quotes: number; orders: number; samples: number };
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  companyName: string | null;
  eventType: string;
  quantity: number;
  deliveryDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  isRushOrder: boolean;
  lead: { companyName: string; contactPerson: string };
  createdBy: { name: string };
  _count: { items: number; payments: number; dispatches: number };
}

export interface MockPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  companyName: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  method: string;
  reference: string | null;
  dueDate: Date;
  paidAt: Date | null;
  createdAt: Date;
  createdBy: { name: string };
}

export const MOCK_USER: MockUser = {
  id: "usr-001",
  name: "Nikhil Gorrepati",
  email: "nikhil@giftingops.com",
  role: "ADMIN",
  phone: "+91 98765 43210",
  isActive: true,
  createdAt: "2025-01-01",
};

export const MOCK_TEAM: MockUser[] = [
  MOCK_USER,
  { id: "usr-002", name: "Priya Sharma", email: "priya@giftingops.com", role: "SALES", phone: "+91 98765 43211", isActive: true, createdAt: "2025-01-15" },
  { id: "usr-003", name: "Raj Kumar", email: "raj@giftingops.com", role: "CHEF_OPS", phone: "+91 98765 43212", isActive: true, createdAt: "2025-02-01" },
  { id: "usr-004", name: "Sunita Patel", email: "sunita@giftingops.com", role: "ACCOUNTS", phone: "+91 98765 43213", isActive: true, createdAt: "2025-02-15" },
  { id: "usr-005", name: "Amit Singh", email: "amit@giftingops.com", role: "PRODUCTION", phone: "+91 98765 43214", isActive: false, createdAt: "2025-03-01" },
];

export const MOCK_LEADS: MockLead[] = [
  {
    id: "lead-001",
    companyName: "Infosys Limited",
    contactPerson: "Vikram Reddy",
    phone: "+91 9800000001",
    email: "vikram.reddy@infosys.com",
    requirementType: "Premium Dry Fruit Hampers",
    eventType: "DIWALI",
    expectedQty: 500,
    budget: 250000,
    status: "NEGOTIATION",
    nextFollowUp: new Date("2026-05-22"),
    createdAt: new Date("2026-04-10"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 2, orders: 0, samples: 1 },
  },
  {
    id: "lead-002",
    companyName: "Tata Consultancy Services",
    contactPerson: "Anita Nair",
    phone: "+91 9800000002",
    email: "anita.nair@tcs.com",
    requirementType: "Corporate Gift Boxes",
    eventType: "CORPORATE",
    expectedQty: 1000,
    budget: 500000,
    status: "WON",
    nextFollowUp: null,
    createdAt: new Date("2026-03-15"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 3, orders: 2, samples: 2 },
  },
  {
    id: "lead-003",
    companyName: "Wipro Technologies",
    contactPerson: "Suresh Menon",
    phone: "+91 9800000003",
    email: "suresh@wipro.com",
    requirementType: "Custom Branded Kits",
    eventType: "CORPORATE",
    expectedQty: 300,
    budget: 120000,
    status: "SAMPLE_SENT",
    nextFollowUp: new Date("2026-05-18"),
    createdAt: new Date("2026-04-20"),
    createdBy: { id: "usr-001", name: "Nikhil Gorrepati" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 1, orders: 0, samples: 2 },
  },
  {
    id: "lead-004",
    companyName: "HDFC Bank",
    contactPerson: "Meena Krishnan",
    phone: "+91 9800000004",
    email: "meena.krishnan@hdfc.com",
    requirementType: "Employee Gifting",
    eventType: "CORPORATE",
    expectedQty: 2000,
    budget: 1000000,
    status: "CONTACTED",
    nextFollowUp: new Date("2026-05-15"),
    createdAt: new Date("2026-05-01"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 0, orders: 0, samples: 0 },
  },
  {
    id: "lead-005",
    companyName: "Mahindra & Mahindra",
    contactPerson: "Deepak Joshi",
    phone: "+91 9800000005",
    email: null,
    requirementType: "Festival Hampers",
    eventType: "DIWALI",
    expectedQty: 800,
    budget: 400000,
    status: "NEW",
    nextFollowUp: new Date("2026-05-20"),
    createdAt: new Date("2026-05-08"),
    createdBy: { id: "usr-001", name: "Nikhil Gorrepati" },
    assignedTo: null,
    _count: { quotes: 0, orders: 0, samples: 0 },
  },
  {
    id: "lead-006",
    companyName: "Reliance Industries",
    contactPerson: "Kavita Shah",
    phone: "+91 9800000006",
    email: "kavita.shah@ril.com",
    requirementType: "Luxury Gift Boxes",
    eventType: "DIWALI",
    expectedQty: 1500,
    budget: 1500000,
    status: "WON",
    nextFollowUp: null,
    createdAt: new Date("2026-02-20"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 4, orders: 3, samples: 2 },
  },
  {
    id: "lead-007",
    companyName: "Bajaj Finance",
    contactPerson: "Rohit Verma",
    phone: "+91 9800000007",
    email: "rohit.v@bajajfinance.com",
    requirementType: "Thank You Hampers",
    eventType: "CORPORATE",
    expectedQty: 400,
    budget: 200000,
    status: "NEGOTIATION",
    nextFollowUp: new Date("2026-05-16"),
    createdAt: new Date("2026-04-25"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 2, orders: 0, samples: 1 },
  },
  {
    id: "lead-008",
    companyName: "Godrej Group",
    contactPerson: "Nisha Kapoor",
    phone: "+91 9800000008",
    email: "nisha@godrej.com",
    requirementType: "Wedding Welcome Kits",
    eventType: "WEDDING",
    expectedQty: 200,
    budget: 150000,
    status: "LOST",
    nextFollowUp: null,
    createdAt: new Date("2026-03-01"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 1, orders: 0, samples: 0 },
  },
  {
    id: "lead-009",
    companyName: "L&T Finance",
    contactPerson: "Arjun Pillai",
    phone: "+91 9800000009",
    email: "arjun@ltfinance.com",
    requirementType: "New Year Gift Sets",
    eventType: "CORPORATE",
    expectedQty: 600,
    budget: 300000,
    status: "NEW",
    nextFollowUp: new Date("2026-05-25"),
    createdAt: new Date("2026-05-10"),
    createdBy: { id: "usr-001", name: "Nikhil Gorrepati" },
    assignedTo: null,
    _count: { quotes: 0, orders: 0, samples: 0 },
  },
  {
    id: "lead-010",
    companyName: "Biocon Limited",
    contactPerson: "Sameera Rao",
    phone: "+91 9800000010",
    email: "sameera@biocon.com",
    requirementType: "Wellness Hampers",
    eventType: "CORPORATE",
    expectedQty: 250,
    budget: 125000,
    status: "SAMPLE_SENT",
    nextFollowUp: new Date("2026-05-19"),
    createdAt: new Date("2026-04-28"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 1, orders: 0, samples: 1 },
  },
  {
    id: "lead-011",
    companyName: "Sun Pharma",
    contactPerson: "Prateek Mehta",
    phone: "+91 9800000011",
    email: "prateek@sunpharma.com",
    requirementType: "Doctor's Day Gifts",
    eventType: "CORPORATE",
    expectedQty: 100,
    budget: 75000,
    status: "CONTACTED",
    nextFollowUp: new Date("2026-05-17"),
    createdAt: new Date("2026-05-05"),
    createdBy: { id: "usr-002", name: "Priya Sharma" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 0, orders: 0, samples: 0 },
  },
  {
    id: "lead-012",
    companyName: "Zomato",
    contactPerson: "Tanvi Agrawal",
    phone: "+91 9800000012",
    email: "tanvi@zomato.com",
    requirementType: "Team Celebration Boxes",
    eventType: "BIRTHDAY",
    expectedQty: 50,
    budget: 25000,
    status: "WON",
    nextFollowUp: null,
    createdAt: new Date("2026-03-20"),
    createdBy: { id: "usr-001", name: "Nikhil Gorrepati" },
    assignedTo: { id: "usr-002", name: "Priya Sharma" },
    _count: { quotes: 1, orders: 1, samples: 0 },
  },
];

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "ord-001",
    orderNumber: "ORD26-14201",
    clientName: "Anita Nair",
    companyName: "Tata Consultancy Services",
    eventType: "CORPORATE",
    quantity: 500,
    deliveryDate: new Date("2026-05-25"),
    status: "IN_PRODUCTION",
    paymentStatus: "PARTIAL",
    totalAmount: 500000,
    isRushOrder: false,
    lead: { companyName: "Tata Consultancy Services", contactPerson: "Anita Nair" },
    createdBy: { name: "Priya Sharma" },
    _count: { items: 3, payments: 1, dispatches: 0 },
  },
  {
    id: "ord-002",
    orderNumber: "ORD26-14202",
    clientName: "Kavita Shah",
    companyName: "Reliance Industries",
    eventType: "DIWALI",
    quantity: 2000,
    deliveryDate: new Date("2026-06-10"),
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    totalAmount: 1500000,
    isRushOrder: false,
    lead: { companyName: "Reliance Industries", contactPerson: "Kavita Shah" },
    createdBy: { name: "Nikhil Gorrepati" },
    _count: { items: 5, payments: 0, dispatches: 0 },
  },
  {
    id: "ord-003",
    orderNumber: "ORD26-14203",
    clientName: "Tanvi Agrawal",
    companyName: "Zomato",
    eventType: "BIRTHDAY",
    quantity: 50,
    deliveryDate: new Date("2026-05-14"),
    status: "DISPATCHED",
    paymentStatus: "PAID",
    totalAmount: 25000,
    isRushOrder: true,
    lead: { companyName: "Zomato", contactPerson: "Tanvi Agrawal" },
    createdBy: { name: "Priya Sharma" },
    _count: { items: 1, payments: 1, dispatches: 1 },
  },
  {
    id: "ord-004",
    orderNumber: "ORD26-14156",
    clientName: "Rohan Mehta",
    companyName: "Flipkart Pvt Ltd",
    eventType: "CORPORATE",
    quantity: 400,
    deliveryDate: new Date("2026-05-20"),
    status: "QC_PENDING",
    paymentStatus: "PARTIAL",
    totalAmount: 320000,
    isRushOrder: false,
    lead: { companyName: "Flipkart Pvt Ltd", contactPerson: "Rohan Mehta" },
    createdBy: { name: "Priya Sharma" },
    _count: { items: 2, payments: 1, dispatches: 0 },
  },
  {
    id: "ord-005",
    orderNumber: "ORD26-14089",
    clientName: "Sneha Iyer",
    companyName: "Swiggy Technologies",
    eventType: "CORPORATE",
    quantity: 250,
    deliveryDate: new Date("2026-05-10"),
    status: "DELIVERED",
    paymentStatus: "PAID",
    totalAmount: 180000,
    isRushOrder: false,
    lead: { companyName: "Swiggy Technologies", contactPerson: "Sneha Iyer" },
    createdBy: { name: "Nikhil Gorrepati" },
    _count: { items: 2, payments: 2, dispatches: 1 },
  },
  {
    id: "ord-006",
    orderNumber: "ORD26-14078",
    clientName: "Arnav Bose",
    companyName: "OYO Rooms",
    eventType: "CORPORATE",
    quantity: 300,
    deliveryDate: new Date("2026-05-30"),
    status: "ADVANCE_PENDING",
    paymentStatus: "PENDING",
    totalAmount: 240000,
    isRushOrder: false,
    lead: { companyName: "OYO Rooms", contactPerson: "Arnav Bose" },
    createdBy: { name: "Priya Sharma" },
    _count: { items: 2, payments: 0, dispatches: 0 },
  },
  {
    id: "ord-007",
    orderNumber: "ORD26-14055",
    clientName: "Divya Nambiar",
    companyName: "Ola Cabs",
    eventType: "CORPORATE",
    quantity: 150,
    deliveryDate: new Date("2026-04-30"),
    status: "DELIVERED",
    paymentStatus: "PAID",
    totalAmount: 95000,
    isRushOrder: false,
    lead: { companyName: "Ola Cabs", contactPerson: "Divya Nambiar" },
    createdBy: { name: "Priya Sharma" },
    _count: { items: 1, payments: 2, dispatches: 1 },
  },
  {
    id: "ord-008",
    orderNumber: "ORD26-14210",
    clientName: "Karan Oberoi",
    companyName: "Paytm",
    eventType: "CORPORATE",
    quantity: 200,
    deliveryDate: new Date("2026-05-13"),
    status: "QC_PASSED",
    paymentStatus: "PARTIAL",
    totalAmount: 175000,
    isRushOrder: true,
    lead: { companyName: "Paytm", contactPerson: "Karan Oberoi" },
    createdBy: { name: "Nikhil Gorrepati" },
    _count: { items: 2, payments: 1, dispatches: 0 },
  },
  {
    id: "ord-009",
    orderNumber: "ORD26-14185",
    clientName: "Pallavi Suresh",
    companyName: "PhonePe",
    eventType: "CORPORATE",
    quantity: 600,
    deliveryDate: new Date("2026-06-05"),
    status: "CONFIRMED",
    paymentStatus: "PAID",
    totalAmount: 450000,
    isRushOrder: false,
    lead: { companyName: "PhonePe", contactPerson: "Pallavi Suresh" },
    createdBy: { name: "Priya Sharma" },
    _count: { items: 4, payments: 1, dispatches: 0 },
  },
  {
    id: "ord-010",
    orderNumber: "ORD26-14190",
    clientName: "Hardik Desai",
    companyName: "CRED",
    eventType: "BIRTHDAY",
    quantity: 100,
    deliveryDate: new Date("2026-05-12"),
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    totalAmount: 80000,
    isRushOrder: false,
    lead: { companyName: "CRED", contactPerson: "Hardik Desai" },
    createdBy: { name: "Nikhil Gorrepati" },
    _count: { items: 1, payments: 1, dispatches: 0 },
  },
];

export const MOCK_PAYMENTS: MockPayment[] = [
  {
    id: "pay-001",
    orderId: "ord-001",
    orderNumber: "ORD26-14201",
    clientName: "Anita Nair",
    companyName: "Tata Consultancy Services",
    amount: 250000,
    type: "ADVANCE",
    status: "PAID",
    method: "NEFT",
    reference: "TXN-NEFT-20260501",
    dueDate: new Date("2026-05-05"),
    paidAt: new Date("2026-05-04"),
    createdAt: new Date("2026-05-01"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-002",
    orderId: "ord-001",
    orderNumber: "ORD26-14201",
    clientName: "Anita Nair",
    companyName: "Tata Consultancy Services",
    amount: 250000,
    type: "BALANCE",
    status: "PENDING",
    method: "NEFT",
    reference: null,
    dueDate: new Date("2026-05-25"),
    paidAt: null,
    createdAt: new Date("2026-05-01"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-003",
    orderId: "ord-002",
    orderNumber: "ORD26-14202",
    clientName: "Kavita Shah",
    companyName: "Reliance Industries",
    amount: 600000,
    type: "ADVANCE",
    status: "OVERDUE",
    method: "RTGS",
    reference: null,
    dueDate: new Date("2026-05-08"),
    paidAt: null,
    createdAt: new Date("2026-05-02"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-004",
    orderId: "ord-003",
    orderNumber: "ORD26-14203",
    clientName: "Tanvi Agrawal",
    companyName: "Zomato",
    amount: 25000,
    type: "FULL",
    status: "PAID",
    method: "UPI",
    reference: "UPI-8472920192",
    dueDate: new Date("2026-05-12"),
    paidAt: new Date("2026-05-12"),
    createdAt: new Date("2026-05-10"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-005",
    orderId: "ord-004",
    orderNumber: "ORD26-14156",
    clientName: "Rohan Mehta",
    companyName: "Flipkart Pvt Ltd",
    amount: 160000,
    type: "ADVANCE",
    status: "PAID",
    method: "NEFT",
    reference: "TXN-NEFT-20260503",
    dueDate: new Date("2026-05-05"),
    paidAt: new Date("2026-05-06"),
    createdAt: new Date("2026-04-30"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-006",
    orderId: "ord-004",
    orderNumber: "ORD26-14156",
    clientName: "Rohan Mehta",
    companyName: "Flipkart Pvt Ltd",
    amount: 160000,
    type: "BALANCE",
    status: "PENDING",
    method: "NEFT",
    reference: null,
    dueDate: new Date("2026-05-20"),
    paidAt: null,
    createdAt: new Date("2026-04-30"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-007",
    orderId: "ord-005",
    orderNumber: "ORD26-14089",
    clientName: "Sneha Iyer",
    companyName: "Swiggy Technologies",
    amount: 90000,
    type: "ADVANCE",
    status: "PAID",
    method: "RTGS",
    reference: "TXN-RTGS-20260415",
    dueDate: new Date("2026-04-20"),
    paidAt: new Date("2026-04-18"),
    createdAt: new Date("2026-04-15"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-008",
    orderId: "ord-005",
    orderNumber: "ORD26-14089",
    clientName: "Sneha Iyer",
    companyName: "Swiggy Technologies",
    amount: 90000,
    type: "BALANCE",
    status: "PAID",
    method: "RTGS",
    reference: "TXN-RTGS-20260508",
    dueDate: new Date("2026-05-08"),
    paidAt: new Date("2026-05-09"),
    createdAt: new Date("2026-04-15"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-009",
    orderId: "ord-007",
    orderNumber: "ORD26-14055",
    clientName: "Divya Nambiar",
    companyName: "Ola Cabs",
    amount: 95000,
    type: "FULL",
    status: "PAID",
    method: "Cheque",
    reference: "CHQ-112890",
    dueDate: new Date("2026-04-28"),
    paidAt: new Date("2026-04-27"),
    createdAt: new Date("2026-04-20"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-010",
    orderId: "ord-008",
    orderNumber: "ORD26-14210",
    clientName: "Karan Oberoi",
    companyName: "Paytm",
    amount: 87500,
    type: "ADVANCE",
    status: "PAID",
    method: "UPI",
    reference: "UPI-9928471902",
    dueDate: new Date("2026-05-08"),
    paidAt: new Date("2026-05-08"),
    createdAt: new Date("2026-05-06"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-011",
    orderId: "ord-008",
    orderNumber: "ORD26-14210",
    clientName: "Karan Oberoi",
    companyName: "Paytm",
    amount: 87500,
    type: "BALANCE",
    status: "PENDING",
    method: "UPI",
    reference: null,
    dueDate: new Date("2026-05-13"),
    paidAt: null,
    createdAt: new Date("2026-05-06"),
    createdBy: { name: "Sunita Patel" },
  },
  {
    id: "pay-012",
    orderId: "ord-009",
    orderNumber: "ORD26-14185",
    clientName: "Pallavi Suresh",
    companyName: "PhonePe",
    amount: 450000,
    type: "FULL",
    status: "PAID",
    method: "NEFT",
    reference: "TXN-NEFT-20260510",
    dueDate: new Date("2026-05-12"),
    paidAt: new Date("2026-05-11"),
    createdAt: new Date("2026-05-08"),
    createdBy: { name: "Sunita Patel" },
  },
];

export const MOCK_REVENUE_CHART = [
  { month: "Dec '25", revenue: 380000 },
  { month: "Jan '26", revenue: 520000 },
  { month: "Feb '26", revenue: 460000 },
  { month: "Mar '26", revenue: 780000 },
  { month: "Apr '26", revenue: 650000 },
  { month: "May '26", revenue: 920000 },
];

export const MOCK_ORDER_STAGES = [
  { name: "Confirmed", value: 2, color: "#3b82f6" },
  { name: "In Production", value: 1, color: "#8b5cf6" },
  { name: "QC Pending", value: 1, color: "#f59e0b" },
  { name: "QC Passed", value: 1, color: "#06b6d4" },
  { name: "Dispatched", value: 1, color: "#f97316" },
  { name: "Delivered", value: 2, color: "#22c55e" },
];

export const MOCK_STATS = {
  activeOrders: 7,
  totalOrders: 10,
  monthlyRevenue: 920000,
  revenueGrowth: 41.5,
  pendingPayments: 4,
  pendingAmount: 660000,
  delayedOrders: 1,
  totalLeads: 12,
  wonLeads: 3,
  conversionRate: 25,
  pendingQC: 2,
  pendingDispatch: 1,
  inventoryAlerts: 3,
  lowStockItems: 3,
};

// ─── Additional types ────────────────────────────────────────────────────────
export type ProductionStatus = "SCHEDULED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "DELAYED";
export type PackingStatus = "PENDING" | "IN_PROGRESS" | "PACKED" | "QC_PENDING" | "APPROVED" | "REJECTED";
export type QCResult = "PASS" | "FAIL_PACKING" | "FAIL_PRODUCT";
export type DispatchStatus = "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "RESCHEDULED";
export type InventoryTxType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
export type SampleStatus = "REQUESTED" | "IN_KITCHEN" | "READY" | "DELIVERED" | "APPROVED" | "NEEDS_CHANGES" | "CLOSED";
export type VendorOrderStatus = "DRAFT" | "PLACED" | "CONFIRMED" | "PARTIAL_RECEIVED" | "RECEIVED" | "CANCELLED" | "DELAYED";

export interface MockInventoryItem {
  id: string; name: string; sku: string | null; category: string; unit: string;
  currentStock: number; minStockLevel: number; reorderPoint: number; costPerUnit: number; location: string | null;
  transactions: { id: string; type: InventoryTxType; quantity: number; createdAt: Date; performedBy: { name: string } }[];
}

export interface MockProductionBatch {
  id: string; batchNumber: string; productName: string; quantity: number; status: ProductionStatus;
  scheduledDate: Date; deadline: Date; priority: number; notes: string | null; shortages: string | null;
  order: { orderNumber: string; clientName: string; isRushOrder: boolean };
  assignedTo: { name: string } | null;
  ingredients: { id: string; quantityNeeded: number; unit: string; inventoryItem: { name: string; unit: string; currentStock: number } }[];
}

export interface MockPackingUnit {
  id: string; unitNumber: number; status: PackingStatus;
  correctBox: boolean; productArranged: boolean; ribbonAdded: boolean; brandingDone: boolean; insertsAdded: boolean; labelAttached: boolean;
}

export interface MockPackingOrder {
  id: string; orderNumber: string; clientName: string; status: string; deliveryDate: Date;
  items: { productName: string; quantity: number }[];
  packingUnits: MockPackingUnit[];
}

export interface MockQCOrder {
  id: string; orderNumber: string; clientName: string; deliveryDate: Date;
  packingUnits: { id: string; unitNumber: number; status: string }[];
  qcLogs: { result: string; inspectedBy: { name: string }; createdAt: Date }[];
}

export interface MockVendorPO {
  id: string; poNumber: string; status: VendorOrderStatus; expectedDelivery: Date | null; totalAmount: number;
  items: { id: string; itemName: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }[];
}

export interface MockVendor {
  id: string; name: string; contactPerson: string; email: string; phone: string;
  city: string; category: string; rating: number | null; isActive: boolean;
  purchaseOrders: MockVendorPO[];
}

export interface MockDispatchOrder {
  id: string; orderNumber: string; clientName: string; status: string; deliveryDate: Date;
  deliveryAddresses: { id: string; recipientName: string; phone: string; addressLine1: string; city: string; state: string; pincode: string }[];
  dispatches: {
    id: string; challanNumber: string; status: DispatchStatus; driverName: string | null; vehicleNumber: string | null;
    podReceiverName: string | null; podTimestamp: Date | null; dispatchedAt: Date | null; deliveredAt: Date | null; dispatchedBy: { name: string } | null;
  }[];
}

export interface MockSample {
  id: string; sampleNumber: string; clientName: string; companyName: string | null; phone: string;
  eventType: EventType; status: SampleStatus; rating: number | null; feedbackNotes: string | null;
  createdAt: Date; deliveredAt: Date | null;
  requestedBy: { name: string };
  items: { productName: string; quantity: number; specifications: string | null }[];
}

export interface MockNotification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: Date; orderId: string | null;
}

export interface MockFeedback {
  id: string; clientName: string; companyName: string; orderNumber: string; orderId: string;
  overallRating: number; tasteRating: number | null; packagingRating: number | null; deliveryRating: number | null;
  wouldRecommend: boolean; wouldRepeatOrder: boolean; comments: string | null;
  collectedAt: Date; collectedBy: { name: string };
}

export interface MockOrderDetail {
  id: string; orderNumber: string; clientName: string; clientPhone: string | null; clientEmail: string | null; clientCompany: string | null;
  eventType: string; deliveryDate: Date; status: OrderStatus; paymentStatus: PaymentStatus;
  totalAmount: number; advanceAmount: number; paidAmount: number; balanceAmount: number;
  isRushOrder: boolean; notes: string | null; specialInstructions: string | null;
  // Branding & packing fields (used on production sheet, hidden from client docs)
  cardMessage?: string | null;
  ribbonColor?: string | null;
  logoPlacement?: string | null;
  brandingNotes?: string | null;
  dietaryNotes?: string | null;
  packagingNotes?: string | null;
  internalNotes?: string | null;
  createdBy: { name: string; email: string };
  items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number; packaging: string | null; branding: string | null }[];
  deliveryAddresses: { id: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; quantity?: number }[];
  payments: { id: string; amount: number; type: string; method: string; reference: string | null; createdAt: Date; verifiedAt: Date | null; verifiedBy: { name: string } | null }[];
  productionBatches: { id: string; batchNumber: string; productName: string; quantity: number; status: string; scheduledDate: Date; deadline?: Date | null; completedAt: Date | null; assignedTo: { name: string } | null; shortages?: string | null; notes?: string | null }[];
  packingUnits: { id: string; unitNumber: number; status: string; packedAt: Date | null }[];
  qcLogs: { id: string; result: string; createdAt: Date; inspectedBy: { name: string } }[];
  dispatches: { id: string; challanNumber: string; status: string; driverName: string | null; vehicleNumber: string | null; dispatchedAt: Date; deliveredAt: Date | null }[];
  auditLogs: { id: string; action: string; entity: string; createdAt: Date; user: { name: string } }[];
}

export const MOCK_INVENTORY: MockInventoryItem[] = [
  { id: "inv-001", name: "Diwali Hamper Box (Large)", sku: "BOX-DIW-LG", category: "Packaging", unit: "pcs", currentStock: 450, minStockLevel: 100, reorderPoint: 150, costPerUnit: 85, location: "Shelf A1", transactions: [{ id: "t1", type: "IN", quantity: 200, createdAt: new Date("2026-04-15"), performedBy: { name: "Prakash Tiwari" } }] },
  { id: "inv-002", name: "Gold Satin Ribbon", sku: "RBN-GOLD", category: "Packaging", unit: "meters", currentStock: 2400, minStockLevel: 500, reorderPoint: 700, costPerUnit: 8, location: "Shelf B1", transactions: [{ id: "t2", type: "OUT", quantity: 300, createdAt: new Date("2026-05-01"), performedBy: { name: "Deepa Yadav" } }] },
  { id: "inv-003", name: "Kaju Katli (Premium)", sku: "KAJU-KTL", category: "Sweet", unit: "kg", currentStock: 48, minStockLevel: 20, reorderPoint: 30, costPerUnit: 680, location: "Cold Storage C1", transactions: [{ id: "t3", type: "OUT", quantity: 37.5, createdAt: new Date("2026-05-03"), performedBy: { name: "Raj Kumar" } }] },
  { id: "inv-004", name: "Almonds (Roasted)", sku: "DRY-ALM", category: "Dry Fruit", unit: "kg", currentStock: 60, minStockLevel: 20, reorderPoint: 30, costPerUnit: 780, location: "Shelf D1", transactions: [] },
  { id: "inv-005", name: "Tissue Paper (Gold/Silver)", sku: "WRAP-TIS", category: "Packaging", unit: "sheets", currentStock: 85, minStockLevel: 200, reorderPoint: 300, costPerUnit: 3, location: "Shelf A3", transactions: [] },
  { id: "inv-006", name: "Corporate Gift Tag (Printed)", sku: "TAG-CORP", category: "Branding", unit: "pcs", currentStock: 1200, minStockLevel: 300, reorderPoint: 400, costPerUnit: 5, location: "Shelf E1", transactions: [] },
  { id: "inv-007", name: "Cashews (W240)", sku: "DRY-CSH", category: "Dry Fruit", unit: "kg", currentStock: 42, minStockLevel: 15, reorderPoint: 25, costPerUnit: 920, location: "Shelf D2", transactions: [] },
  { id: "inv-008", name: "Dark Chocolate (500g slab)", sku: "CHOC-BLK", category: "Ingredient", unit: "kg", currentStock: 28, minStockLevel: 10, reorderPoint: 15, costPerUnit: 420, location: "Cold Storage C3", transactions: [] },
  { id: "inv-009", name: "Chakli (Homemade)", sku: "CHRM-CHK", category: "Snack", unit: "kg", currentStock: 12, minStockLevel: 15, reorderPoint: 20, costPerUnit: 280, location: "Cold Storage C2", transactions: [{ id: "t5", type: "OUT", quantity: 23, createdAt: new Date("2026-05-02"), performedBy: { name: "Raj Kumar" } }] },
  { id: "inv-010", name: "Pure Cow Ghee (1L)", sku: "GHEE-COW", category: "Ingredient", unit: "liters", currentStock: 8, minStockLevel: 20, reorderPoint: 25, costPerUnit: 650, location: "Cold Storage C4", transactions: [] },
];

export const MOCK_PRODUCTION: MockProductionBatch[] = [
  { id: "batch-001", batchNumber: "BATCH-26-001", productName: "Premium Diwali Hamper Box", quantity: 1000, status: "IN_PROGRESS", scheduledDate: new Date("2026-05-10"), deadline: new Date("2026-05-25"), priority: 1, notes: "TCS order — priority batch", shortages: null, order: { orderNumber: "ORD26-14201", clientName: "Anita Nair", isRushOrder: false }, assignedTo: { name: "Raj Kumar" }, ingredients: [{ id: "bi-1", quantityNeeded: 250, unit: "kg", inventoryItem: { name: "Kaju Katli (Premium)", unit: "kg", currentStock: 48 } }, { id: "bi-2", quantityNeeded: 200, unit: "kg", inventoryItem: { name: "Almonds (Roasted)", unit: "kg", currentStock: 60 } }, { id: "bi-3", quantityNeeded: 1000, unit: "pcs", inventoryItem: { name: "Diwali Hamper Box (Large)", unit: "pcs", currentStock: 450 } }] },
  { id: "batch-002", batchNumber: "BATCH-26-002", productName: "Corporate Gift Box (Standard)", quantity: 320, status: "SCHEDULED", scheduledDate: new Date("2026-05-18"), deadline: new Date("2026-05-20"), priority: 2, notes: "Flipkart order", shortages: "Chakli — stock low (12kg, need 32kg)", order: { orderNumber: "ORD26-14156", clientName: "Rohan Mehta", isRushOrder: false }, assignedTo: { name: "Amit Singh" }, ingredients: [{ id: "bi-4", quantityNeeded: 32, unit: "kg", inventoryItem: { name: "Chakli (Homemade)", unit: "kg", currentStock: 12 } }, { id: "bi-5", quantityNeeded: 16, unit: "liters", inventoryItem: { name: "Pure Cow Ghee (1L)", unit: "liters", currentStock: 8 } }] },
  { id: "batch-003", batchNumber: "BATCH-26-003", productName: "Eco Hamper Box (Jute)", quantity: 175, status: "COMPLETED", scheduledDate: new Date("2026-05-05"), deadline: new Date("2026-05-13"), priority: 3, notes: "Paytm rush order — completed on time", shortages: null, order: { orderNumber: "ORD26-14210", clientName: "Karan Oberoi", isRushOrder: true }, assignedTo: { name: "Raj Kumar" }, ingredients: [{ id: "bi-6", quantityNeeded: 40, unit: "kg", inventoryItem: { name: "Cashews (W240)", unit: "kg", currentStock: 42 } }] },
];

export const MOCK_PACKING_ORDERS: MockPackingOrder[] = [
  { id: "ord-004", orderNumber: "ORD26-14156", clientName: "Rohan Mehta", status: "PACKING", deliveryDate: new Date("2026-05-20"), items: [{ productName: "Corporate Gift Box (Standard)", quantity: 320 }], packingUnits: Array.from({ length: 10 }, (_, i) => ({ id: `pu-${i + 1}`, unitNumber: i + 1, status: (i < 4 ? "PACKED" : "PENDING") as PackingStatus, correctBox: i < 4, productArranged: i < 4, ribbonAdded: i < 4, brandingDone: i < 4, insertsAdded: i < 4, labelAttached: i < 4 })) },
  { id: "ord-008", orderNumber: "ORD26-14210", clientName: "Karan Oberoi", status: "QC_PASSED", deliveryDate: new Date("2026-05-13"), items: [{ productName: "Eco Hamper Box (Jute)", quantity: 175 }], packingUnits: Array.from({ length: 8 }, (_, i) => ({ id: `pu-${i + 11}`, unitNumber: i + 1, status: "APPROVED" as PackingStatus, correctBox: true, productArranged: true, ribbonAdded: true, brandingDone: true, insertsAdded: true, labelAttached: true })) },
];

export const MOCK_QC_ORDERS: MockQCOrder[] = [
  { id: "ord-004", orderNumber: "ORD26-14156", clientName: "Rohan Mehta", deliveryDate: new Date("2026-05-20"), packingUnits: Array.from({ length: 10 }, (_, i) => ({ id: `pu-${i + 1}`, unitNumber: i + 1, status: i < 4 ? "PACKED" : "PENDING" })), qcLogs: [{ result: "PASS", inspectedBy: { name: "Vikram Singh" }, createdAt: new Date("2026-05-12T10:00:00") }, { result: "PASS", inspectedBy: { name: "Vikram Singh" }, createdAt: new Date("2026-05-12T10:30:00") }] },
  { id: "ord-008", orderNumber: "ORD26-14210", clientName: "Karan Oberoi", deliveryDate: new Date("2026-05-13"), packingUnits: Array.from({ length: 8 }, (_, i) => ({ id: `pu-${i + 11}`, unitNumber: i + 1, status: "APPROVED" })), qcLogs: Array.from({ length: 8 }, (_, i) => ({ result: "PASS", inspectedBy: { name: "Vikram Singh" }, createdAt: new Date(Date.now() - i * 3600000) })) },
];

export const MOCK_DISPATCH_ORDERS: MockDispatchOrder[] = [
  { id: "ord-003", orderNumber: "ORD26-14203", clientName: "Tanvi Agrawal", status: "DISPATCHED", deliveryDate: new Date("2026-05-14"), deliveryAddresses: [{ id: "da-1", recipientName: "Tanvi Agrawal", phone: "+91 9800000012", addressLine1: "Zomato HQ, Ground Floor", city: "Gurugram", state: "Haryana", pincode: "122001" }], dispatches: [{ id: "dis-1", challanNumber: "CH-26-0001", status: "OUT_FOR_DELIVERY" as DispatchStatus, driverName: "Suresh Yadav", vehicleNumber: "HR 26 AB 5678", podReceiverName: null, podTimestamp: null, dispatchedAt: new Date("2026-05-13T09:00:00"), deliveredAt: null, dispatchedBy: { name: "Ravi Kumar" } }] },
  { id: "ord-008", orderNumber: "ORD26-14210", clientName: "Karan Oberoi", status: "QC_PASSED", deliveryDate: new Date("2026-05-13"), deliveryAddresses: [{ id: "da-2", recipientName: "Karan Oberoi", phone: "+91 9800000099", addressLine1: "Paytm HQ, Sector 30", city: "Noida", state: "Uttar Pradesh", pincode: "201301" }], dispatches: [] },
  { id: "ord-005", orderNumber: "ORD26-14089", clientName: "Sneha Iyer", status: "DELIVERED", deliveryDate: new Date("2026-05-10"), deliveryAddresses: [{ id: "da-3", recipientName: "Sneha Iyer", phone: "+91 9800000005", addressLine1: "Swiggy Office, Koramangala", city: "Bengaluru", state: "Karnataka", pincode: "560034" }], dispatches: [{ id: "dis-2", challanNumber: "CH-26-0002", status: "DELIVERED" as DispatchStatus, driverName: "Mohan Lal", vehicleNumber: "KA 05 CD 9012", podReceiverName: "Sneha Iyer", podTimestamp: new Date("2026-05-10T14:30:00"), dispatchedAt: new Date("2026-05-10T08:00:00"), deliveredAt: new Date("2026-05-10T14:30:00"), dispatchedBy: { name: "Ravi Kumar" } }] },
];

export const MOCK_VENDORS: MockVendor[] = [
  { id: "vnd-001", name: "Raj Packaging Solutions", contactPerson: "Rajesh Agarwal", email: "raj.packaging@gmail.com", phone: "+91 99100 11111", city: "Bhiwandi", category: "Packaging", rating: 4.5, isActive: true, purchaseOrders: [{ id: "po-001", poNumber: "PO-26-001", status: "RECEIVED", expectedDelivery: new Date("2026-04-20"), totalAmount: 42500, items: [{ id: "poi-1", itemName: "Diwali Hamper Box (Large)", quantity: 300, unit: "pcs", unitPrice: 85, totalPrice: 25500 }] }, { id: "po-004", poNumber: "PO-26-004", status: "CONFIRMED", expectedDelivery: new Date("2026-05-18"), totalAmount: 38250, items: [{ id: "poi-5", itemName: "Medium Gift Box", quantity: 500, unit: "pcs", unitPrice: 60, totalPrice: 30000 }] }] },
  { id: "vnd-002", name: "Mittal Dry Fruits & Nuts", contactPerson: "Suresh Mittal", email: "mittal.dryfruits@gmail.com", phone: "+91 98200 22222", city: "Mumbai", category: "Raw Materials", rating: 4.8, isActive: true, purchaseOrders: [{ id: "po-002", poNumber: "PO-26-002", status: "CONFIRMED", expectedDelivery: new Date("2026-05-17"), totalAmount: 89600, items: [{ id: "poi-2", itemName: "Almonds (Roasted)", quantity: 60, unit: "kg", unitPrice: 780, totalPrice: 46800 }, { id: "poi-3", itemName: "Cashews (W240)", quantity: 46, unit: "kg", unitPrice: 920, totalPrice: 42320 }] }] },
  { id: "vnd-003", name: "PrintWorld Mumbai", contactPerson: "Amol Kulkarni", email: "printworld.mumbai@gmail.com", phone: "+91 98765 44444", city: "Mumbai", category: "Branding", rating: 3.9, isActive: true, purchaseOrders: [{ id: "po-003", poNumber: "PO-26-003", status: "DELAYED", expectedDelivery: new Date("2026-05-12"), totalAmount: 18500, items: [{ id: "poi-4", itemName: "Corporate Gift Tag (Printed)", quantity: 2000, unit: "pcs", unitPrice: 5, totalPrice: 10000 }] }] },
  { id: "vnd-004", name: "SweetCraft Confectionery", contactPerson: "Neha Jain", email: "sweetcraft@gmail.com", phone: "+91 91234 33333", city: "Mumbai", category: "Sweets", rating: 4.2, isActive: true, purchaseOrders: [] },
];

export const MOCK_SAMPLES: MockSample[] = [
  { id: "smp-001", sampleNumber: "SMP-26-001", clientName: "Vikram Reddy", companyName: "Infosys Limited", phone: "+91 9800000001", eventType: "DIWALI", status: "DELIVERED", rating: 4, feedbackNotes: "Good packaging, prefer larger box for premium feel", createdAt: new Date("2026-04-15"), deliveredAt: new Date("2026-04-22"), requestedBy: { name: "Priya Sharma" }, items: [{ productName: "Premium Diwali Hamper Box", quantity: 3, specifications: "Gold embossed box, kaju katli 250g, dry fruits 200g" }] },
  { id: "smp-002", sampleNumber: "SMP-26-002", clientName: "Suresh Menon", companyName: "Wipro Technologies", phone: "+91 9800000003", eventType: "CORPORATE", status: "IN_KITCHEN", rating: null, feedbackNotes: null, createdAt: new Date("2026-05-02"), deliveredAt: null, requestedBy: { name: "Nikhil Gorrepati" }, items: [{ productName: "Custom Branded Kit", quantity: 2, specifications: "Company logo on box, USB + diary + mug" }, { productName: "Chocolate Box", quantity: 1, specifications: "12-pc assorted chocolates" }] },
  { id: "smp-003", sampleNumber: "SMP-26-003", clientName: "Anita Nair", companyName: "Tata Consultancy Services", phone: "+91 9800000002", eventType: "CORPORATE", status: "APPROVED", rating: 5, feedbackNotes: "Perfect! Proceed with full order of 1000 units.", createdAt: new Date("2026-03-20"), deliveredAt: new Date("2026-03-28"), requestedBy: { name: "Priya Sharma" }, items: [{ productName: "Corporate Gift Box (Standard)", quantity: 5, specifications: "Standard corporate theme, blue ribbon" }] },
  { id: "smp-004", sampleNumber: "SMP-26-004", clientName: "Sameera Rao", companyName: "Biocon Limited", phone: "+91 9800000010", eventType: "CORPORATE", status: "READY", rating: null, feedbackNotes: null, createdAt: new Date("2026-05-08"), deliveredAt: null, requestedBy: { name: "Priya Sharma" }, items: [{ productName: "Wellness Hamper", quantity: 2, specifications: "Herbal teas, protein bars, dry fruits" }] },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: "notif-001", type: "RUSH_ORDER", title: "Rush Order Received", message: "Rush order ORD26-14210 from Paytm — 175 eco hampers. Delivery in 2 days!", isRead: false, createdAt: new Date("2026-05-12T08:00:00"), orderId: "ord-008" },
  { id: "notif-002", type: "VENDOR_LATE", title: "Vendor Delivery Overdue", message: "PrintWorld Mumbai (PO-26-003) is 2 days overdue. Branding tags pending for 3 orders.", isRead: false, createdAt: new Date("2026-05-13T09:00:00"), orderId: null },
  { id: "notif-003", type: "ADVANCE_PENDING", title: "Advance Payment Overdue", message: "Order ORD26-14202 (Reliance Industries) — advance of 6,00,000 overdue since May 8.", isRead: false, createdAt: new Date("2026-05-09T10:00:00"), orderId: "ord-002" },
  { id: "notif-004", type: "GENERAL", title: "Quote Approved", message: "QT-26-0001 for TCS has been approved.", isRead: true, createdAt: new Date("2026-05-06T14:00:00"), orderId: null },
  { id: "notif-005", type: "QC_FAIL", title: "QC Failure Alert", message: "Unit #7 of order ORD26-14156 failed QC — branding issue. Sent back to packing.", isRead: false, createdAt: new Date("2026-05-12T16:00:00"), orderId: "ord-004" },
  { id: "notif-006", type: "BALANCE_DUE", title: "Balance Payment Due", message: "Order ORD26-14201 (TCS) — balance of 2,50,000 due on delivery May 25.", isRead: true, createdAt: new Date("2026-05-08T11:00:00"), orderId: "ord-001" },
  { id: "notif-007", type: "ORDER_DELAYED", title: "Order Falling Behind", message: "BATCH-26-002 production at 35%. Delivery date May 20 may be missed.", isRead: false, createdAt: new Date("2026-05-13T07:00:00"), orderId: "ord-004" },
];

export const MOCK_FEEDBACK: MockFeedback[] = [
  { id: "fb-001", clientName: "Tanvi Agrawal", companyName: "Zomato", orderNumber: "ORD26-14203", orderId: "ord-003", overallRating: 5, tasteRating: 5, packagingRating: 5, deliveryRating: 4, wouldRecommend: true, wouldRepeatOrder: true, comments: "Absolutely loved the hampers! Packaging was stunning and sweets were fresh. Will order again for Diwali.", collectedAt: new Date("2026-05-14"), collectedBy: { name: "Priya Sharma" } },
  { id: "fb-002", clientName: "Sneha Iyer", companyName: "Swiggy Technologies", orderNumber: "ORD26-14089", orderId: "ord-005", overallRating: 4, tasteRating: 4, packagingRating: 5, deliveryRating: 4, wouldRecommend: true, wouldRepeatOrder: true, comments: "Great quality boxes! Delivery was a day early which was a pleasant surprise.", collectedAt: new Date("2026-05-11"), collectedBy: { name: "Priya Sharma" } },
  { id: "fb-003", clientName: "Divya Nambiar", companyName: "Ola Cabs", orderNumber: "ORD26-14055", orderId: "ord-007", overallRating: 3, tasteRating: 3, packagingRating: 4, deliveryRating: 4, wouldRecommend: false, wouldRepeatOrder: false, comments: "Packaging was good but the chakli wasn't fresh. Need to improve product quality.", collectedAt: new Date("2026-05-01"), collectedBy: { name: "Nikhil Gorrepati" } },
];

export const MOCK_ORDER_DETAIL: MockOrderDetail = {
  id: "ord-001",
  orderNumber: "ORD26-14201",
  clientName: "Anita Nair",
  clientPhone: "+91 9800000002",
  clientEmail: "anita.nair@tcs.com",
  clientCompany: "Tata Consultancy Services",
  eventType: "CORPORATE",
  deliveryDate: new Date("2026-05-25"),
  status: "IN_PRODUCTION",
  paymentStatus: "PARTIAL",
  totalAmount: 500000,
  advanceAmount: 250000,
  paidAmount: 250000,
  balanceAmount: 250000,
  isRushOrder: false,
  notes: "Priority corporate order — 1000 units. Premium packaging required.",
  specialInstructions: "Each box must have a personalized message card with the employee name printed. Verify name list before printing.",
  // ── Packing & branding ────────────────────────────────────────────────────
  cardMessage: "Wishing you a wonderful year ahead — with warm regards from TCS Leadership",
  ribbonColor: "Navy Blue (#003087) with gold edge — client brand colour",
  logoPlacement: "Top-centre of outer box lid (embossed), inner tissue centre sticker",
  brandingNotes: "TCS logo files provided. Use high-resolution vector. No text below logo on box lid.",
  dietaryNotes: "Kaju katli contains tree nuts (cashew). Mark allergen sticker on each box. No pork / beef products.",
  packagingNotes: "Use rigid gift box (not foldable). Tissue in navy + gold. Shred filler in gold. Seal with wax stamp.",
  internalNotes: "Client visited showroom on Apr 28 — approved sample #SMP-26-003. No changes since.",
  createdBy: { name: "Priya Sharma", email: "priya@giftingops.com" },
  items: [
    { id: "oi-1", productName: "Premium Corporate Gift Box", quantity: 800, unitPrice: 450, totalPrice: 360000, packaging: "Rigid Navy Blue Box (305×255×100mm)", branding: "TCS Logo embossed on lid + Employee Name Card (A6, printed)" },
    { id: "oi-2", productName: "Luxury Add-on Pack", quantity: 200, unitPrice: 700, totalPrice: 140000, packaging: "Premium Gold Gift Box (280×200×80mm)", branding: "TCS Logo embossed + Special Message Card (gold foil)" },
  ],
  deliveryAddresses: [
    { id: "da-1", recipientName: "Anita Nair (Attn: Facilities Team)", phone: "+91 9800000002", addressLine1: "TCS Campus, Sahyadri Park, Building 4", addressLine2: "Gate 2 — goods entrance, ground floor", city: "Pune", state: "Maharashtra", pincode: "411057", quantity: 1000 },
  ],
  payments: [
    { id: "pay-001", amount: 250000, type: "ADVANCE", method: "NEFT", reference: "TXN-NEFT-20260501", createdAt: new Date("2026-05-01"), verifiedAt: new Date("2026-05-04"), verifiedBy: { name: "Sunita Patel" } },
  ],
  productionBatches: [
    { id: "batch-001", batchNumber: "BATCH-26-001", productName: "Premium Corporate Gift Box", quantity: 800, status: "IN_PROGRESS", scheduledDate: new Date("2026-05-10"), deadline: new Date("2026-05-22"), completedAt: null, assignedTo: { name: "Raj Kumar" }, shortages: null, notes: "TCS main batch — navy box + name cards. Coordinate with PrintWorld for name card delivery." },
    { id: "batch-002", batchNumber: "BATCH-26-002", productName: "Luxury Add-on Pack", quantity: 200, status: "SCHEDULED", scheduledDate: new Date("2026-05-15"), deadline: new Date("2026-05-23"), completedAt: null, assignedTo: { name: "Amit Singh" }, shortages: "Gold foil cards pending from PrintWorld (ETA May 16)", notes: "Start only after gold foil cards arrive. Do not substitute." },
  ],
  packingUnits: [],
  qcLogs: [],
  dispatches: [],
  auditLogs: [
    { id: "al-1", action: "Order created", entity: "Order", createdAt: new Date("2026-05-01T09:00:00"), user: { name: "Priya Sharma" } },
    { id: "al-2", action: "Advance payment verified", entity: "Payment", createdAt: new Date("2026-05-04T14:30:00"), user: { name: "Sunita Patel" } },
    { id: "al-3", action: "Production batch BATCH-26-001 started", entity: "ProductionBatch", createdAt: new Date("2026-05-10T08:00:00"), user: { name: "Raj Kumar" } },
    { id: "al-4", action: "Production batch BATCH-26-002 scheduled", entity: "ProductionBatch", createdAt: new Date("2026-05-10T08:30:00"), user: { name: "Priya Sharma" } },
  ],
};

export const MOCK_ACCOUNTS_ORDERS = [
  { id: "ord-001", orderNumber: "ORD26-14201", clientName: "Anita Nair", totalAmount: 500000, balanceAmount: 250000, advanceAmount: 250000, paymentStatus: "PARTIAL", deliveryDate: new Date("2026-05-25"), lead: { companyName: "Tata Consultancy Services" }, payments: [{ id: "pay-001", amount: 250000, type: "ADVANCE", createdAt: new Date("2026-05-01") }] },
  { id: "ord-002", orderNumber: "ORD26-14202", clientName: "Kavita Shah", totalAmount: 1500000, balanceAmount: 1500000, advanceAmount: 0, paymentStatus: "PENDING", deliveryDate: new Date("2026-06-10"), lead: { companyName: "Reliance Industries" }, payments: [] },
  { id: "ord-004", orderNumber: "ORD26-14156", clientName: "Rohan Mehta", totalAmount: 320000, balanceAmount: 160000, advanceAmount: 160000, paymentStatus: "PARTIAL", deliveryDate: new Date("2026-05-20"), lead: { companyName: "Flipkart Pvt Ltd" }, payments: [{ id: "pay-005", amount: 160000, type: "ADVANCE", createdAt: new Date("2026-04-30") }] },
  { id: "ord-006", orderNumber: "ORD26-14078", clientName: "Arnav Bose", totalAmount: 240000, balanceAmount: 240000, advanceAmount: 0, paymentStatus: "PENDING", deliveryDate: new Date("2026-05-30"), lead: { companyName: "OYO Rooms" }, payments: [] },
  { id: "ord-008", orderNumber: "ORD26-14210", clientName: "Karan Oberoi", totalAmount: 175000, balanceAmount: 87500, advanceAmount: 87500, paymentStatus: "PARTIAL", deliveryDate: new Date("2026-05-13"), lead: { companyName: "Paytm" }, payments: [{ id: "pay-010", amount: 87500, type: "ADVANCE", createdAt: new Date("2026-05-08") }] },
];

export const MOCK_ACCOUNTS_PAYMENTS = [
  { id: "pay-001", amount: 250000, type: "ADVANCE", createdAt: new Date("2026-05-01"), transactionId: "TXN-NEFT-20260501", verifiedAt: new Date("2026-05-04"), order: { orderNumber: "ORD26-14201", clientName: "Anita Nair" }, verifiedBy: { name: "Sunita Patel" } },
  { id: "pay-004", amount: 25000, type: "FULL", createdAt: new Date("2026-05-12"), transactionId: "UPI-8472920192", verifiedAt: new Date("2026-05-12"), order: { orderNumber: "ORD26-14203", clientName: "Tanvi Agrawal" }, verifiedBy: { name: "Sunita Patel" } },
  { id: "pay-005", amount: 160000, type: "ADVANCE", createdAt: new Date("2026-05-06"), transactionId: "TXN-NEFT-20260503", verifiedAt: new Date("2026-05-07"), order: { orderNumber: "ORD26-14156", clientName: "Rohan Mehta" }, verifiedBy: { name: "Sunita Patel" } },
  { id: "pay-010", amount: 87500, type: "ADVANCE", createdAt: new Date("2026-05-08"), transactionId: "UPI-9928471902", verifiedAt: new Date("2026-05-08"), order: { orderNumber: "ORD26-14210", clientName: "Karan Oberoi" }, verifiedBy: { name: "Sunita Patel" } },
  { id: "pay-012", amount: 450000, type: "FULL", createdAt: new Date("2026-05-11"), transactionId: "TXN-NEFT-20260510", verifiedAt: null, order: { orderNumber: "ORD26-14185", clientName: "Pallavi Suresh" }, verifiedBy: null },
];

export const MOCK_INVOICES = [
  { id: "inv-001", invoiceNumber: "INV-26-0001", totalAmount: 25000, paidAmount: 25000, balanceAmount: 0, dueDate: new Date("2026-05-14"), order: { orderNumber: "ORD26-14203", clientName: "Tanvi Agrawal" }, createdAt: new Date("2026-05-12") },
  { id: "inv-002", invoiceNumber: "INV-26-0002", totalAmount: 95000, paidAmount: 95000, balanceAmount: 0, dueDate: new Date("2026-04-30"), order: { orderNumber: "ORD26-14055", clientName: "Divya Nambiar" }, createdAt: new Date("2026-04-28") },
  { id: "inv-003", invoiceNumber: "INV-26-0003", totalAmount: 450000, paidAmount: 450000, balanceAmount: 0, dueDate: new Date("2026-05-12"), order: { orderNumber: "ORD26-14185", clientName: "Pallavi Suresh" }, createdAt: new Date("2026-05-10") },
];

// ─── Product catalog ─────────────────────────────────────────────────────────

export type ProductCategory = "HAMPER" | "BOX" | "BASKET" | "ADDON";

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  basePrice: number;
  gstRate: 0 | 5 | 12 | 18;
  unit: string;
  minQty: number;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  { id: "prod-001", name: "Diwali Premium Dry Fruit Hamper", description: "Assorted premium dry fruits — kaju, badam, pista — in luxury rigid gift box with ribbon", category: "HAMPER", basePrice: 850, gstRate: 5, unit: "piece", minQty: 50 },
  { id: "prod-002", name: "Corporate Gift Box (Standard)", description: "Chocolates, dry fruits & branded sticker on matte box — perfect for 100+ orders", category: "BOX", basePrice: 450, gstRate: 5, unit: "piece", minQty: 100 },
  { id: "prod-003", name: "Corporate Gift Box (Premium)", description: "Belgian chocolates, mixed nuts, Diwali sweets & personalised card in premium rigid box", category: "BOX", basePrice: 750, gstRate: 5, unit: "piece", minQty: 50 },
  { id: "prod-004", name: "Eco Hamper (Jute Basket)", description: "Sustainably sourced dry fruits & artisan snacks in handwoven jute basket", category: "BASKET", basePrice: 650, gstRate: 5, unit: "piece", minQty: 25 },
  { id: "prod-005", name: "Wedding Welcome Hamper", description: "Assorted Indian sweets, dry fruits & personalised message card in velvet bag", category: "HAMPER", basePrice: 1200, gstRate: 5, unit: "piece", minQty: 25 },
  { id: "prod-006", name: "Mithai Gift Box (Assorted)", description: "Kaju katli, besan ladoo & chocolate barfi — 500g assortment in printed box", category: "BOX", basePrice: 380, gstRate: 5, unit: "piece", minQty: 50 },
  { id: "prod-007", name: "Chocolate & Nut Gift Box", description: "Premium dark & milk chocolates + mixed nuts in gift box — ideal for Western clients", category: "BOX", basePrice: 520, gstRate: 18, unit: "piece", minQty: 50 },
  { id: "prod-008", name: "Festival Combo (Sweets + Dry Fruits)", description: "250g house-made sweets + 250g premium mixed dry fruits in dual-compartment box", category: "HAMPER", basePrice: 490, gstRate: 5, unit: "piece", minQty: 100 },
  { id: "prod-009", name: "Executive Gifting Set", description: "Premium diary, metal pen, dry fruit mix & branded packaging — high-value corporate gift", category: "HAMPER", basePrice: 1450, gstRate: 18, unit: "piece", minQty: 25 },
  { id: "prod-010", name: "Budget Corporate Box", description: "Standard dry fruit mix (200g) in simple kraft gift box — best value for high volume", category: "BOX", basePrice: 250, gstRate: 5, unit: "piece", minQty: 200 },
  { id: "prod-011", name: "Holi Colour Hamper", description: "Organic gulal pack + sweets + dry fruits — curated for Holi gifting", category: "HAMPER", basePrice: 420, gstRate: 5, unit: "piece", minQty: 50 },
  { id: "prod-012", name: "Custom Branded Hamper", description: "Fully customised content, client logo print on box, custom ribbon & message card", category: "HAMPER", basePrice: 0, gstRate: 5, unit: "piece", minQty: 100 },
  { id: "prod-013", name: "Extra: Premium Ribbon & Gift Tag", description: "Satin ribbon (custom colour) with printed gift tag — per piece", category: "ADDON", basePrice: 45, gstRate: 18, unit: "set", minQty: 1 },
  { id: "prod-014", name: "Extra: Logo Print on Box", description: "1-colour logo print on outer box or tissue paper — per piece", category: "ADDON", basePrice: 30, gstRate: 18, unit: "piece", minQty: 50 },
  { id: "prod-015", name: "Extra: Rigid Box Upgrade", description: "Upgrade from foldable to rigid gift box — per piece", category: "ADDON", basePrice: 75, gstRate: 18, unit: "piece", minQty: 1 },
];

// ─── Quotations ───────────────────────────────────────────────────────────────

export interface MockQuoteItem {
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;   // percentage
  gstRate: number;    // percentage
  totalPrice: number;
}

export interface MockQuote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany: string;
  eventType: string;
  eventDate?: Date;
  validUntil: Date;
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  deliveryCharge: number;
  packagingCharge: number;
  brandingCharge: number;
  grandTotal: number;
  status: string;
  notes?: string;
  terms?: string;
  items: MockQuoteItem[];
  lead?: { clientName: string; company?: string };
  createdBy?: { name: string };
  approvedBy?: { name: string } | null;
  createdAt: Date;
}

export const MOCK_QUOTES: MockQuote[] = [
  {
    id: "qt-001",
    quoteNumber: "QT-26-0001",
    clientName: "Anita Nair",
    clientEmail: "anita.nair@tcs.com",
    clientPhone: "+91 98100 22334",
    clientCompany: "Tata Consultancy Services",
    eventType: "CORPORATE",
    validUntil: new Date("2026-06-15"),
    subtotal: 450000,
    totalDiscount: 45000,
    totalGst: 20250,
    deliveryCharge: 15000,
    packagingCharge: 0,
    brandingCharge: 25000,
    grandTotal: 465250,
    status: "ACCEPTED",
    notes: "Delivery required across 3 Mumbai locations. Coordinate with their HR team.",
    terms: "50% advance on confirmation. Balance within 3 days of delivery. GST as applicable.",
    items: [
      { productName: "Corporate Gift Box (Standard)", description: "Chocolates, dry fruits & branded sticker on matte box", quantity: 1000, unitPrice: 450, discount: 10, gstRate: 5, totalPrice: 425250 },
    ],
    createdBy: { name: "Priya Sharma" },
    approvedBy: { name: "Nikhil Gorrepati" },
    createdAt: new Date("2026-04-20"),
  },
  {
    id: "qt-002",
    quoteNumber: "QT-26-0002",
    clientName: "Vikram Reddy",
    clientEmail: "vikram.reddy@infosys.com",
    clientPhone: "+91 98200 55667",
    clientCompany: "Infosys Limited",
    eventType: "DIWALI",
    validUntil: new Date("2026-07-01"),
    subtotal: 425000,
    totalDiscount: 0,
    totalGst: 21250,
    deliveryCharge: 10000,
    packagingCharge: 0,
    brandingCharge: 18750,
    grandTotal: 475000,
    status: "SENT",
    notes: "Client wants delivery before Oct 15. Confirm box colour preference (gold or red).",
    terms: "50% advance on confirmation. Balance within 3 days of delivery. GST as applicable.",
    items: [
      { productName: "Diwali Premium Dry Fruit Hamper", description: "Assorted premium dry fruits in luxury rigid gift box", quantity: 500, unitPrice: 850, discount: 0, gstRate: 5, totalPrice: 446250 },
    ],
    createdBy: { name: "Priya Sharma" },
    approvedBy: null,
    createdAt: new Date("2026-05-01"),
  },
  {
    id: "qt-003",
    quoteNumber: "QT-26-0003",
    clientName: "Meena Krishnan",
    clientEmail: "meena.krishnan@hdfc.com",
    clientPhone: "+91 99300 44556",
    clientCompany: "HDFC Bank",
    eventType: "CORPORATE",
    validUntil: new Date("2026-05-30"),
    subtotal: 980000,
    totalDiscount: 49000,
    totalGst: 46550,
    deliveryCharge: 20000,
    packagingCharge: 0,
    brandingCharge: 30000,
    grandTotal: 1027550,
    status: "PENDING_APPROVAL",
    notes: "2000 kits for employee appreciation. Delivery in phases — 1000 in Oct, 1000 in Nov.",
    terms: "50% advance on confirmation. Balance within 3 days of delivery. GST as applicable.",
    items: [
      { productName: "Corporate Gift Box (Premium)", description: "Belgian chocolates, mixed nuts & personalised card", quantity: 2000, unitPrice: 490, discount: 5, gstRate: 5, totalPrice: 977550 },
    ],
    createdBy: { name: "Priya Sharma" },
    approvedBy: null,
    createdAt: new Date("2026-05-10"),
  },
  {
    id: "qt-004",
    quoteNumber: "QT-26-0004",
    clientName: "Rohit Verma",
    clientEmail: "rohit.v@bajajfinance.com",
    clientPhone: "+91 98765 11223",
    clientCompany: "Bajaj Finance",
    eventType: "CORPORATE",
    validUntil: new Date("2026-06-25"),
    subtotal: 208000,
    totalDiscount: 0,
    totalGst: 10400,
    deliveryCharge: 5000,
    packagingCharge: 0,
    brandingCharge: 12000,
    grandTotal: 235400,
    status: "DRAFT",
    notes: "Thank-you hampers for top dealers. Confirm final quantity by May 20.",
    terms: "50% advance on confirmation. Balance within 3 days of delivery. GST as applicable.",
    items: [
      { productName: "Festival Combo (Sweets + Dry Fruits)", description: "250g sweets + 250g premium mixed dry fruits", quantity: 400, unitPrice: 490, discount: 0, gstRate: 5, totalPrice: 225400 },
      { productName: "Extra: Premium Ribbon & Gift Tag", description: "Satin ribbon with printed tag", quantity: 400, unitPrice: 45, discount: 0, gstRate: 18, totalPrice: 21240 },
    ],
    createdBy: { name: "Nikhil Gorrepati" },
    approvedBy: null,
    createdAt: new Date("2026-05-12"),
  },
];

export const MOCK_REPORTS_MONTHLY = [
  { month: "Dec '25", revenue: 380000, orders: 8, leads: 15 },
  { month: "Jan '26", revenue: 520000, orders: 11, leads: 20 },
  { month: "Feb '26", revenue: 460000, orders: 9, leads: 18 },
  { month: "Mar '26", revenue: 780000, orders: 16, leads: 25 },
  { month: "Apr '26", revenue: 650000, orders: 13, leads: 22 },
  { month: "May '26", revenue: 920000, orders: 18, leads: 28 },
];

export const MOCK_TOP_CLIENTS = [
  { name: "Tata Consultancy Services", revenue: 500000 },
  { name: "Reliance Industries", revenue: 1500000 },
  { name: "PhonePe", revenue: 450000 },
  { name: "Flipkart", revenue: 320000 },
  { name: "Paytm", revenue: 175000 },
];

export const MOCK_CONVERSION_DATA = [
  { name: "Won", value: 3, color: "#22c55e" },
  { name: "In Progress", value: 5, color: "#3b82f6" },
  { name: "Lost", value: 4, color: "#ef4444" },
];

// ─── Extended dashboard stats ────────────────────────────────────────────────
export const MOCK_EXTENDED_STATS = {
  // Production floor
  hamsersInProduction: 1175,      // total units currently in kitchen/assembly
  batchesInProgress: 1,
  batchesScheduled: 1,
  // QC
  qcUnitsToday: 10,
  qcPassedToday: 8,
  qcFailedToday: 2,
  // Dispatch
  dispatchedToday: 1,
  awaitingDispatch: 1,            // QC_PASSED orders not yet dispatched
  // Financial
  overdueAmount: 600000,
  avgOrderValue: 293000,
  collectedThisMonth: 1052500,
  // Sales CRM
  pipelineValue: 2050000,         // sum of active lead budgets
  followUpsDueToday: 3,
  // Procurement
  vendorDelays: 1,
  pendingPOs: 2,
  // Rush
  rushOrders: 2,
  // Season
  nextSeasonName: "Diwali 2026",
  nextSeasonDays: 158,            // May 15, 2026 → Oct 20, 2026
  seasonOrdersConfirmed: 2,
  seasonConfirmedValue: 1775000,
  seasonPipelineLeads: 8,
  seasonPipelineValue: 2625000,
};

export const MOCK_TODAY_FLOOR = {
  hamsersAssembled: 48,
  unitsPacked: 48,
  qcPassed: 8,
  shipmentsOut: 1,
};

export const MOCK_UPCOMING_DELIVERIES = [
  {
    orderId: "ord-008", orderNumber: "ORD26-14210",
    clientName: "Karan Oberoi", company: "Paytm",
    city: "Noida, UP", deliveryDate: new Date("2026-05-15"),
    status: "QC_PASSED", quantity: 175, eventType: "CORPORATE", isRushOrder: true,
  },
  {
    orderId: "ord-003", orderNumber: "ORD26-14203",
    clientName: "Tanvi Agrawal", company: "Zomato",
    city: "Gurugram, HR", deliveryDate: new Date("2026-05-16"),
    status: "DISPATCHED", quantity: 50, eventType: "BIRTHDAY", isRushOrder: true,
  },
  {
    orderId: "ord-006", orderNumber: "ORD26-14078",
    clientName: "Arnav Bose", company: "OYO Rooms",
    city: "Bengaluru, KA", deliveryDate: new Date("2026-05-30"),
    status: "ADVANCE_PENDING", quantity: 400, eventType: "CORPORATE", isRushOrder: false,
  },
  {
    orderId: "ord-004", orderNumber: "ORD26-14156",
    clientName: "Rohan Mehta", company: "Flipkart",
    city: "Bengaluru, KA", deliveryDate: new Date("2026-05-20"),
    status: "QC_PENDING", quantity: 320, eventType: "CORPORATE", isRushOrder: false,
  },
  {
    orderId: "ord-001", orderNumber: "ORD26-14201",
    clientName: "Anita Nair", company: "TCS",
    city: "Pune, MH", deliveryDate: new Date("2026-05-25"),
    status: "IN_PRODUCTION", quantity: 1000, eventType: "CORPORATE", isRushOrder: false,
  },
];

export const MOCK_EVENT_BREAKDOWN = [
  { event: "Corporate Gifting", orders: 6, revenue: 1685000, color: "#3b82f6" },
  { event: "Diwali Hampers", orders: 2, revenue: 1775000, color: "#f97316" },
  { event: "Birthday / Celebration", orders: 2, revenue: 105000, color: "#8b5cf6" },
];

export const MOCK_LIVE_ALERTS = [
  {
    id: "alert-1", type: "PRODUCTION_DELAY", severity: "high",
    title: "BATCH-26-002 Behind Schedule",
    message: "Chakli stock low (12 kg, need 32 kg). Production for Flipkart order may be delayed.",
    link: "/production",
    orderId: "ord-004",
  },
  {
    id: "alert-2", type: "VENDOR_DELAY", severity: "high",
    title: "Vendor Delay — PrintWorld Mumbai",
    message: "PO-26-003 (gift tags) is 3 days overdue. Affects branding on 3 active orders.",
    link: "/vendors",
    orderId: null,
  },
  {
    id: "alert-3", type: "PAYMENT_OVERDUE", severity: "high",
    title: "Advance Overdue — Reliance Industries",
    message: "ORD26-14202: ₹6,00,000 advance due May 8. Order on hold till payment received.",
    link: "/accounts",
    orderId: "ord-002",
  },
  {
    id: "alert-4", type: "DISPATCH_READY", severity: "info",
    title: "Ready for Dispatch — Paytm",
    message: "ORD26-14210 (175 eco hampers) cleared QC. Book vehicle and raise challan.",
    link: "/dispatch",
    orderId: "ord-008",
  },
];

// ─── Lifecycle history for mock order detail ─────────────────────────────────
// Used by the OrderLifecycleTracker on the order detail page
export const MOCK_ORDER_LIFECYCLE_HISTORY = [
  {
    stage: "LEAD" as const,
    enteredAt: new Date("2026-03-15T10:00:00"),
    by: "Priya Sharma",
    note: "Enquiry received from TCS HR — 1000 corporate gift boxes for employee appreciation.",
  },
  {
    stage: "SAMPLE_REQUESTED" as const,
    enteredAt: new Date("2026-03-18T11:30:00"),
    by: "Priya Sharma",
    note: "Client requested 5 sample boxes before committing.",
  },
  {
    stage: "SAMPLE_APPROVED" as const,
    enteredAt: new Date("2026-03-28T14:00:00"),
    by: "Priya Sharma",
    note: "Anita Nair approved. Feedback: Excellent presentation, loved the blue ribbon.",
  },
  {
    stage: "QUOTE_SENT" as const,
    enteredAt: new Date("2026-04-02T09:00:00"),
    by: "Priya Sharma",
    note: "QT-26-0001 sent — ₹5,00,000 for 1000 units at ₹450/unit + GST.",
  },
  {
    stage: "CONFIRMED" as const,
    enteredAt: new Date("2026-04-20T16:00:00"),
    by: "Nikhil Gorrepati",
    note: "Quote accepted. PO received from TCS. Order confirmed.",
  },
  {
    stage: "ADVANCE_RECEIVED" as const,
    enteredAt: new Date("2026-05-04T11:00:00"),
    by: "Sunita Patel",
    note: "₹2,50,000 advance received via NEFT. TXN: TXN-NEFT-20260501. Verified.",
  },
  {
    stage: "IN_PRODUCTION" as const,
    enteredAt: new Date("2026-05-10T08:00:00"),
    by: "Raj Kumar",
    note: "BATCH-26-001 started. Target: 1000 units. Estimated completion May 20.",
  },
];
