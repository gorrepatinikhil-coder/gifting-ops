# GiftingOps — Internal Operations Platform

A production-ready internal operations system for corporate gifting companies. Replaces WhatsApp chaos, Excel sheets, and manual follow-ups with a centralized, role-based management platform.

## Features

- **11 Role types** — Admin, Owner, Sales, Chef/Ops, Production, Packing, QC, Dispatch, Accounts, Store, Vendor
- **15+ Modules** — CRM, Leads, Samples, Quotations, Orders, Production, Inventory, Vendors, Packing, QC, Dispatch, Accounts, Feedback, Reports, Settings
- **Smart workflows** — Order lifecycle from lead to delivery, QC routing, payment tracking
- **Automations** — Delayed order alerts, QC fail notifications, vendor late warnings, advance reminders
- **Reports** — Revenue, conversion, vendor performance, team productivity
- **Print support** — Dispatch challans, invoices, quotations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (via Supabase) |
| ORM | Prisma 5 |
| Auth | NextAuth v5 (JWT) |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| Theme | next-themes |

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- npm or pnpm

### 2. Clone & Install

```bash
git clone <your-repo>
cd gifting-ops
npm install
```

### 3. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Database (Supabase or local PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/gifting_ops"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"   # generate with: openssl rand -base64 32

# Optional: File uploads (Uploadthing)
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Optional: Email (Resend)
RESEND_API_KEY=""

# Optional: WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_FROM=""
```

### 4. Database Setup

```bash
# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 5. Seed Demo Data

```bash
npm run db:seed
```

This creates 11 users (one per role), 8 leads, 3 quotes, 5 orders in various stages, inventory items, vendors, production batches, payments, and notifications.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@giftingops.in | admin1234 |
| Owner | owner@giftingops.in | owner1234 |
| Sales | sales@giftingops.in | sales1234 |
| Chef/Ops | chef@giftingops.in | chef1234 |
| Accounts | accounts@giftingops.in | acc01234 |
| QC | qc@giftingops.in | qc12345678 |
| Dispatch | dispatch@giftingops.in | disp1234 |
| Packing | packing@giftingops.in | pack1234 |
| Store | store@giftingops.in | store123 |

## Module Overview

### CRM / Leads
Kanban board (6 columns: New → Contacted → Sample Sent → Negotiation → Won → Lost). Assign leads, track follow-ups, link to quotes.

### Quotations
Full quotation builder with line items, GST calculation, discount approval workflow (>10% requires owner/admin), PDF print, status tracking (Draft → Approved → Sent → Accepted).

### Orders
Create, track, and manage orders through the full lifecycle. Urgency color-coding for near-due dates. Rush order priority workflow. 8-step visual stepper.

### Production
Batch management with ingredient tracking. Real-time stock availability per batch. Start/Pause/Complete actions. Shortage alerts.

### Inventory
Stock tracking with IN/OUT/ADJUSTMENT transactions. Low-stock alerts. Category-wise organization.

### Packing
Per-order packing unit management. 6-checkbox inspection per unit. Mark packed and send to QC.

### QC
Per-unit QC inspection with 6 quality checks. Routing: FAIL_PACKING → back to packing; FAIL_PRODUCT → back to production. Auto-advances to QC_PASSED.

### Dispatch
Dispatch records with driver/vehicle info. Challan printing. POD (Proof of Delivery) updates.

### Accounts
Payment recording and verification. Invoice generation. Balance tracking. Pending collections dashboard.

### Vendors
Vendor database with ratings. Purchase orders with status tracking. Overdue alerts.

### Reports
Monthly revenue bar chart, top clients, order status pie chart, lead conversion analytics. CSV export.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Build check
npm run build
```

### Database (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy the connection string from Settings → Database → Connection string (URI mode)
3. Use the **pooled** connection string for `DATABASE_URL` in production
4. Run `npm run db:migrate` to apply schema

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected app
│   │   ├── layout.tsx         # Sidebar + header layout
│   │   ├── dashboard/         # Role-specific dashboards
│   │   ├── leads/             # CRM module
│   │   ├── orders/            # Order management
│   │   ├── quotations/        # Quote builder
│   │   ├── samples/           # Sample requests
│   │   ├── production/        # Production batches
│   │   ├── inventory/         # Stock management
│   │   ├── packing/           # Packing workflow
│   │   ├── qc/                # Quality control
│   │   ├── dispatch/          # Dispatch & logistics
│   │   ├── vendors/           # Vendor management
│   │   ├── accounts/          # Finance & payments
│   │   ├── feedback/          # Client feedback
│   │   ├── reports/           # Analytics
│   │   ├── notifications/     # In-app notifications
│   │   └── settings/          # User & team management
│   └── api/                   # API routes (REST)
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Sidebar, header, providers
│   ├── dashboard/             # Role dashboards
│   └── shared/                # Reusable components
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── prisma.ts              # Prisma client singleton
│   ├── permissions.ts         # RBAC permission matrix
│   ├── audit.ts               # Audit logging
│   ├── notifications.ts       # Notification helpers
│   └── utils.ts               # Formatters, generators
└── types/                     # TypeScript definitions
```

## Role Permissions

| Module | Admin | Owner | Sales | Chef | Production | Packing | QC | Dispatch | Accounts | Store |
|--------|-------|-------|-------|------|------------|---------|----|---------|---------|----|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Leads | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| Quotations | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Production | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| Inventory | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | ✅ |
| Packing | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — | — |
| QC | ✅ | ✅ | — | ✅ | — | — | ✅ | — | — | — |
| Dispatch | ✅ | ✅ | — | ✅ | — | — | — | ✅ | — | — |
| Vendors | ✅ | ✅ | — | ✅ | — | — | — | — | — | ✅ |
| Accounts | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| Reports | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| Settings | ✅ | ✅ | — | — | — | — | — | — | — | — |

## License

Private — internal use only.
