# Sensor Spares Portal — Repository Map

A living index of what lives where. Update when folders/files are added or moved.

---

## Top Level

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Agent workflow: project overview, commands, architecture conventions |
| `ARCHITECTURE.md` | System architecture reference — ASCII schematic, data flows, state machines |
| `Project_Context.md` | What the project is, tech decisions, domain model, non-goals |
| `Repo_map.md` | This file |
| `README.md` | Public-facing readme — tech stack, prerequisites, getting started |
| `plan.md` | Phased learning & build plan (source of truth for "what's next") |
| `package.json` | Root workspace config — scripts (`dev`, `build`, `lint`, `typecheck`, `clean`) |
| `pnpm-workspace.yaml` | Workspace roots: `apps/*`, `packages/*`, `integrations/*` |
| `turbo.json` | Turborepo task pipeline definitions |
| `tsconfig.base.json` | Base TypeScript config (ES2022, ESNext, bundler resolution, strict) |
| `.env.example` | Committed template of all required env vars (no secrets) |

---

## packages/shared/

`@repo/shared` — Domain types and business constants. Every other package and app imports from here.

| Path | Purpose |
|------|---------|
| `packages/shared/src/types.ts` | 18 domain interfaces, 11 union types — the complete data model |
| `packages/shared/src/constants.ts` | SLA policies, contract tier discounts, volume breaks, state machine transition maps, shipping method labels, quote validity |
| `packages/shared/src/index.ts` | Barrel export — re-exports everything from `types.ts` and `constants.ts` |
| `packages/shared/package.json` | Package manifest (`@repo/shared`) |
| `packages/shared/tsconfig.json` | Extends `tsconfig.base.json` |

---

## packages/engine-pricing/

Pricing calculator. Pure functions, no side effects, no DB calls.

| Path | Purpose |
|------|---------|
| `packages/engine-pricing/src/discount.ts` | `getBaseDiscount()` — looks up tier discount; `getVolumeBreak()` — finds applicable volume break |
| `packages/engine-pricing/src/line-price.ts` | `calculateLinePrice()` — applies discount stack to a single order line |
| `packages/engine-pricing/src/order-total.ts` | `calculateOrderTotal()` — aggregates lines into subtotal, discount, totals |
| `packages/engine-pricing/src/index.ts` | Barrel export |
| `packages/engine-pricing/src/__tests__/discount.test.ts` | Unit tests — tier discount lookup, volume break edge cases |
| `packages/engine-pricing/src/__tests__/line-price.test.ts` | Unit tests — per-line price calculation, rounding |
| `packages/engine-pricing/src/__tests__/order-total.test.ts` | Unit tests — order aggregation |
| `packages/engine-pricing/package.json` | Package manifest |
| `packages/engine-pricing/tsconfig.json` | Extends `tsconfig.base.json` |

---

## supabase/

Local Supabase stack — Postgres schema, RLS, seed data.

| Path | Purpose |
|------|---------|
| `supabase/config.toml` | Supabase CLI project config (ports, project ref, auth settings) |
| `supabase/seed.sql` | Demo data: 2 companies, 5 sensor models, 20+ parts, contracts, orders |
| `supabase/migrations/00001_initial_schema.sql` | 15 tables, 11 custom enums, all RLS policies, Realtime publications, helper functions (`user_role()`, `user_company_id()`) |
| `supabase/snippets/` | Reusable SQL snippets for development use |

---

## docs/

| Path | Purpose |
|------|---------|
| `docs/schema-erd.mmd` | Mermaid entity-relationship diagram of the full database schema |
| `docs/diagrams/` | Rendered exports of Mermaid diagrams (PNG) |

---

## Planned (not yet created)

| Path | Added in phase |
|------|---------------|
| `apps/web/` | Phase 3 — Next.js 14 storefront (App Router, Tailwind CSS, shadcn/ui) |
| `apps/medusa/` | Phase 3 — Medusa.js headless OMS backend |
| `packages/engine-parts-graph/` | Phase 4 — Model → SKU compatibility traversal engine |
| `packages/engine-sla/` | Phase 4 — SLA deadline calculator, threshold evaluator, escalation triggers |
| `integrations/erpnext/` | Phase 5 — ERPNext inventory & supplier sync adapter |
| `integrations/typesense/` | Phase 5 — Parts catalog search index adapter |
| `integrations/shippo/` | Phase 5 — Multi-carrier shipping rates & label generation |
| `integrations/boxwise/` | Phase 5 — WMS bin locations & fast-pick zone adapter |
| `integrations/stripe/` | Phase 5 — Payment processing (ACH + Net-30 invoicing) |
| `integrations/resend/` | Phase 5 — Transactional email (SLA alerts, order confirmations) |
| `integrations/posthog/` | Phase 5 — Product analytics event adapter |
| `supabase/functions/inventory-sync/` | Phase 5 — Edge Function: pull stock + lead times from ERPNext |
| `supabase/functions/order-webhook/` | Phase 5 — Edge Function: handle Stripe payment events |
| `supabase/functions/sla-check/` | Phase 4 — Edge Function: cron (60s) evaluate SLA deadlines, fire alerts |
