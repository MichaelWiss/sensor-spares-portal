# Sensor Spares Portal

B2B e-commerce portal for industrial sensor spare parts. Factory buyers search compatible parts by sensor model, get contract-tier pricing, place orders with SLA guarantees, and track fulfillment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Commerce API | Medusa.js (headless OMS) |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions, RLS) |
| Search | Typesense |
| Payments | Stripe (ACH + invoicing) |
| ERP | ERPNext (inventory, suppliers, safety stock) |
| WMS | Boxwise (bin locations, fast-pick zones) |
| Shipping | Shippo (multi-carrier rates) + own courier (<50mi same-day) |
| Email | Resend (SLA alerts, order confirmations) |
| Analytics | PostHog |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.15
- **Supabase CLI** (for local development)
- **Docker** (for Supabase local stack)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start Supabase local stack
supabase start

# 4. Run database migrations & seed
supabase db reset

# 5. Start all services in dev mode
pnpm dev
```

## Project Structure

```
apps/
  web/          → Next.js 14 storefront (Vercel)
  medusa/       → Medusa.js order management backend

packages/
  shared/              → Domain types, constants
  engine-parts-graph/  → Model → SKU compatibility engine
  engine-sla/          → SLA timer & escalation logic
  engine-pricing/      → Contract-tier pricing calculator

integrations/
  erpnext/    → ERPNext inventory & supplier sync
  typesense/  → Parts search index
  shippo/     → Multi-carrier shipping rates & labels
  boxwise/    → WMS bin locations & pick zones
  stripe/     → Payment processing (ACH + invoicing)
  resend/     → Transactional email (SLA alerts)
  posthog/    → Product analytics

supabase/
  migrations/ → Postgres schema (with RLS)
  functions/  → Edge Functions (inventory-sync, order-webhook, sla-check)
  seed.sql    → Demo data
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps/packages in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type-check the entire monorepo |
| `pnpm lint` | Lint all packages |
| `pnpm clean` | Remove all build artifacts and node_modules |
