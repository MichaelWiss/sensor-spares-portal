# Sensor Spares Portal — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                            │
│                                                                         │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐              │
│  │  ERPNext   │  │Typesense │  │  Stripe │  │  Shippo  │              │
│  │ (REST API) │  │ (search) │  │(payments│  │(shipping │              │
│  │            │  │          │  │ ACH+inv)│  │  labels) │              │
│  │ Inventory  │  │ Parts    │  │         │  │          │              │
│  │ Suppliers  │  │ catalog  │  │ ACH     │  │ UPS      │              │
│  │ Safety stk │  │ index    │  │ Net-30  │  │ FedEx    │              │
│  └─────┬──────┘  └────┬─────┘  └────┬────┘  └────┬─────┘              │
│        │              │             │             │                     │
│  ┌─────┴──────┐  ┌────┴──────┐  ┌──┴───────┐  ┌──┴──────────┐        │
│  │  Boxwise   │  │  Resend   │  │ PostHog  │  │ Own Courier │        │
│  │  (WMS)     │  │  (email)  │  │(analytics│  │ (<50mi      │        │
│  │            │  │           │  │          │  │  same-day)  │        │
│  │ Bin locs   │  │ SLA alerts│  │ Events   │  │ $80 flat    │        │
│  │ Fast-pick  │  │ Order cfm │  │ Funnels  │  │ 2hr deliv   │        │
│  └─────┬──────┘  └────┬──────┘  └────┬─────┘  └──────┬──────┘        │
└────────┼──────────────┼──────────────┼────────────────┼───────────────┘
         │              │              │                │
         ▼              ▼              │                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPS LAYER                                      │
│                                                                         │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐    │
│  │       apps/web  [planned]        │  │   apps/medusa  [planned]  │    │
│  │   Next.js 14 (App Router)        │  │  Medusa.js headless OMS   │    │
│  │   Tailwind CSS + shadcn/ui       │  │                           │    │
│  │   Deployed on Vercel             │  │  Order management API     │    │
│  │                                  │  │  Cart, checkout, catalog  │    │
│  │  /               Storefront home │  │  Inventory hooks          │    │
│  │  /models         Model catalog   │  │  Shippo rate calculation  │    │
│  │  /models/[id]    Compat. parts   │  │  Stripe payment flows     │    │
│  │  /cart           Cart & checkout │  │                           │    │
│  │  /orders         Order history   │  │  Realtime: order status   │    │
│  │  /orders/[id]    SLA tracker     │  │  via Supabase channel     │    │
│  │  /account        Profile, tiers  │  │                           │    │
│  │  /admin/*        Ops dashboard   │  │                           │    │
│  └──────────────────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
         │              │              │                │
         ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PACKAGES LAYER                                   │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────────────────────────────┐   │
│  │    @repo/shared      │   │        engine-pricing  [live]        │   │
│  │       [live]         │   │                                      │   │
│  │                      │   │  getBaseDiscount()                   │   │
│  │  18 domain interfaces│   │  getVolumeBreak()                    │   │
│  │  11 union types      │   │  calculateTotalDiscount()            │   │
│  │  State machines:     │   │  calculateLinePrice()                │   │
│  │   ORDER_STATUS_      │   │  calculateOrderTotal()               │   │
│  │   TRANSITIONS        │   │                                      │   │
│  │   SLA_STATUS_        │   │  Tier discounts + volume break       │   │
│  │   TRANSITIONS        │   │  stacking. All values in cents.      │   │
│  │  SLA policies        │   │                                      │   │
│  │  Contract tier       │   │                                      │   │
│  │  discounts           │   │                                      │   │
│  │  Volume breaks       │   └──────────────────────────────────────┘   │
│  └──────────────────────┘                                               │
│                                                                         │
│  ┌────────────────────────────┐   ┌────────────────────────────────┐   │
│  │  engine-parts-graph        │   │       engine-sla  [planned]    │   │
│  │       [planned]            │   │                                │   │
│  │                            │   │  SLA deadline calculation      │   │
│  │  Model → SKU compatibility │   │  Threshold evaluation          │   │
│  │  FitType: exact /          │   │  State machine enforcement     │   │
│  │    equivalent / aftermarket│   │  Escalation triggers           │   │
│  │  Graph traversal           │   │  Poll interval: 60s            │   │
│  │                            │   │                                │   │
│  └────────────────────────────┘   └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
         │              │              │                │
         ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   SUPABASE (Backend-as-a-Service)                       │
│                                                                         │
│  ┌──────────────────────── Postgres + RLS ──────────────────────────┐  │
│  │                                                                   │  │
│  │  ── Catalog ──────────────────────────────────────────────────   │  │
│  │  models            Sensor model registry                         │  │
│  │  parts             SKUs with base_price_cents, stock, lead time  │  │
│  │  compatibility     Model ↔ Part M2M (fit_type: exact/equiv/afmk) │  │
│  │                                                                   │  │
│  │  ── Companies & Pricing ──────────────────────────────────────   │  │
│  │  companies         Buyer organizations                           │  │
│  │  contracts         Company → tier (standard/silver/gold/platinum)│  │
│  │  contract_tiers    Volume break thresholds per contract          │  │
│  │                                                                   │  │
│  │  ── Orders ───────────────────────────────────────────────────   │  │
│  │  orders            order_number, sla_tier, sla_deadline,         │  │
│  │                    sla_status, subtotal/discount/shipping/tax     │  │
│  │  order_lines       Per-line status (partial fulfillment)         │  │
│  │  sla_events        Audit trail of SLA state changes              │  │
│  │  shipments         Tracking, label URL, estimated/actual deliv   │  │
│  │                                                                   │  │
│  │  ── Supply ───────────────────────────────────────────────────   │  │
│  │  suppliers         ERPNext-synced supplier registry              │  │
│  │  supplier_parts    Supplier ↔ Part (cost_cents, is_primary)      │  │
│  │                                                                   │  │
│  │  ── Quotes ───────────────────────────────────────────────────   │  │
│  │  quotes            draft/sent/accepted/expired/converted         │  │
│  │  quote_lines       Per-line qty, unit price, discount            │  │
│  │  user_profiles     role (buyer/admin/ops), company_id            │  │
│  │                                                                   │  │
│  │  RLS helpers: auth.user_role()  auth.user_company_id()           │  │
│  │  Public read: models, parts, compatibility                       │  │
│  │  Company-scoped: orders, contracts, quotes                       │  │
│  │  Admin/ops only: suppliers, supplier_parts                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────── Realtime Engine ─────────────────────────────┐  │
│  │                                                                   │  │
│  │  Channels:                                                        │  │
│  │    order-status   →  orders INSERT/UPDATE                         │  │
│  │    sla-events     →  sla_events INSERT                            │  │
│  │    shipments      →  shipments INSERT/UPDATE                      │  │
│  │                                                                   │  │
│  │  Pushes changes to browser via WebSocket                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────── Auth ────────────────────────────────────────┐  │
│  │  Email + password. user_profiles extends auth.users.             │  │
│  │  Roles: buyer (company-scoped) · admin (full) · ops (warehouse)  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────── Edge Functions  [planned] ───────────────────────┐  │
│  │  inventory-sync   Pull stock + lead times from ERPNext            │  │
│  │  order-webhook    Handle Stripe payment events                    │  │
│  │  sla-check        Cron (60s): evaluate deadlines, fire alerts     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
                ┌──────────────────────────────────┐
                │       BUYER-INITIATED FLOWS       │
                └──────────────────────────────────┘

  Catalog browse:
  ┌─────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────┐
  │ Browser │──▶│ apps/web │──▶│  Typesense   │──▶│  Search      │
  │         │   │(Next.js) │   │  (search)    │   │  results     │
  └─────────┘   └──────────┘   └──────────────┘   └──────────────┘
                     │
                     │ fallback / detail fetch
                     ▼
               ┌──────────────────┐
               │ Supabase Postgres│
               │ models + parts   │
               │ compatibility    │
               └──────────────────┘

  Checkout:
  ┌─────────┐   ┌──────────┐   ┌────────────────┐   ┌──────────────┐
  │ Browser │──▶│ apps/web │──▶│ apps/medusa    │──▶│   Stripe     │
  │  cart   │   │          │   │ (OMS / cart)   │   │ (ACH / inv.) │
  └─────────┘   └──────────┘   └────────────────┘   └──────────────┘
                                       │
                               ┌───────┴────────┐
                               │                │
                               ▼                ▼
                     ┌──────────────┐   ┌──────────────┐
                     │   Shippo     │   │  Supabase    │
                     │ (rate calc,  │   │  orders +    │
                     │  labels)     │   │  order_lines │
                     └──────────────┘   └──────┬───────┘
                                               │
                                    Realtime WebSocket push
                                               │
                                               ▼
                                     ┌──────────────────┐
                                     │ Browser (order   │
                                     │ status page)     │
                                     └──────────────────┘

                ┌──────────────────────────────────┐
                │         SCHEDULED FLOWS           │
                └──────────────────────────────────┘

  Every 60s:
  ┌───────────┐   ┌────────────────────┐   ┌─────────────────┐
  │ Supabase  │──▶│ sla-check          │──▶│ sla_events      │
  │ orders    │   │ (Edge Fn / cron)   │   │ INSERT          │──▶ Resend alert
  └───────────┘   └────────────────────┘   └─────────────────┘

  Nightly:
  ┌───────────┐   ┌────────────────────┐   ┌─────────────────┐
  │  ERPNext  │──▶│ inventory-sync     │──▶│ parts.stock_    │
  │  REST API │   │ (Edge Function)    │   │ quantity +      │
  └───────────┘   └────────────────────┘   │ lead_time_days  │
                                           └─────────────────┘

  On Stripe event:
  ┌───────────┐   ┌────────────────────┐   ┌──────────────────┐
  │  Stripe   │──▶│ order-webhook      │──▶│ orders.status    │
  │  webhook  │   │ (Edge Function)    │   │ confirmed →      │
  └───────────┘   └────────────────────┘   │ SLA timer starts │
                                           └──────────────────┘

                ┌──────────────────────────────────┐
                │       OWN-COURIER FLOW            │
                └──────────────────────────────────┘

  ┌───────────┐   ┌────────────────────┐   ┌──────────────────┐
  │  Order    │──▶│ Dispatch system    │──▶│ Shipment row     │
  │ packed    │   │ (30min timeout)    │   │ own_courier      │
  │ <50 miles │   │ $80 flat / 2hr ETA │   │ tracking update  │
  └───────────┘   └────────────────────┘   └──────────────────┘
                  fallback after 30min ──▶ ups_overnight
```

---

## Order & SLA State Machines

```
  ORDER STATUS

  pending ──▶ confirmed ──▶ picking ──▶ packed ──▶ shipped ──▶ delivered ──▶ fulfilled
     │             │            │           │
     └─────────────┴────────────┴───────────┴──▶ cancelled


  SLA STATUS (per order, evaluated every 60s)

  on_track ──▶ warning ──▶ breach ──▶ breached
      └──────────┴────────────┴──────────┴──▶ fulfilled
```

---

## Pricing Model

```
  List price (basePriceCents)
       │
       ├── Contract tier base discount
       │     standard  0 %
       │     silver    8 %
       │     gold     15 %
       │     platinum 22 %
       │
       ├── Volume break (stacks on top)
       │     qty ≥  10  → +2 %
       │     qty ≥  50  → +5 %
       │     qty ≥ 100  → +8 %
       │
       ▼
  unit_price = round(basePriceCents × (1 − totalDiscount / 100))
  line_total = unit_price × quantity
```

---

## Directory Structure

```
sensor-spares-portal/
├── AGENTS.md                          Agent workflow guidance
├── ARCHITECTURE.md                    This file
├── Project_Context.md                 Project details & tech decisions
├── Repo_map.md                        Living index of what lives where
├── README.md                          Public-facing readme
├── plan.md                            Phased learning & build plan
├── package.json                       Root workspace (pnpm + Turborepo)
├── pnpm-workspace.yaml                Workspace roots: apps/*, packages/*, integrations/*
├── turbo.json                         Task pipeline (build, dev, lint, typecheck, test)
├── tsconfig.base.json                 Base TS config (ES2022, ESNext, bundler, strict)
├── .env.example                       Required env vars template
│
├── apps/                              [planned]
│   ├── web/                           Next.js 14 storefront (Vercel)
│   └── medusa/                        Medusa.js headless OMS
│
├── packages/
│   ├── shared/                        @repo/shared — domain types & constants
│   │   └── src/
│   │       ├── types.ts               18 interfaces, 11 union types
│   │       ├── constants.ts           State machines, SLA policies, tier discounts
│   │       └── index.ts               Barrel export
│   ├── engine-pricing/                Contract-tier pricing calculator [live]
│   │   └── src/
│   │       ├── discount.ts            getBaseDiscount, getVolumeBreak
│   │       ├── line-price.ts          calculateLinePrice
│   │       ├── order-total.ts         calculateOrderTotal
│   │       ├── index.ts               Barrel export
│   │       └── __tests__/             Vitest unit tests
│   ├── engine-parts-graph/            Model → SKU compatibility engine [planned]
│   └── engine-sla/                    SLA timer & escalation logic [planned]
│
├── integrations/                      [planned]
│   ├── erpnext/                       Inventory & supplier sync
│   ├── typesense/                     Parts catalog search index
│   ├── shippo/                        Multi-carrier shipping rates & labels
│   ├── boxwise/                       WMS bin locations & pick zones
│   ├── stripe/                        Payment processing (ACH + invoicing)
│   ├── resend/                        Transactional email (SLA alerts)
│   └── posthog/                       Product analytics
│
├── supabase/
│   ├── config.toml                    Supabase CLI project config
│   ├── seed.sql                       Demo data
│   ├── migrations/
│   │   └── 00001_initial_schema.sql   15 tables, 11 enums, RLS, Realtime
│   ├── snippets/                      Reusable SQL snippets
│   └── functions/                     [planned]
│       ├── inventory-sync/            Pull stock from ERPNext
│       ├── order-webhook/             Handle Stripe payment events
│       └── sla-check/                 Cron: evaluate deadlines, fire escalations
│
└── docs/
    ├── schema-erd.mmd                 Mermaid entity-relationship diagram
    └── diagrams/                      Rendered diagram exports
```

---

## Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui | Planned |
| Commerce API | Medusa.js headless OMS | Planned |
| Database | Supabase Postgres + RLS | Live |
| Auth | Supabase Auth | Live (schema) |
| Realtime | Supabase Realtime (WebSocket) | Live (schema) |
| Search | Typesense | Planned |
| Payments | Stripe (ACH + Net-30 invoicing) | Planned |
| ERP | ERPNext (inventory, suppliers) | Planned |
| WMS | Boxwise (bin locations, pick zones) | Planned |
| Shipping labels | Shippo (UPS, FedEx, USPS) | Planned |
| Own courier | Dispatch system (<50mi, $80 flat, 2hr ETA) | Planned |
| Email | Resend (SLA alerts, order confirmations) | Planned |
| Analytics | PostHog | Planned |
| Pricing engine | TypeScript package (`engine-pricing`) | Live |
| Compatibility engine | TypeScript package (`engine-parts-graph`) | Planned |
| SLA engine | TypeScript package (`engine-sla`) | Planned |
| Monorepo | pnpm workspaces + Turborepo | Live |
| Language | TypeScript only (ES2022, strict) | Live |
| Deployment | Vercel (web) + TBD (medusa) | Planned |
