-- Enable Row-Level Security on all public tables.
-- The app connects via Prisma (postgres superuser) which bypasses RLS,
-- so this only blocks unauthenticated access through the Supabase REST API.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
