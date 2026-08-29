/**
 * GiftingOps — Database Seed
 *
 * Populates a fresh PostgreSQL database with realistic demo data.
 * All field names match prisma/schema.prisma exactly.
 *
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hash = (p: string) => bcrypt.hash(p, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);
const daysAhead = (n: number) => new Date(Date.now() + n * 864e5);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding GiftingOps database…\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const [admin, owner, sales, sales2, chef, production, packing, qc, dispatch, accounts, store] =
    await Promise.all([
      upsertUser("admin@giftingops.in",  await hash("admin1234"),  "Arjun Mehta",   "ADMIN",      "+91 98100 00001"),
      upsertUser("owner@giftingops.in",  await hash("owner1234"),  "Kavita Sharma", "OWNER",      "+91 98100 00002"),
      upsertUser("sales@giftingops.in",  await hash("sales1234"),  "Rohit Gupta",   "SALES",      "+91 98100 00003"),
      upsertUser("sales2@giftingops.in", await hash("sales1234"),  "Pooja Nair",    "SALES",      "+91 98100 00010"),
      upsertUser("chef@giftingops.in",   await hash("chef1234"),   "Sunita Rao",    "CHEF_OPS",   "+91 98100 00004"),
      upsertUser("prod@giftingops.in",   await hash("prod1234"),   "Manoj Patel",   "PRODUCTION", "+91 98100 00005"),
      upsertUser("pack@giftingops.in",   await hash("pack1234"),   "Deepa Yadav",   "PACKING",    "+91 98100 00006"),
      upsertUser("qc@giftingops.in",     await hash("qc12345678"), "Vikram Singh",  "QC",         "+91 98100 00007"),
      upsertUser("dispatch@giftingops.in",await hash("disp1234"),  "Ravi Kumar",    "DISPATCH",   "+91 98100 00008"),
      upsertUser("accounts@giftingops.in",await hash("acc01234"),  "Anita Joshi",   "ACCOUNTS",   "+91 98100 00009"),
      upsertUser("store@giftingops.in",  await hash("store123"),   "Prakash Tiwari","STORE",      "+91 98100 00011"),
    ]);
  console.log("✅  Users (11)");

  // Silence unused variable warnings
  void production; void packing; void store;

  // ── Inventory ──────────────────────────────────────────────────────────────
  const inv = await Promise.all([
    upsertInventory("BOX-DIW-LG",    "Diwali Hamper Box (Large)",      "Packaging",  "pcs",     450,  100, 200, 85),
    upsertInventory("BOX-DIW-MD",    "Diwali Hamper Box (Medium)",     "Packaging",  "pcs",     320,  100, 150, 60),
    upsertInventory("RBN-GOLD",      "Gold Satin Ribbon",               "Packaging",  "meters", 2400,  500, 800,  8),
    upsertInventory("KAJU-KTL",      "Kaju Katli (Premium)",            "Sweet",      "kg",       48,   20,  30, 680),
    upsertInventory("CHRM-CHK",      "Chakli (Homemade)",               "Snack",      "kg",       35,   15,  20, 280),
    upsertInventory("CHOC-BLK",      "Dark Chocolate (500g slab)",      "Ingredient", "kg",       28,   10,  15, 420),
    upsertInventory("DRY-ALM",       "Almonds (Roasted)",               "Dry Fruit",  "kg",       60,   20,  30, 780),
    upsertInventory("DRY-CSH",       "Cashews (W240)",                  "Dry Fruit",  "kg",       42,   15,  25, 920),
    upsertInventory("TAG-CORP",      "Corporate Gift Tag (Printed)",    "Branding",   "pcs",    1200,  300, 500,   5),
    upsertInventory("WRAP-TIS",      "Tissue Paper (Gold/Silver)",      "Packaging",  "sheets",   85,  200, 300,   3),
    upsertInventory("PHULWARI-MIX",  "Phulwari Mix (Namkeen)",         "Snack",      "kg",       22,   10,  15, 200),
    upsertInventory("GHEE-COW",      "Pure Cow Ghee (1L)",              "Ingredient", "liters",   15,   20,  25, 650),
  ]);
  console.log("✅  Inventory (12)");

  // ── Vendors ────────────────────────────────────────────────────────────────
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { email: "raj.packaging@gmail.com" },
      update: {},
      create: {
        name: "Rajesh Agarwal",
        companyName: "Raj Packaging Solutions",
        email: "raj.packaging@gmail.com",
        phone: "+91 99100 11111",
        address: "12, Industrial Area, Bhiwandi, Maharashtra 421302",
        gstNumber: "27AABCR1234A1Z5",
        category: "Packaging",
        rating: 4.5,
        notes: "Primary packaging vendor. Reliable quality. Lead time 5–7 days.",
      },
    }),
    prisma.vendor.upsert({
      where: { email: "mittal.dryfruits@gmail.com" },
      update: {},
      create: {
        name: "Suresh Mittal",
        companyName: "Mittal Dry Fruits & Nuts",
        email: "mittal.dryfruits@gmail.com",
        phone: "+91 98200 22222",
        address: "Crawford Market, Shop 45, Mumbai 400001",
        gstNumber: "27AABCM9876B1Z3",
        category: "Raw Materials",
        rating: 4.8,
        notes: "Premium dry fruits. Excellent quality. Delivers within 2 days.",
      },
    }),
    prisma.vendor.upsert({
      where: { email: "sweetcraft@gmail.com" },
      update: {},
      create: {
        name: "Neha Jain",
        companyName: "SweetCraft Confectionery",
        email: "sweetcraft@gmail.com",
        phone: "+91 91234 33333",
        address: "B-5, Food Park, Andheri East, Mumbai 400069",
        gstNumber: "27AABCS5432C1Z7",
        category: "Sweets",
        rating: 4.2,
        notes: "Pre-made sweets and chocolates. FSSAI certified.",
      },
    }),
    prisma.vendor.upsert({
      where: { email: "printworld.mumbai@gmail.com" },
      update: {},
      create: {
        name: "Amol Kulkarni",
        companyName: "PrintWorld Mumbai",
        email: "printworld.mumbai@gmail.com",
        phone: "+91 98765 44444",
        address: "7, Press Colony, Marol, Mumbai 400059",
        gstNumber: "27AABCP6789D1Z1",
        category: "Branding",
        rating: 3.9,
        notes: "Tags, stickers, ribbons with company branding. Min order 500 pcs.",
      },
    }),
  ]);
  console.log("✅  Vendors (4)");

  // ── Leads ──────────────────────────────────────────────────────────────────
  const [l1, l2, l3, l4, l5, l6, l7, l8] = await Promise.all([
    mkLead(sales.id, "TechNova Pvt Ltd",       "Rahul Verma",   "+91 98765 10001", "rahul@technova.in",      "DIWALI",    285000, "WON",         "150 premium hampers for employees. Needs branding with logo."),
    mkLead(sales.id, "GlobalSoft Solutions",    "Shweta Iyer",   "+91 98765 10002", "shweta@globalsoft.com",  "CORPORATE", 120000, "NEGOTIATION", "60 mid-range hampers. Price-sensitive, finalising quote."),
    mkLead(sales.id, "Star Industries",         "Ajay Bhosle",   "+91 98765 10003", "ajay@starindustries.in", "DIWALI",    450000, "SAMPLE_SENT", "Large order — 200 boxes. Approved sample, waiting for PO."),
    mkLead(sales.id, "Spice Traders Co.",       "Meena Krishnan","+91 98765 10004", "meena@spicetrade.com",   "CUSTOM",     55000, "CONTACTED",   "25 custom boxes with traditional sweets."),
    mkLead(sales.id, "PrimeBuilders",           "Farhan Qureshi","+91 98765 10005", "farhan@primebuilders.com","CORPORATE",  95000, "LOST",        "Went with competitor. Price too high."),
    mkLead(sales.id, "HealthFirst Hospital",    "Divya Pillai",  "+91 98765 10006", "divya@healthfirst.in",   "CHRISTMAS",  78000, "NEW",         "Staff gift hampers for Christmas. 40 units."),
    mkLead(sales2.id,"Alpha Finance Ltd",       "Nitin Agarwal", "+91 98765 10007", "nitin@alphafinance.in",  "DIWALI",    340000, "WON",         "175 luxury hampers. Requires embossed boxes."),
    mkLead(sales2.id,"SunRise Realty",          "Priyanka Desai","+91 98765 10008", "priyanka@sunriserealty.com","DIWALI",  190000, "NEGOTIATION", "100 hampers. Wants eco-friendly packaging."),
  ]);
  void l3; void l4; void l5; void l6; // suppress unused
  console.log("✅  Leads (8)");

  // ── Samples ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.sample.create({
      data: {
        leadId: l1.id,
        requestedById: sales.id,
        clientName: "Rahul Verma",
        requirements: "3 premium Diwali hamper prototypes. Gold box, kaju katli 250g, dry fruits 200g, chakli 150g.",
        quantity: 3,
        status: "APPROVED",
        rating: 5,
        clientFeedback: "Excellent packaging and taste. Approved for full order.",
        deliveredAt: daysAgo(10),
        items: {
          create: [
            { productName: "Premium Diwali Hamper", description: "Gold box + kaju katli 250g + dry fruits 200g", quantity: 3 },
          ],
        },
      },
    }),
    prisma.sample.create({
      data: {
        leadId: l2.id,
        requestedById: sales.id,
        clientName: "Ajay Bhosle",
        requirements: "2 luxury hamper boxes and 1 chocolate box for approval.",
        quantity: 3,
        status: "DELIVERED",
        items: {
          create: [
            { productName: "Luxury Hamper Box", description: "Embossed box with company logo, premium contents", quantity: 2 },
            { productName: "Chocolate Box",      description: "12-pc artisan chocolates", quantity: 1 },
          ],
        },
      },
    }),
    prisma.sample.create({
      data: {
        requestedById: sales2.id,
        clientName: "New Client — Eco Prototype",
        requirements: "1 eco-friendly hamper prototype with sustainable packaging and organic sweets.",
        quantity: 1,
        status: "IN_KITCHEN",
        items: {
          create: [
            { productName: "Eco Hamper Box", description: "Sustainable packaging + organic sweets", quantity: 1 },
          ],
        },
      },
    }),
  ]);
  console.log("✅  Samples (3)");

  // ── Quotes ─────────────────────────────────────────────────────────────────
  const [q1, q2] = await Promise.all([
    prisma.quote.create({
      data: {
        quoteNumber: "QT-2025-0001",
        leadId: l1.id,
        clientName: "Rahul Verma",
        companyName: "TechNova Pvt Ltd",
        eventType: "DIWALI",
        expectedDate: new Date("2025-10-20"),
        validUntil: new Date("2025-09-30"),
        status: "APPROVED",
        subtotal: 247500,
        discountPct: 5,
        discountAmt: 12375,
        gstPct: 18,
        gstAmt: 43065,
        packagingCost: 3000,
        brandingCost: 8000,
        deliveryCost: 5000,
        totalAmount: 294190,
        margin: 32,
        notes: "150 units confirmed. Branding approved.",
        terms: "50% advance before production. Balance on delivery. GST @18% applicable.",
        createdById: sales.id,
        items: {
          create: [
            { productName: "Premium Diwali Hamper Box", quantity: 150, unitPrice: 1650, totalPrice: 247500, packagingType: "Gold embossed box", brandingNotes: "Company logo + message card" },
          ],
        },
      },
    }),
    prisma.quote.create({
      data: {
        quoteNumber: "QT-2025-0002",
        leadId: l2.id,
        clientName: "Shweta Iyer",
        companyName: "GlobalSoft Solutions",
        eventType: "CORPORATE",
        validUntil: daysAhead(7),
        status: "SENT",
        subtotal: 108000,
        discountPct: 5,
        discountAmt: 5400,
        gstPct: 18,
        gstAmt: 18468,
        packagingCost: 1500,
        brandingCost: 3000,
        deliveryCost: 2000,
        totalAmount: 127568,
        margin: 28,
        notes: "60 mid-range hampers. 5% discount offered.",
        terms: "50% advance before production. Balance on delivery.",
        createdById: sales.id,
        items: {
          create: [
            { productName: "Corporate Gift Box (Standard)", quantity: 60, unitPrice: 1800, totalPrice: 108000 },
          ],
        },
      },
    }),
    prisma.quote.create({
      data: {
        quoteNumber: "QT-2025-0003",
        leadId: l7.id,
        clientName: "Nitin Agarwal",
        companyName: "Alpha Finance Ltd",
        eventType: "DIWALI",
        validUntil: daysAhead(5),
        status: "DRAFT",
        subtotal: 327250,
        discountPct: 0,
        discountAmt: 0,
        gstPct: 18,
        gstAmt: 58905,
        packagingCost: 5000,
        brandingCost: 12000,
        deliveryCost: 8000,
        totalAmount: 411155,
        margin: 35,
        notes: "175 luxury hampers. 0% discount — straight pricing.",
        terms: "50% advance before production. Balance on delivery.",
        createdById: sales2.id,
        items: {
          create: [
            { productName: "Luxury Hamper — Embossed Box", quantity: 175, unitPrice: 1870, totalPrice: 327250, packagingType: "Embossed luxury box", brandingNotes: "Gold foil logo" },
          ],
        },
      },
    }),
  ]);
  console.log("✅  Quotes (3)");

  // ── Orders ─────────────────────────────────────────────────────────────────
  const [o1, o2, o3, o4, o5] = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: "ORD-2025-0001",
        leadId: l1.id,
        quoteId: q1.id,
        clientName: "Rahul Verma",
        companyName: "TechNova Pvt Ltd",
        eventType: "DIWALI",
        deliveryDate: new Date("2025-10-18"),
        status: "QC_PASSED",
        paymentStatus: "PARTIAL",
        totalAmount: 294190,
        advanceAmount: 147095,
        balanceAmount: 147095,
        gstAmount: 43065,
        cardMessage: "Wishing you a bright and prosperous Diwali!",
        ribbonColor: "Gold",
        logoPlacement: "Box lid — centre",
        brandingNotes: "Company logo embossed in gold. Each box needs personalised message card.",
        packagingNotes: "Gold embossed box with satin ribbon.",
        internalNotes: "VIP client. Ensure premium finish on all 150 units.",
        createdById: sales.id,
        items: {
          create: [
            { productName: "Premium Diwali Hamper Box", sku: "PRD-DIW-150", quantity: 150, unitPrice: 1650, totalPrice: 247500, packagingType: "Gold embossed box", brandingNotes: "Company logo + message card" },
          ],
        },
        deliveryAddresses: {
          create: [
            { recipientName: "Rahul Verma", phone: "+91 98765 10001", addressLine1: "TechNova HQ, 4th Floor, Cyber City", city: "Gurugram", state: "Haryana", pincode: "122002", quantity: 150 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "ORD-2025-0002",
        leadId: l7.id,
        quoteId: q2.id,
        clientName: "Nitin Agarwal",
        companyName: "Alpha Finance Ltd",
        eventType: "DIWALI",
        deliveryDate: new Date("2025-10-15"),
        status: "IN_PRODUCTION",
        paymentStatus: "PARTIAL",
        totalAmount: 411155,
        advanceAmount: 205578,
        balanceAmount: 205577,
        gstAmount: 58905,
        ribbonColor: "Navy Blue",
        logoPlacement: "Box front — bottom right",
        brandingNotes: "Gold foil embossed logo. Luxury finish.",
        internalNotes: "175 luxury hampers. Top priority.",
        createdById: sales2.id,
        items: {
          create: [
            { productName: "Luxury Hamper — Embossed Box", sku: "PRD-LUX-175", quantity: 175, unitPrice: 1870, totalPrice: 327250, packagingType: "Embossed luxury box", brandingNotes: "Gold foil logo" },
          ],
        },
        deliveryAddresses: {
          create: [
            { recipientName: "Nitin Agarwal", phone: "+91 98765 10007", addressLine1: "Alpha Finance, Tower B, BKC", city: "Mumbai", state: "Maharashtra", pincode: "400051", quantity: 175 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "ORD-2025-0003",
        leadId: l3.id,
        clientName: "Ajay Bhosle",
        companyName: "Star Industries",
        eventType: "DIWALI",
        deliveryDate: new Date("2025-10-22"),
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        totalAmount: 520000,
        advanceAmount: 0,
        balanceAmount: 520000,
        gstAmount: 79322,
        internalNotes: "Advance pending. Do not start production without advance.",
        createdById: sales.id,
        items: {
          create: [
            { productName: "Standard Diwali Hamper Box", sku: "PRD-STD-200", quantity: 200, unitPrice: 2200, totalPrice: 440000, packagingType: "Premium box", brandingNotes: "Company sticker" },
            { productName: "Personalised Greeting Card",  sku: "CARD-CUST",  quantity: 200, unitPrice: 400,  totalPrice: 80000,  packagingType: "Envelope" },
          ],
        },
        deliveryAddresses: {
          create: [
            { recipientName: "Ajay Bhosle", phone: "+91 98765 10003", addressLine1: "Star Industries, MIDC Phase 2", city: "Pune", state: "Maharashtra", pincode: "411018", quantity: 200 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "ORD-2025-0004",
        leadId: l8.id,
        clientName: "Priyanka Desai",
        companyName: "SunRise Realty",
        eventType: "DIWALI",
        deliveryDate: daysAhead(2),
        status: "PACKING",
        paymentStatus: "PARTIAL",
        totalAmount: 198000,
        advanceAmount: 99000,
        balanceAmount: 99000,
        gstAmount: 30203,
        isRushOrder: true,
        rushOrderNotes: "Client requested delivery in 2 days. Rush processing approved.",
        packagingNotes: "Use recyclable / eco-certified packaging only.",
        internalNotes: "100 eco-friendly hampers. Rush order.",
        createdById: sales.id,
        items: {
          create: [
            { productName: "Eco Hamper Box (Jute)", sku: "PRD-ECO-100", quantity: 100, unitPrice: 1980, totalPrice: 198000, packagingType: "Jute box — eco certified", brandingNotes: "Recycled paper tag" },
          ],
        },
        deliveryAddresses: {
          create: [
            { recipientName: "Priyanka Desai", phone: "+91 98765 10008", addressLine1: "SunRise Realty Office, Link Road", addressLine2: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400058", quantity: 100 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "ORD-2025-0005",
        leadId: l4.id,
        clientName: "Meena Krishnan",
        companyName: "Spice Traders Co.",
        eventType: "CUSTOM",
        deliveryDate: daysAgo(5),
        status: "DELIVERED",
        paymentStatus: "PAID",
        totalAmount: 62500,
        advanceAmount: 31250,
        balanceAmount: 0,
        gstAmount: 9534,
        internalNotes: "25 custom spice-themed gift boxes. Delivered on time.",
        createdById: sales.id,
        items: {
          create: [
            { productName: "Spice Gift Box (Custom)", sku: "PRD-SPICE-25", quantity: 25, unitPrice: 2500, totalPrice: 62500, packagingType: "Wooden crate box", brandingNotes: "Custom label" },
          ],
        },
        deliveryAddresses: {
          create: [
            { recipientName: "Meena Krishnan", phone: "+91 98765 10004", addressLine1: "Spice Traders, Crawford Market", city: "Mumbai", state: "Maharashtra", pincode: "400001", quantity: 25 },
          ],
        },
      },
    }),
  ]);
  console.log("✅  Orders (5)");

  // ── Payments ───────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.payment.create({ data: { orderId: o1.id, type: "ADVANCE", amount: 147095, transactionId: "NEFT2025100112345", notes: "50% advance received via NEFT",    verifiedById: accounts.id, verifiedAt: daysAgo(7) } }),
    prisma.payment.create({ data: { orderId: o2.id, type: "ADVANCE", amount: 205578, transactionId: "CHQ-987654",         notes: "50% advance — cheque cleared",     verifiedById: accounts.id, verifiedAt: daysAgo(5) } }),
    prisma.payment.create({ data: { orderId: o4.id, type: "ADVANCE", amount: 99000,  transactionId: "UPI2025100198765",   notes: "Advance via UPI",                  verifiedById: accounts.id, verifiedAt: daysAgo(2) } }),
    prisma.payment.create({ data: { orderId: o5.id, type: "ADVANCE", amount: 31250,  transactionId: "UPI2025092011111",   notes: "Advance — UPI",                    verifiedById: accounts.id, verifiedAt: daysAgo(12) } }),
    prisma.payment.create({ data: { orderId: o5.id, type: "BALANCE", amount: 31250,  transactionId: "NEFT2025093022222",  notes: "Balance received on delivery",     verifiedById: accounts.id, verifiedAt: daysAgo(5) } }),
  ]);
  console.log("✅  Payments (5)");

  // ── Production batches ─────────────────────────────────────────────────────
  const [b1] = await Promise.all([
    prisma.productionBatch.create({
      data: {
        batchNumber: "BATCH-2025-001",
        orderId: o1.id,
        productName: "Premium Diwali Hamper Box",
        quantity: 150,
        status: "COMPLETED",
        scheduledDate: daysAgo(12),
        deadline: daysAgo(8),
        completedAt: daysAgo(8),
        notes: "All 150 units completed without issues.",
        assignedToId: chef.id,
        ingredients: {
          create: [
            { inventoryItemId: inv[3].id, quantityNeeded: 37.5, quantityUsed: 37.5, unit: "kg" },
            { inventoryItemId: inv[4].id, quantityNeeded: 22.5, quantityUsed: 22.5, unit: "kg" },
            { inventoryItemId: inv[6].id, quantityNeeded: 30,   quantityUsed: 30,   unit: "kg" },
            { inventoryItemId: inv[7].id, quantityNeeded: 20,   quantityUsed: 20,   unit: "kg" },
          ],
        },
      },
    }),
    prisma.productionBatch.create({
      data: {
        batchNumber: "BATCH-2025-002",
        orderId: o2.id,
        productName: "Luxury Hamper — Embossed Box",
        quantity: 175,
        status: "IN_PROGRESS",
        scheduledDate: daysAgo(3),
        deadline: daysAhead(2),
        notes: "60% complete. On track for delivery.",
        assignedToId: chef.id,
        ingredients: {
          create: [
            { inventoryItemId: inv[3].id, quantityNeeded: 43.75, quantityUsed: 26, unit: "kg" },
            { inventoryItemId: inv[7].id, quantityNeeded: 35,    quantityUsed: 21, unit: "kg" },
            { inventoryItemId: inv[5].id, quantityNeeded: 20,    quantityUsed: 12, unit: "kg" },
          ],
        },
      },
    }),
    prisma.productionBatch.create({
      data: {
        batchNumber: "BATCH-2025-003",
        orderId: o4.id,
        productName: "Eco Hamper Box (Jute)",
        quantity: 100,
        status: "COMPLETED",
        scheduledDate: daysAgo(4),
        deadline: daysAgo(1),
        completedAt: daysAgo(3),
        notes: "Completed. Sent to packing.",
        assignedToId: chef.id,
        ingredients: {
          create: [
            { inventoryItemId: inv[3].id,  quantityNeeded: 25, quantityUsed: 25, unit: "kg" },
            { inventoryItemId: inv[10].id, quantityNeeded: 15, quantityUsed: 15, unit: "kg" },
          ],
        },
      },
    }),
  ]);
  console.log("✅  Production batches (3)");

  // ── Packing units ──────────────────────────────────────────────────────────
  // Order 4 — 100 units, 70 packed
  await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      prisma.packingUnit.create({
        data: {
          orderId: o4.id,
          unitNumber: i + 1,
          status: i < 70 ? "PACKED" : "PENDING",
          correctBox: i < 70,
          productArranged: i < 70,
          ribbonAdded: i < 70,
          brandingDone: i < 70,
          insertsAdded: i < 70,
          labelAttached: i < 70,
          packedAt: i < 70 ? daysAgo(2) : null,
        },
      })
    )
  );

  // Order 1 — 30 units, all approved (QC passed)
  const units1 = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      prisma.packingUnit.create({
        data: {
          orderId: o1.id,
          unitNumber: i + 1,
          status: "APPROVED",
          correctBox: true,
          productArranged: true,
          ribbonAdded: true,
          brandingDone: true,
          insertsAdded: true,
          labelAttached: true,
          packedAt: daysAgo(6),
        },
      })
    )
  );
  console.log("✅  Packing units (130)");

  // ── QC logs ────────────────────────────────────────────────────────────────
  await Promise.all(
    units1.slice(0, 10).map((unit) =>
      prisma.qCLog.create({
        data: {
          orderId: o1.id,
          packingUnitId: unit.id,
          result: "PASS",
          productQuality: true,
          appearance: true,
          branding: true,
          quantityCorrect: true,
          sealed: true,
          labelCorrect: true,
          inspectedById: qc.id,
        },
      })
    )
  );
  console.log("✅  QC logs (10)");

  // ── Dispatch ───────────────────────────────────────────────────────────────
  const addr5 = await prisma.deliveryAddress.findFirst({ where: { orderId: o5.id } });
  await prisma.dispatch.create({
    data: {
      orderId: o5.id,
      deliveryAddressId: addr5?.id,
      challanNumber: "DC-2025-0001",
      status: "DELIVERED",
      driverName: "Suresh Yadav",
      driverPhone: "+91 98765 55555",
      vehicleNumber: "MH 04 AB 1234",
      estimatedDelivery: daysAgo(5),
      dispatchedAt: daysAgo(6),
      deliveredAt: daysAgo(5),
      podReceiverName: "Meena Krishnan",
      podTimestamp: daysAgo(5),
      podNotes: "All 25 boxes received in good condition.",
      dispatchedById: dispatch.id,
    },
  });
  console.log("✅  Dispatch (1)");

  // ── Vendor orders ──────────────────────────────────────────────────────────
  await Promise.all([
    prisma.vendorOrder.create({
      data: {
        poNumber: "PO-2025-001",
        vendorId: vendors[0].id,
        status: "RECEIVED",
        expectedDate: daysAgo(8),
        receivedDate: daysAgo(8),
        totalAmount: 42500,
        notes: "Box order for Diwali season — all received.",
        items: {
          create: [
            { inventoryItemId: inv[0].id, itemName: "Diwali Hamper Box (Large)",  quantity: 300, unit: "pcs",    unitPrice: 85, totalPrice: 25500 },
            { inventoryItemId: inv[1].id, itemName: "Diwali Hamper Box (Medium)", quantity: 200, unit: "pcs",    unitPrice: 60, totalPrice: 12000 },
            { inventoryItemId: inv[2].id, itemName: "Gold Satin Ribbon",          quantity: 625, unit: "meters", unitPrice:  8, totalPrice:  5000 },
          ],
        },
      },
    }),
    prisma.vendorOrder.create({
      data: {
        poNumber: "PO-2025-002",
        vendorId: vendors[1].id,
        status: "CONFIRMED",
        expectedDate: daysAhead(3),
        totalAmount: 89600,
        notes: "Dry fruits restock for ongoing orders.",
        items: {
          create: [
            { inventoryItemId: inv[6].id, itemName: "Almonds (Roasted)", quantity: 60, unit: "kg", unitPrice: 780, totalPrice: 46800 },
            { inventoryItemId: inv[7].id, itemName: "Cashews (W240)",    quantity: 46, unit: "kg", unitPrice: 920, totalPrice: 42320 },
          ],
        },
      },
    }),
    prisma.vendorOrder.create({
      data: {
        poNumber: "PO-2025-003",
        vendorId: vendors[3].id,
        status: "DELAYED",
        expectedDate: daysAgo(2),
        totalAmount: 18500,
        notes: "Branding tags delayed — vendor cited supply issues.",
        delayReason: "Vendor supply chain disruption. New ETA: 3 days.",
        items: {
          create: [
            { inventoryItemId: inv[8].id, itemName: "Corporate Gift Tag (Printed)", quantity: 2000, unit: "pcs", unitPrice: 5,  totalPrice: 10000 },
            {                             itemName: "Branded Sticker Sheet",         quantity:  500, unit: "pcs", unitPrice: 17, totalPrice:  8500 },
          ],
        },
      },
    }),
  ]);
  console.log("✅  Vendor orders (3)");

  // ── Feedback ───────────────────────────────────────────────────────────────
  await prisma.feedback.create({
    data: {
      orderId: o5.id,
      clientName: "Meena Krishnan",
      overallRating: 5,
      tasteRating: 5,
      packagingRating: 5,
      deliveryRating: 5,
      comments: "Absolutely loved the hampers! Packaging was stunning and sweets were fresh. Will definitely order again.",
      repeatInterest: true,
      collectedById: sales.id,
    },
  });
  console.log("✅  Feedback (1)");

  // ── Notifications ──────────────────────────────────────────────────────────
  await Promise.all([
    prisma.notification.create({ data: { userId: chef.id,     orderId: o4.id, type: "RUSH_ORDER",        channel: "IN_APP", title: "🚨 Rush Order Received",      message: `Rush order ORD-2025-0004 from SunRise Realty — 100 eco hampers. Delivery in 2 days!`, isRead: false, link: "/orders/ORD-2025-0004" } }),
    prisma.notification.create({ data: { userId: admin.id,                    type: "VENDOR_LATE",       channel: "IN_APP", title: "Vendor Delivery Overdue",       message: "PrintWorld Mumbai (PO-2025-003) is 2 days overdue. Branding tags pending.",              isRead: false } }),
    prisma.notification.create({ data: { userId: accounts.id, orderId: o3.id, type: "ADVANCE_PENDING",  channel: "IN_APP", title: "Advance Pending",               message: "Order ORD-2025-0003 (Star Industries, ₹5,20,000) — advance of ₹2,60,000 not received.", isRead: false, link: "/orders/ORD-2025-0003" } }),
    prisma.notification.create({ data: { userId: sales.id,                    type: "GENERAL",           channel: "IN_APP", title: "Quote Approved",                message: "QT-2025-0001 for TechNova Pvt Ltd has been approved by the owner.",                        isRead: true } }),
    prisma.notification.create({ data: { userId: chef.id,     orderId: o2.id, type: "ORDER_DELAYED",    channel: "IN_APP", title: "Production Behind Schedule",    message: "BATCH-2025-002 for Alpha Finance is at 60%. Delivery date is Oct 15.",                     isRead: false, link: "/production" } }),
  ]);
  console.log("✅  Notifications (5)");

  // ── Audit logs ─────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.auditLog.create({ data: { userId: sales.id,    entity: "Order",          entityId: o1.id,    action: "created",           orderId: o1.id } }),
    prisma.auditLog.create({ data: { userId: accounts.id, entity: "Payment",        entityId: o1.id,    action: "advance_verified",   orderId: o1.id } }),
    prisma.auditLog.create({ data: { userId: chef.id,     entity: "ProductionBatch",entityId: b1.id,    action: "completed",          orderId: o1.id } }),
    prisma.auditLog.create({ data: { userId: qc.id,       entity: "QCLog",          entityId: o1.id,    action: "QC_PASS",            orderId: o1.id } }),
    prisma.auditLog.create({ data: { userId: dispatch.id, entity: "Dispatch",       entityId: o5.id,    action: "dispatched",         orderId: o5.id } }),
    prisma.auditLog.create({ data: { userId: sales.id,    entity: "Order",          entityId: o5.id,    action: "created",            orderId: o5.id } }),
    prisma.auditLog.create({ data: { userId: owner.id,    entity: "Quote",          entityId: q1.id,    action: "approved",           leadId:  l1.id } }),
  ]);
  console.log("✅  Audit logs (7)");

  // ── Invoice ────────────────────────────────────────────────────────────────
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-0001",
      orderId: o5.id,
      clientName: "Meena Krishnan",
      companyName: "Spice Traders Co.",
      subtotal: 62500,
      gstPct: 18,
      gstAmt: 9534,
      totalAmount: 62500,
      paidAmount: 62500,
      balanceAmount: 0,
      status: "PAID",
      dueDate: daysAgo(3),
      notes: "Paid in full including advance + balance.",
    },
  });
  console.log("✅  Invoice (1)\n");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("🎉  Seed complete!\n");
  console.log("──────────────────────────────────────────");
  console.log("  DEMO ACCOUNTS");
  console.log("──────────────────────────────────────────");
  console.log("  Admin      admin@giftingops.in     / admin1234");
  console.log("  Owner      owner@giftingops.in     / owner1234");
  console.log("  Sales      sales@giftingops.in     / sales1234");
  console.log("  Sales 2    sales2@giftingops.in    / sales1234");
  console.log("  Chef/Ops   chef@giftingops.in      / chef1234");
  console.log("  Production prod@giftingops.in      / prod1234");
  console.log("  Packing    pack@giftingops.in      / pack1234");
  console.log("  QC         qc@giftingops.in        / qc12345678");
  console.log("  Dispatch   dispatch@giftingops.in  / disp1234");
  console.log("  Accounts   accounts@giftingops.in  / acc01234");
  console.log("  Store      store@giftingops.in     / store123");
  console.log("──────────────────────────────────────────\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function upsertUser(email: string, password: string, name: string, role: string, phone: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password, name, role: role as never, phone },
  });
}

function upsertInventory(
  sku: string, name: string, category: string, unit: string,
  currentStock: number, minStockLevel: number, reorderPoint: number, costPerUnit: number,
  location?: string
) {
  return prisma.inventoryItem.upsert({
    where: { sku },
    update: {},
    create: { sku, name, category, unit, currentStock, minStockLevel, reorderPoint, costPerUnit, location },
  });
}

function mkLead(
  createdById: string,
  companyName: string,
  contactPerson: string,
  phone: string,
  email: string,
  eventType: string,
  budget: number,
  status: string,
  notes: string
) {
  return prisma.lead.create({
    data: {
      companyName,
      contactPerson,
      phone,
      email,
      eventType: eventType as never,
      budget,
      status: status as never,
      notes,
      source: "WHATSAPP",
      nextFollowUp: daysAhead(3),
      createdById,
      assignedToId: createdById,
    },
  });
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
