-- ═══════════════════════════════════════════════════════════════
-- Sensor Spares Portal — Initial Schema
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────
-- Custom ENUM types
-- ───────────────────────────────────────────────

create type sensor_type as enum (
  'pressure', 'temperature', 'flow', 'level',
  'vibration', 'humidity', 'gas', 'proximity'
);

create type fit_type as enum ('exact', 'equivalent', 'aftermarket');

create type contract_tier_name as enum ('standard', 'silver', 'gold', 'platinum');

create type user_role as enum ('buyer', 'admin', 'ops');

create type order_status as enum (
  'pending', 'confirmed', 'picking', 'packed',
  'shipped', 'delivered', 'fulfilled', 'cancelled'
);

create type order_line_status as enum (
  'pending', 'picking', 'packed', 'shipped', 'delivered'
);

create type sla_tier as enum ('emergency', 'standard', 'economy');

create type sla_status as enum (
  'on_track', 'warning', 'breach', 'breached', 'fulfilled'
);

create type payment_method as enum ('ach', 'invoice_net30', 'card');

create type shipping_method as enum (
  'ups_overnight', 'ups_ground', 'fedex_overnight', 'fedex_ground',
  'usps_priority', 'own_courier', 'pickup'
);

create type shipment_status as enum (
  'pending', 'in_transit', 'out_for_delivery',
  'delivered', 'failed', 'returned'
);

create type quote_status as enum ('draft', 'sent', 'accepted', 'expired', 'converted');

-- ───────────────────────────────────────────────
-- Helper: auto-update updated_at on row change
-- ───────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ───────────────────────────────────────────────
-- 1. User profiles
-- ───────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific fields.
-- id references auth.users(id) so they stay in sync.

create table user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        user_role not null default 'buyer',
  company_id  uuid,  -- FK added after companies table exists
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

-- ───────────────────────────────────────────────
-- 2. Companies (buyer organizations)
-- ───────────────────────────────────────────────

create table companies (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  billing_line1    text not null,
  billing_line2    text,
  billing_city     text not null,
  billing_state    text not null,
  billing_postal   text not null,
  billing_country  text not null default 'US',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

-- Now add the FK from user_profiles → companies
alter table user_profiles
  add constraint fk_user_profiles_company
  foreign key (company_id) references companies(id) on delete set null;

-- ───────────────────────────────────────────────
-- 3. Sensor models
-- ───────────────────────────────────────────────

create table models (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  manufacturer  text not null,
  sensor_type   sensor_type not null,
  description   text,
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger models_updated_at
  before update on models
  for each row execute function update_updated_at();

create index idx_models_sensor_type on models(sensor_type);
create index idx_models_manufacturer on models(manufacturer);

-- ───────────────────────────────────────────────
-- 4. Parts (spare part SKUs)
-- ───────────────────────────────────────────────

create table parts (
  id              uuid primary key default uuid_generate_v4(),
  sku             text not null unique,
  name            text not null,
  manufacturer    text not null,
  sensor_type     sensor_type not null,
  description     text,
  image_url       text,
  datasheet_url   text,
  base_price_cents integer not null check (base_price_cents >= 0),
  stock_quantity  integer not null default 0,
  lead_time_days  integer not null default 0,
  safety_stock    integer not null default 0,
  uom             text not null default 'each',
  weight_grams    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger parts_updated_at
  before update on parts
  for each row execute function update_updated_at();

create index idx_parts_sku on parts(sku);
create index idx_parts_sensor_type on parts(sensor_type);
create index idx_parts_manufacturer on parts(manufacturer);
create index idx_parts_stock on parts(stock_quantity);

-- ───────────────────────────────────────────────
-- 5. Compatibility (model ↔ part edges)
-- ───────────────────────────────────────────────

create table compatibility (
  id        uuid primary key default uuid_generate_v4(),
  model_id  uuid not null references models(id) on delete cascade,
  part_id   uuid not null references parts(id) on delete cascade,
  fit_type  fit_type not null,
  notes     text,
  unique(model_id, part_id)
);

create index idx_compat_model on compatibility(model_id);
create index idx_compat_part on compatibility(part_id);

-- ───────────────────────────────────────────────
-- 6. Contracts
-- ───────────────────────────────────────────────

create table contracts (
  id                uuid primary key default uuid_generate_v4(),
  company_id        uuid not null references companies(id) on delete cascade,
  tier              contract_tier_name not null default 'standard',
  discount_percent  numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  starts_at         timestamptz not null,
  expires_at        timestamptz not null,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (expires_at > starts_at)
);

create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at();

create index idx_contracts_company on contracts(company_id);
create index idx_contracts_active on contracts(is_active) where is_active = true;

-- ───────────────────────────────────────────────
-- 7. Contract tiers (volume break thresholds)
-- ───────────────────────────────────────────────

create table contract_tiers (
  id                          uuid primary key default uuid_generate_v4(),
  contract_id                 uuid not null references contracts(id) on delete cascade,
  min_quantity                integer not null check (min_quantity > 0),
  additional_discount_percent numeric(5,2) not null default 0 check (additional_discount_percent >= 0)
);

create index idx_contract_tiers_contract on contract_tiers(contract_id);

-- ───────────────────────────────────────────────
-- 8. Orders
-- ───────────────────────────────────────────────

create table orders (
  id                uuid primary key default uuid_generate_v4(),
  order_number      text not null unique,
  company_id        uuid not null references companies(id),
  user_id           uuid not null references auth.users(id),
  status            order_status not null default 'pending',
  sla_tier          sla_tier not null,
  sla_deadline      timestamptz not null,
  sla_status        sla_status not null default 'on_track',
  -- Shipping address (denormalized — snapshot at time of order)
  shipping_line1    text not null,
  shipping_line2    text,
  shipping_city     text not null,
  shipping_state    text not null,
  shipping_postal   text not null,
  shipping_country  text not null default 'US',
  shipping_method   shipping_method not null,
  -- Money (all in cents)
  subtotal_cents    integer not null check (subtotal_cents >= 0),
  discount_cents    integer not null default 0 check (discount_cents >= 0),
  shipping_cents    integer not null default 0 check (shipping_cents >= 0),
  tax_cents         integer not null default 0 check (tax_cents >= 0),
  total_cents       integer not null check (total_cents >= 0),
  -- Payment
  payment_ref       text,
  payment_method    payment_method not null,
  notes             text,
  -- Timestamps
  placed_at         timestamptz not null default now(),
  fulfilled_at      timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

create index idx_orders_company on orders(company_id);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_sla_status on orders(sla_status) where sla_status != 'fulfilled';
create index idx_orders_sla_deadline on orders(sla_deadline) where sla_status not in ('fulfilled', 'breached');

-- ───────────────────────────────────────────────
-- 9. Order lines
-- ───────────────────────────────────────────────

create table order_lines (
  id                uuid primary key default uuid_generate_v4(),
  order_id          uuid not null references orders(id) on delete cascade,
  part_id           uuid not null references parts(id),
  quantity          integer not null check (quantity > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  line_total_cents  integer not null check (line_total_cents >= 0),
  discount_percent  numeric(5,2) not null default 0,
  status            order_line_status not null default 'pending'
);

create index idx_order_lines_order on order_lines(order_id);
create index idx_order_lines_part on order_lines(part_id);

-- ───────────────────────────────────────────────
-- 10. SLA events (audit trail)
-- ───────────────────────────────────────────────

create table sla_events (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  previous_status sla_status,
  new_status      sla_status not null,
  triggered_by    text not null default 'system',  -- 'system' or 'manual'
  note            text,
  occurred_at     timestamptz not null default now()
);

create index idx_sla_events_order on sla_events(order_id);
create index idx_sla_events_occurred on sla_events(occurred_at);

-- ───────────────────────────────────────────────
-- 11. Shipments
-- ───────────────────────────────────────────────

create table shipments (
  id                  uuid primary key default uuid_generate_v4(),
  order_id            uuid not null references orders(id) on delete cascade,
  carrier             text not null,
  tracking_number     text,
  shipping_method     shipping_method not null,
  status              shipment_status not null default 'pending',
  label_url           text,
  cost_cents          integer not null default 0 check (cost_cents >= 0),
  estimated_delivery  timestamptz,
  actual_delivery     timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger shipments_updated_at
  before update on shipments
  for each row execute function update_updated_at();

create index idx_shipments_order on shipments(order_id);
create index idx_shipments_tracking on shipments(tracking_number) where tracking_number is not null;

-- ───────────────────────────────────────────────
-- 12. Suppliers
-- ───────────────────────────────────────────────

create table suppliers (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  contact_email  text,
  contact_phone  text,
  lead_time_days integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger suppliers_updated_at
  before update on suppliers
  for each row execute function update_updated_at();

-- ───────────────────────────────────────────────
-- 13. Supplier ↔ Part junction
-- ───────────────────────────────────────────────

create table supplier_parts (
  id             uuid primary key default uuid_generate_v4(),
  supplier_id    uuid not null references suppliers(id) on delete cascade,
  part_id        uuid not null references parts(id) on delete cascade,
  cost_cents     integer not null check (cost_cents >= 0),
  lead_time_days integer not null default 0,
  is_primary     boolean not null default false,
  unique(supplier_id, part_id)
);

create index idx_supplier_parts_supplier on supplier_parts(supplier_id);
create index idx_supplier_parts_part on supplier_parts(part_id);

-- ───────────────────────────────────────────────
-- 14. Quotes
-- ───────────────────────────────────────────────

create table quotes (
  id                uuid primary key default uuid_generate_v4(),
  company_id        uuid not null references companies(id),
  user_id           uuid not null references auth.users(id),
  status            quote_status not null default 'draft',
  subtotal_cents    integer not null default 0 check (subtotal_cents >= 0),
  discount_cents    integer not null default 0 check (discount_cents >= 0),
  tax_cents         integer not null default 0 check (tax_cents >= 0),
  total_cents       integer not null default 0 check (total_cents >= 0),
  expires_at        timestamptz not null,
  converted_order_id uuid references orders(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger quotes_updated_at
  before update on quotes
  for each row execute function update_updated_at();

create index idx_quotes_company on quotes(company_id);
create index idx_quotes_user on quotes(user_id);

-- ───────────────────────────────────────────────
-- 15. Quote lines
-- ───────────────────────────────────────────────

create table quote_lines (
  id                uuid primary key default uuid_generate_v4(),
  quote_id          uuid not null references quotes(id) on delete cascade,
  part_id           uuid not null references parts(id),
  quantity          integer not null check (quantity > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  line_total_cents  integer not null check (line_total_cents >= 0),
  discount_percent  numeric(5,2) not null default 0
);

create index idx_quote_lines_quote on quote_lines(quote_id);

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Helper: get the current user's role from their profile
create or replace function public.user_role()
returns user_role as $$
  select role from user_profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: get the current user's company_id
create or replace function public.user_company_id()
returns uuid as $$
  select company_id from user_profiles where id = auth.uid();
$$ language sql security definer stable;

-- ─── Enable RLS on all tables ───

alter table user_profiles enable row level security;
alter table companies enable row level security;
alter table models enable row level security;
alter table parts enable row level security;
alter table compatibility enable row level security;
alter table contracts enable row level security;
alter table contract_tiers enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
alter table sla_events enable row level security;
alter table shipments enable row level security;
alter table suppliers enable row level security;
alter table supplier_parts enable row level security;
alter table quotes enable row level security;
alter table quote_lines enable row level security;

-- ─── Models & Parts: publicly readable (catalog) ───

create policy "models_read_all" on models
  for select using (true);

create policy "models_admin_write" on models
  for all using (public.user_role() in ('admin', 'ops'));

create policy "parts_read_all" on parts
  for select using (true);

create policy "parts_admin_write" on parts
  for all using (public.user_role() in ('admin', 'ops'));

create policy "compat_read_all" on compatibility
  for select using (true);

create policy "compat_admin_write" on compatibility
  for all using (public.user_role() in ('admin', 'ops'));

-- ─── User profiles: see your own, admins see all ───

create policy "profiles_read_own" on user_profiles
  for select using (
    id = auth.uid()
    or public.user_role() in ('admin', 'ops')
  );

create policy "profiles_update_own" on user_profiles
  for update using (id = auth.uid());

create policy "profiles_admin_all" on user_profiles
  for all using (public.user_role() = 'admin');

-- ─── Companies: see your own company, admins see all ───

create policy "companies_read" on companies
  for select using (
    id = public.user_company_id()
    or public.user_role() in ('admin', 'ops')
  );

create policy "companies_admin_write" on companies
  for all using (public.user_role() = 'admin');

-- ─── Contracts: see your company's, admins see all ───

create policy "contracts_read" on contracts
  for select using (
    company_id = public.user_company_id()
    or public.user_role() in ('admin', 'ops')
  );

create policy "contracts_admin_write" on contracts
  for all using (public.user_role() = 'admin');

create policy "contract_tiers_read" on contract_tiers
  for select using (
    exists (
      select 1 from contracts
      where contracts.id = contract_tiers.contract_id
      and (contracts.company_id = public.user_company_id() or public.user_role() in ('admin', 'ops'))
    )
  );

create policy "contract_tiers_admin_write" on contract_tiers
  for all using (public.user_role() = 'admin');

-- ─── Orders: see your company's, admins/ops see all ───

create policy "orders_read" on orders
  for select using (
    company_id = public.user_company_id()
    or public.user_role() in ('admin', 'ops')
  );

create policy "orders_buyer_insert" on orders
  for insert with check (
    company_id = public.user_company_id()
    and user_id = auth.uid()
  );

create policy "orders_admin_write" on orders
  for all using (public.user_role() in ('admin', 'ops'));

create policy "order_lines_read" on order_lines
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_lines.order_id
      and (orders.company_id = public.user_company_id() or public.user_role() in ('admin', 'ops'))
    )
  );

create policy "order_lines_admin_write" on order_lines
  for all using (public.user_role() in ('admin', 'ops'));

-- ─── SLA events: follow order visibility ───

create policy "sla_events_read" on sla_events
  for select using (
    exists (
      select 1 from orders
      where orders.id = sla_events.order_id
      and (orders.company_id = public.user_company_id() or public.user_role() in ('admin', 'ops'))
    )
  );

create policy "sla_events_system_write" on sla_events
  for all using (public.user_role() in ('admin', 'ops'));

-- ─── Shipments: follow order visibility ───

create policy "shipments_read" on shipments
  for select using (
    exists (
      select 1 from orders
      where orders.id = shipments.order_id
      and (orders.company_id = public.user_company_id() or public.user_role() in ('admin', 'ops'))
    )
  );

create policy "shipments_admin_write" on shipments
  for all using (public.user_role() in ('admin', 'ops'));

-- ─── Suppliers: admin/ops only ───

create policy "suppliers_admin_read" on suppliers
  for select using (public.user_role() in ('admin', 'ops'));

create policy "suppliers_admin_write" on suppliers
  for all using (public.user_role() = 'admin');

create policy "supplier_parts_admin_read" on supplier_parts
  for select using (public.user_role() in ('admin', 'ops'));

create policy "supplier_parts_admin_write" on supplier_parts
  for all using (public.user_role() = 'admin');

-- ─── Quotes: see your company's, admins see all ───

create policy "quotes_read" on quotes
  for select using (
    company_id = public.user_company_id()
    or public.user_role() in ('admin', 'ops')
  );

create policy "quotes_buyer_insert" on quotes
  for insert with check (
    company_id = public.user_company_id()
    and user_id = auth.uid()
  );

create policy "quotes_admin_write" on quotes
  for all using (public.user_role() in ('admin', 'ops'));

create policy "quote_lines_read" on quote_lines
  for select using (
    exists (
      select 1 from quotes
      where quotes.id = quote_lines.quote_id
      and (quotes.company_id = public.user_company_id() or public.user_role() in ('admin', 'ops'))
    )
  );

create policy "quote_lines_admin_write" on quote_lines
  for all using (public.user_role() in ('admin', 'ops'));

-- ═══════════════════════════════════════════════════════════════
-- Enable Realtime for SLA-critical tables
-- ═══════════════════════════════════════════════════════════════

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table sla_events;
alter publication supabase_realtime add table shipments;
