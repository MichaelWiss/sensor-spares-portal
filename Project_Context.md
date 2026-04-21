# Sensor Spares Portal — Project Context

## What This Project Is

A **B2B e-commerce portal for industrial sensor spare parts**. Factory buyers search for compatible parts by sensor model, receive contract-tier pricing, place orders with SLA guarantees, and track fulfillment in real time.

This is not a demo or a generic storefront template. It is a production-grade procurement tool designed for the industrial maintenance market — where downtime costs are high, parts compatibility is non-obvious, and pricing is negotiated per buyer.

---

## Problem Statement

Factory maintenance and procurement teams need:

- **Parts compatibility** — which spare part fits a specific sensor model? Is it an exact OEM replacement, an equivalent, or an aftermarket option?
- **Negotiated pricing** — contract-tier discounts (standard/silver/gold/platinum) plus volume breaks that stack on top of the base tier
- **SLA-backed fulfillment** — emergency (4h), standard (24h), economy (72h) guarantees with real-time breach alerts
- **Order visibility** — line-level tracking for partial fulfillments, carrier tracking, SLA countdown

Off-the-shelf B2B platforms (Salesforce B2B Commerce, SAP Ariba) are expensive and slow to configure for industrial parts workflows. This project builds a purpose-fit solution on modern, cost-effective infrastructure.

---

## Target User

**Factory procurement teams** — maintenance planners, buyers, and plant engineers who need to quickly identify the right spare part for a sensor that has failed or is approaching end-of-life.

**Operations staff** (role: `ops`) — warehouse pickers managing SLA timers, partial shipments, and own-courier dispatch.

**Administrators** (role: `admin`) — managing company contracts, pricing tiers, and supplier data.

---

## Core Features

### P0 — The Spine (must work for anything else to matter)

1. **Model catalog** — Browse and search sensor models (e.g. "Honeywell ST800 Pressure Transmitter") via Typesense full-text search
2. **Compatibility engine** — For each model, return compatible parts with `fit_type`: `exact` (OEM), `equivalent` (drop-in substitute), or `aftermarket`
3. **Contract-tier pricing** — Every authenticated buyer sees their negotiated price. Unauthenticated visitors see list price only

### P1 — Order Lifecycle

4. **Cart & checkout** — Medusa.js handles cart, line items, shipping rate calculation (Shippo), and payment (Stripe ACH or Net-30 invoice)
5. **SLA selection** — Buyer chooses emergency / standard / economy at checkout. SLA deadline is stamped on order creation
6. **Order tracking** — Real-time status updates via Supabase Realtime. Per-line status visible for partial fulfillments
7. **SLA dashboard** — Ops team sees active orders sorted by SLA deadline. Color-coded: green (on_track), amber (warning), red (breach/breached)

### P2 — Fulfillment & Integrations

8. **ERPNext sync** — Nightly pull of stock quantities, lead times, and supplier costs. Safety stock thresholds trigger reorder alerts
9. **Shippo labels** — Multi-carrier label generation (UPS, FedEx, USPS) with rate comparison at checkout
10. **Own courier** — Orders within 50 miles dispatched to own courier at $80 flat rate, 2hr estimated delivery. 30-minute dispatch timeout before automatic fallback to UPS overnight
11. **Boxwise WMS** — Bin locations and fast-pick zone assignments for warehouse picks
12. **Resend email** — Transactional emails: order confirmation, SLA warning alerts, shipment tracking

---

## Technology Decisions & Rationale

| Decision | Choice | Alternative Considered | Why This One |
|----------|--------|----------------------|--------------|
| **Language** | TypeScript only | Python | Owner preference; all logic stays in one language across monorepo |
| **Monorepo** | pnpm workspaces + Turborepo | Nx, Lerna | Fast installs, simple config, excellent Turborepo task caching |
| **Frontend** | Next.js 14 (App Router) | Remix, SvelteKit | Vercel deploys free, RSC for catalog pages, largest ecosystem |
| **Commerce API** | Medusa.js | Custom REST API, Commerce.js | Headless OMS with built-in cart, checkout, inventory hooks; TypeScript-native |
| **Database** | Supabase Postgres | Neon, PlanetScale | Built-in Auth, Realtime, Edge Functions, RLS, generous free tier — no extra services |
| **Realtime** | Supabase Realtime (WebSocket) | Upstash Redis + SSE | Zero extra infrastructure; order/SLA updates pushed directly from DB |
| **Search** | Typesense | Algolia, Elasticsearch | Self-hostable, typo-tolerant, fast, lower cost at scale |
| **Payments** | Stripe | Braintree, Adyen | ACH + Net-30 invoicing in one SDK; best B2B payment tooling |
| **ERP** | ERPNext | SAP, Odoo | Open source, REST API, no per-seat licensing |
| **WMS** | Boxwise | Custom WMS | Purpose-built for small warehouses; bin/pick zone management out of the box |
| **Shipping** | Shippo | EasyPost, ShipStation | Multi-carrier, simple label API, rate comparison endpoint |
| **Own courier** | Dispatch system | Third-party courier API | Sub-50mi deliveries; flat rate model is simpler and cheaper at low volume |
| **Email** | Resend | SendGrid, Postmark | Clean SDK, React Email templates, generous free tier |
| **Analytics** | PostHog | Mixpanel, Amplitude | Self-hostable, open source, feature flags + session recording included |

### What We Explicitly Deferred

- **Mobile native app** — responsive web is sufficient for factory floor use
- **Multi-tenant architecture** — single Supabase project per deployment; multi-tenancy via RLS company scoping
- **ML-based recommendations** — compatibility is rule-based (fit_type graph); no ML needed for v1
- **Custom ERP** — ERPNext via REST only; core portal works without it while integration is built
- **Apache Superset / external BI** — PostHog covers product analytics; order/SLA dashboards are in-app

---

## Domain Model Relationships

```
Model ──────────────── Compatibility ─────────────────── Part
(sensor models)      (fit_type: exact /              (SKUs, base_price_cents,
                      equivalent / aftermarket)        stock_quantity, lead_time)

Company ─────────────── Contract ────────────────── ContractTier
(buyer org)          (tier: standard / silver /    (minQuantity →
                      gold / platinum,               additionalDiscountPercent)
                      discountPercent)

Order ───────────────── OrderLine ──────────────────── Part
(order_number,       (quantity, unit_price_cents,   (via partId)
 sla_tier,            line_total_cents,
 sla_deadline,        status: pending → delivered)
 sla_status)
  │
  └──── SlaEvent (audit trail of SLA state changes)
  └──── Shipment (carrier, tracking, label_url)

Supplier ─────────────── SupplierPart ─────────────── Part
(from ERPNext)        (cost_cents,                 (via partId)
                       is_primary,
                       lead_time_days)
```

---

## Database Schema (15 Tables)

| Table | Key Columns | Notes |
|-------|------------|-------|
| `user_profiles` | `id`, `role`, `company_id` | Extends `auth.users`. Role: buyer/admin/ops |
| `companies` | `id`, `name`, `billing_address` | Buyer organizations |
| `models` | `id`, `name`, `manufacturer`, `sensor_type` | Sensor model registry |
| `parts` | `id`, `sku`, `base_price_cents`, `stock_quantity`, `lead_time_days`, `safety_stock` | All prices in cents |
| `compatibility` | `model_id`, `part_id`, `fit_type` | M2M: exact / equivalent / aftermarket |
| `contracts` | `company_id`, `tier`, `discount_percent`, `starts_at`, `expires_at` | Active contract per company |
| `contract_tiers` | `contract_id`, `min_quantity`, `additional_discount_percent` | Volume break rows |
| `orders` | `order_number`, `company_id`, `status`, `sla_tier`, `sla_deadline`, `sla_status`, `total_cents` | SLA deadline stamped at confirmation |
| `order_lines` | `order_id`, `part_id`, `quantity`, `unit_price_cents`, `line_total_cents`, `status` | Per-line status for partial fulfillment |
| `sla_events` | `order_id`, `previous_status`, `new_status`, `triggered_by`, `occurred_at` | Immutable audit trail |
| `shipments` | `order_id`, `carrier`, `tracking_number`, `shipping_method`, `cost_cents`, `label_url` | Shippo or own courier |
| `suppliers` | `id`, `name`, `contact_email`, `lead_time_days`, `is_active` | Synced from ERPNext |
| `supplier_parts` | `supplier_id`, `part_id`, `cost_cents`, `is_primary` | One primary supplier per part |
| `quotes` | `company_id`, `status` | Status: draft/sent/accepted/expired/converted. Valid 7 days |
| `quote_lines` | `quote_id`, `part_id`, `quantity`, `unit_price_cents` | Line items on a quote |

**RLS pattern:**
- `models`, `parts`, `compatibility` — public `SELECT` (no auth required for catalog browsing)
- `orders`, `order_lines`, `quotes`, `contracts` — scoped to `auth.user_company_id()`
- `suppliers`, `supplier_parts` — admin/ops only via `auth.user_role()`
- Realtime enabled on: `orders`, `sla_events`, `shipments`

---

## State Machines

### Order Status

```
pending → confirmed → picking → packed → shipped → delivered → fulfilled
   │          │           │         │
   └──────────┴───────────┴─────────┴──────────────────────────▶ cancelled
```

| Status | Meaning |
|--------|---------|
| `pending` | Placed, awaiting payment confirmation |
| `confirmed` | Payment confirmed, SLA timer started |
| `picking` | Warehouse picking items |
| `packed` | Items packed, awaiting label/dispatch |
| `shipped` | In transit with carrier |
| `delivered` | Carrier confirmed delivery |
| `fulfilled` | Order complete, SLA closed |
| `cancelled` | Cancelled from any pre-shipped state |

### SLA Status

```
on_track → warning → breach → breached
    └──────────┴──────────┴──────────┴──────▶ fulfilled
```

| Status | Meaning |
|--------|---------|
| `on_track` | Within deadline, no alerts |
| `warning` | Crossed warning threshold; alert sent to ops |
| `breach` | Crossed breach threshold; escalation triggered |
| `breached` | Deadline passed without fulfillment |
| `fulfilled` | Order fulfilled within deadline |

---

## SLA Policies

| Tier | Window | Warning fires at | Breach fires at |
|------|--------|-----------------|-----------------|
| `emergency` | 4 hours (240 min) | 90 min remaining | 110 min remaining |
| `standard` | 24 hours (1,440 min) | 360 min (6hr) remaining | 120 min (2hr) remaining |
| `economy` | 72 hours (4,320 min) | 720 min (12hr) remaining | 240 min (4hr) remaining |

SLA check runs every 60 seconds via Supabase Edge Function (`sla-check`).

---

## Pricing Logic

All monetary values are stored and transmitted as **integers in cents** (e.g. $12.50 = `1250`).

```
Effective discount = base tier discount + volume break (stacking)

Contract tier base discounts:
  standard   0%
  silver     8%
  gold      15%
  platinum  22%

Volume breaks (additional, on top of tier):
  qty ≥  10  → +2%
  qty ≥  50  → +5%
  qty ≥ 100  → +8%

unit_price_cents = Math.round(basePriceCents × (1 − totalDiscountPercent / 100))
line_total_cents = unit_price_cents × quantity
```

Implemented in `packages/engine-pricing` — pure functions, fully unit-tested.

---

## Data Flows

### Buyer-Initiated

| Trigger | Flow | Result |
|---------|------|--------|
| Search for model | Browser → Typesense → parts results | Ranked compatible parts with fit_type |
| View model detail | Browser → Supabase (`models`, `compatibility`, `parts`) | Full compatibility list with live stock |
| Add to cart | Browser → Medusa.js cart API | Cart with contract-tier line prices |
| Checkout | Browser → Medusa → Stripe / Shippo → Supabase `orders` | Order row created, SLA deadline stamped |
| Track order | Browser ← Supabase Realtime | Live status updates on order page |

### Scheduled

| Schedule | Edge Function | Source → Target |
|----------|--------------|-----------------|
| Every 60s | `sla-check` | `orders` → `sla_events`, Resend alert |
| Nightly | `inventory-sync` | ERPNext REST → `parts.stock_quantity`, `lead_time_days` |
| On event | `order-webhook` | Stripe webhook → `orders.status = confirmed` |

### Shipment

| Method | Condition | Rate | Estimated delivery |
|--------|-----------|------|--------------------|
| Own courier | <50 miles | $80 flat | 2 hours |
| UPS overnight | Fallback (own courier timeout 30min) | Shippo rate | Next day |
| UPS ground / FedEx / USPS | Buyer selection at checkout | Shippo rate | Carrier ETA |

---

## Environment Variables

| Variable | Service | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Public browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Public browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server-side only — never expose to browser |
| `MEDUSA_BACKEND_URL` | Medusa | Internal API URL |
| `MEDUSA_PUBLISHABLE_KEY` | Medusa | Public storefront key |
| `STRIPE_SECRET_KEY` | Stripe | Server-side |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Public browser key |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signature verification |
| `TYPESENSE_HOST` | Typesense | Search cluster host |
| `TYPESENSE_API_KEY` | Typesense | Admin key (server) |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | Typesense | Search-only key (browser) |
| `ERPNEXT_URL` | ERPNext | Base URL for REST API |
| `ERPNEXT_API_KEY` | ERPNext | API key |
| `ERPNEXT_API_SECRET` | ERPNext | API secret |
| `SHIPPO_API_KEY` | Shippo | Label & rate API |
| `BOXWISE_API_KEY` | Boxwise | WMS API |
| `RESEND_API_KEY` | Resend | Transactional email |
| `POSTHOG_API_KEY` | PostHog | Analytics event ingestion |
| `OWN_COURIER_DISPATCH_URL` | Own courier | Dispatch system endpoint |
| `OWN_COURIER_RADIUS_MILES` | Own courier | Default: 50 |
| `OWN_COURIER_TIMEOUT_MINUTES` | Own courier | Default: 30 (fallback to carrier after this) |

---

## Non-Goals (Explicitly Out of Scope for v1)

- **Public parts catalog** — catalog is viewable without auth but priced/purchasable only with a company account
- **Consumer-facing storefront** — this is B2B only; no guest checkout, no consumer pricing
- **Mobile-native app** — responsive web is sufficient for factory floor access
- **Multi-tenant SaaS** — single deployment per customer; multi-tenancy is via RLS company scoping, not separate projects
- **ML-based compatibility suggestions** — fit_type is deterministic (data-driven graph), not inferred
- **Customs/trade compliance documents** — deferred; ERP integration handles this post-v1
- **Full ERP/OMS build** — ERPNext via REST adapter only; Medusa handles OMS
- **Historical reporting beyond order data** — PostHog covers product analytics; no custom data warehouse
- **Real-time inventory reservation** — stock is informational (synced nightly from ERPNext); oversell prevention is handled by ERPNext, not this portal
