# Sensor Spares Portal — Cellular Build Plan

## How This Plan Works

This is a **building tool**, not a feature list. Every cell is a single, atomic unit of work with:

- **What to build** — exactly one thing, no ambiguity
- **Inputs** — what must exist before this cell can start
- **Outputs** — the verifiable artifact this cell produces
- **Verify** — how to confirm the cell is complete before moving on
- **Status** — `[ ]` not started, `[~]` in progress, `[x]` done

**Rules:**
1. Never start a cell until its inputs are verified complete
2. Never skip a cell — each one builds on the last
3. Never combine cells — if it feels like two things, it is two things
4. Mark a cell done only when the verify step passes
5. Ask to implement each cell — nothing auto-builds

---

## Phase 1 — Foundation
*The monorepo is wired, the local Supabase stack is running, the domain model is understood. No app code yet — just the shared types, constants, database schema, and local tooling.*

---

### Cell 1.1 — pnpm Workspace Wiring
**What:** Verify the monorepo workspace is correctly linked and `@repo/shared` builds cleanly.

**Inputs:** Repo cloned, Node ≥ 20, pnpm ≥ 9.15 installed

**Outputs:**
- `pnpm install` completes — `node_modules/.pnpm` populated
- `packages/shared/dist/` contains `.js` and `.d.ts` files
- `pnpm --filter @repo/shared typecheck` passes with zero errors

**Verify:** Run `ls packages/shared/dist/` — shows `index.js`, `types.js`, `constants.js`. Run `pnpm --filter @repo/shared typecheck` — exits 0.

**Status:** `[x]`

---

### Cell 1.2 — Turborepo Task Orchestration
**What:** Verify Turborepo correctly infers the dependency graph and runs tasks in order.

**Inputs:** Cell 1.1 complete

**Outputs:**
- `pnpm typecheck` runs from root and type-checks all packages in dependency order
- `pnpm build` runs from root and builds all packages in order
- `turbo.json` contains `build`, `dev`, `lint`, `typecheck`, `test`, `clean` task definitions

**Verify:** Run `pnpm build` from root — output shows Turborepo processing packages in order. Run `pnpm typecheck` — exits 0, zero errors.

**Status:** `[x]`

---

### Cell 1.3 — Local Supabase Stack
**What:** Start the local Supabase Docker stack, apply the migration, and verify seed data is loaded.

**Inputs:** Docker Desktop running, Supabase CLI installed, Cell 1.1 complete

**Outputs:**
- `supabase start` — stack running at `http://127.0.0.1:54321` (API), `54322` (DB), `54323` (Studio)
- `supabase db reset` — migration applied, seed data inserted
- Studio at `http://localhost:54323` shows all 15 tables with rows

**Verify:**
- `curl http://127.0.0.1:54321/rest/v1/parts?select=sku,name&limit=3` returns 3 part rows
- Studio SQL editor: `SELECT count(*) FROM parts;` → 20. `SELECT count(*) FROM compatibility;` → 22. `SELECT count(*) FROM contracts;` → 2.
- Confirm: `models`, `parts`, `compatibility` are publicly readable (anon key, no auth). `suppliers` returns zero rows with anon key.

**Status:** `[x]`

---

### Cell 1.4 — Domain Model Comprehension
**What:** Read the types, constants, and schema until the five domain chains are fully understood. This is a learning cell — no code is written beyond drawing the relationships.

**Inputs:** Cell 1.3 complete

**Outputs:**
- `packages/shared/src/types.ts` read end-to-end (18 interfaces, 11 union types)
- `packages/shared/src/constants.ts` read end-to-end (state machines, SLA policies, tier discounts, volume breaks)
- Five relationship chains understood:
  - **Catalog:** `models` ↔ `parts` via `compatibility` (fit_type: exact/equivalent/aftermarket)
  - **Pricing:** `companies` → `contracts` → `contract_tiers` (volume break stacking)
  - **Orders:** `orders` → `order_lines` → `parts` (per-line status for partial fulfillment)
  - **SLA:** `orders.sla_tier` + `sla_deadline` + `sla_status` → `sla_events` (audit trail)
  - **Supply:** `suppliers` → `supplier_parts` → `parts` (is_primary flag)

**Verify:**
- SQL query in Studio: `SELECT p.sku, p.name, c.fit_type FROM parts p JOIN compatibility c ON c.part_id = p.id JOIN models m ON m.id = c.model_id WHERE m.name LIKE '%ST800%';` — returns 5 rows (4 exact + 1 aftermarket)
- SQL query: `SELECT * FROM contracts JOIN contract_tiers ON contracts.id = contract_tiers.contract_id;` — returns 5 rows (3 for gold, 2 for silver)
- Can explain from memory: why the ST800 diaphragm has both `exact` and `equivalent` compatibility rows

**Status:** `[x]`

---

### Cell 1.5 — Verify Foundation
**What:** End-to-end check of the entire foundation.

**Inputs:** Cells 1.1–1.4 complete

**Outputs:** Nothing new. This is a verification cell.

**Verify checklist:**
- [x] `pnpm build` → zero errors
- [x] `pnpm typecheck` → zero errors
- [x] Local Supabase running and responding
- [x] All 15 tables present with seed data
- [x] RLS: catalog publicly readable, orders/contracts scoped, suppliers admin-only
- [x] Realtime enabled on `orders`, `sla_events`, `shipments`
- [x] `@repo/shared` types and constants importable

**Status:** `[x]`

---

## Phase 2 — Pricing Engine (`packages/engine-pricing`)
*A fully-tested, pure TypeScript pricing package. No database calls, no side effects. Inputs in, numbers out.*

---

### Cell 2.1 — Scaffold `engine-pricing` Package
**What:** Create the `packages/engine-pricing` package following the monorepo package pattern.

**Inputs:** Phase 1 complete

**Outputs:**
- `packages/engine-pricing/package.json` — name `@repo/engine-pricing`, `"type": "module"`, scripts for build/typecheck/test, dep on `@repo/shared`
- `packages/engine-pricing/tsconfig.json` — extends `../../tsconfig.base.json`
- `packages/engine-pricing/src/index.ts` — empty barrel export
- `pnpm install` re-runs and links the new package

**Verify:** `pnpm --filter @repo/engine-pricing typecheck` exits 0.

**Status:** `[x]`

---

### Cell 2.2 — Discount Functions
**What:** Implement `getBaseDiscount`, `getVolumeBreak`, and `calculateTotalDiscount`.

**Inputs:** Cell 2.1 complete

**Outputs:**
- `packages/engine-pricing/src/discount.ts`:
  - `getBaseDiscount(tier)` — returns tier's base discount % from `CONTRACT_TIER_DISCOUNTS`
  - `getVolumeBreak(quantity, contractTiers?)` — finds highest qualifying volume break, falls back to `VOLUME_BREAKS` constants
  - `calculateTotalDiscount(tier, quantity, contractTiers?)` — sums both, caps at 100%

**Verify:** `pnpm --filter @repo/engine-pricing typecheck` exits 0. Manual: `getBaseDiscount("gold")` → 15. `getVolumeBreak(50)` → 5. `calculateTotalDiscount("gold", 100)` → 23.

**Status:** `[x]`

---

### Cell 2.3 — Line Price Calculation
**What:** Implement `calculateLinePrice` — applies a discount to one order line, rounds before multiplying.

**Inputs:** Cell 2.2 complete

**Outputs:**
- `packages/engine-pricing/src/line-price.ts`:
  - `calculateLinePrice(basePriceCents, quantity, discountPercent)` → `{ unitPriceCents, lineTotalCents, discountPercent, savingsCents }`
  - Rounds `unitPriceCents = Math.round(basePriceCents × (1 − discount/100))` before multiplying by quantity

**Verify:** `calculateLinePrice(45000, 1, 15)` → `unitPriceCents: 38250`, `lineTotalCents: 38250`, `savingsCents: 6750`. `calculateLinePrice(3500, 1, 8)` → `unitPriceCents: 3220` (correct rounding).

**Status:** `[x]`

---

### Cell 2.4 — Order Total Calculation
**What:** Implement `calculateOrderTotal` — aggregates line totals, adds shipping and tax.

**Inputs:** Cell 2.3 complete

**Outputs:**
- `packages/engine-pricing/src/order-total.ts`:
  - `calculateOrderTotal({ lines, shippingCents, taxCents })` → `{ subtotalCents, discountCents, shippingCents, taxCents, totalCents }`
  - Pure aggregation — does not compute discounts, just sums

**Verify:** Two lines (38250 + 373500), shipping 8000, tax 32940 → subtotal 411750, total 452690.

**Status:** `[x]`

---

### Cell 2.5 — Barrel Export
**What:** Wire `index.ts` to re-export all public functions and types.

**Inputs:** Cell 2.4 complete

**Outputs:**
- `packages/engine-pricing/src/index.ts` exports: `getBaseDiscount`, `getVolumeBreak`, `calculateTotalDiscount`, `calculateLinePrice`, `LinePriceResult`, `calculateOrderTotal`, `OrderTotalInput`, `OrderTotalResult`

**Verify:** `import { calculateLinePrice } from "@repo/engine-pricing"` resolves correctly from another package. `pnpm --filter @repo/engine-pricing typecheck` exits 0.

**Status:** `[x]`

---

### Cell 2.6 — Pricing Engine Tests
**What:** Write unit tests for all three modules using Vitest. Test normal cases, edge cases, and boundary values.

**Inputs:** Cell 2.5 complete

**Outputs:**
- `__tests__/discount.test.ts` — tier lookups, volume break thresholds, custom tiers, stacking
- `__tests__/line-price.test.ts` — zero discount, 15% discount, quantity multiplier, rounding correctness
- `__tests__/order-total.test.ts` — multi-line aggregation, empty lines, shipping+tax

**Verify:** `pnpm --filter @repo/engine-pricing test` — all tests pass, zero failures.

**Status:** `[x]`

---

### Cell 2.7 — Verify Pricing Engine
**What:** End-to-end check of the complete pricing package.

**Inputs:** Cells 2.1–2.6 complete

**Outputs:** Nothing new.

**Verify checklist:**
- [x] `pnpm --filter @repo/engine-pricing test` → all pass
- [x] `pnpm --filter @repo/engine-pricing build` → compiles to `dist/`
- [x] `pnpm --filter @repo/engine-pricing typecheck` → zero errors
- [x] All monetary arithmetic uses integer cents (no floats)
- [x] Volume breaks and tier discounts stack correctly
- [x] `calculateTotalDiscount` caps at 100%

**Status:** `[x]`

---

## Phase 3 — SLA Engine (`packages/engine-sla`)
*A fully-tested SLA package: deadline calculation, threshold evaluation, and state machine guards. Pure functions — no DB calls.*

---

### Cell 3.1 — Scaffold `engine-sla` Package
**What:** Create `packages/engine-sla` following the monorepo package pattern.

**Inputs:** Phase 2 complete

**Outputs:**
- `packages/engine-sla/package.json` — name `@repo/engine-sla`, dep on `@repo/shared`, devDep on `vitest`
- `packages/engine-sla/tsconfig.json` — extends `../../tsconfig.base.json`
- `packages/engine-sla/src/index.ts` — empty barrel export

**Verify:** `pnpm --filter @repo/engine-sla typecheck` exits 0.

**Status:** `[x]`

---

### Cell 3.2 — Deadline Calculation
**What:** Implement `calculateDeadline` and `getTimeRemaining`.

**Inputs:** Cell 3.1 complete

**Outputs:**
- `packages/engine-sla/src/deadline.ts`:
  - `calculateDeadline(slaTier, placedAt: Date)` → `Date` — adds fulfillment window from `SLA_POLICIES`
  - `getTimeRemaining(deadline, now)` → `{ remainingMinutes, isOverdue }` — works in UTC, uses integer minutes

**Verify:** `calculateDeadline("emergency", new Date("2026-03-20T10:00:00Z"))` → `2026-03-20T14:00:00Z`. `calculateDeadline("economy", same)` → `2026-03-23T10:00:00Z`.

**Status:** `[x]`

---

### Cell 3.3 — SLA Status Evaluation
**What:** Implement `evaluateSlaStatus` and `getEscalationLevel`.

**Inputs:** Cell 3.2 complete

**Outputs:**
- `packages/engine-sla/src/evaluate.ts`:
  - `evaluateSlaStatus(slaTier, deadline, now)` → `SlaStatus` — compares remaining minutes against `breachThresholdMinutes` and `warningThresholdMinutes` from `SLA_POLICIES`
  - `getEscalationLevel(slaStatus)` → `EscalationLevel` (none/warning/breach/critical)
  - Does not return `'fulfilled'` — that is set explicitly elsewhere

**Verify:** Emergency tier at exactly 110min remaining → `'breach'`. Standard at 360min → `'warning'`. Economy at 0min → `'breached'`. Note: emergency skips `'warning'` because breach threshold (110) > warning threshold (90).

**Status:** `[x]`

---

### Cell 3.4 — State Machine Transition Guards
**What:** Implement `canTransitionOrder`, `canTransitionSla`, and helper functions using the transition maps from `@repo/shared`.

**Inputs:** Cell 3.3 complete

**Outputs:**
- `packages/engine-sla/src/transitions.ts`:
  - `canTransitionOrder(current, target)` → `boolean`
  - `canTransitionSla(current, target)` → `boolean`
  - `getNextOrderStatuses(current)` → `OrderStatus[]`
  - `getNextSlaStatuses(current)` → `SlaStatus[]`

**Verify:** `canTransitionOrder("shipped", "cancelled")` → `false`. `canTransitionOrder("packed", "cancelled")` → `true`. `canTransitionOrder("fulfilled", "cancelled")` → `false`. `getNextOrderStatuses("pending")` → `["confirmed", "cancelled"]`.

**Status:** `[x]`

---

### Cell 3.5 — Barrel Export
**What:** Wire `index.ts` to re-export all public functions.

**Inputs:** Cell 3.4 complete

**Outputs:**
- `packages/engine-sla/src/index.ts` exports: `calculateDeadline`, `getTimeRemaining`, `evaluateSlaStatus`, `getEscalationLevel`, `canTransitionOrder`, `canTransitionSla`, `getNextOrderStatuses`, `getNextSlaStatuses`

**Verify:** `pnpm --filter @repo/engine-sla typecheck` exits 0.

**Status:** `[x]`

---

### Cell 3.6 — SLA Engine Tests
**What:** Write unit tests with boundary testing at exact threshold values. Off-by-one errors here have real operational consequences.

**Inputs:** Cell 3.5 complete

**Outputs:**
- `__tests__/deadline.test.ts` — all three tiers, positive and negative remaining time
- `__tests__/evaluate.test.ts` — exactly at warning threshold, exactly at breach threshold, 1min before/after each boundary, all three tiers, all five status values
- `__tests__/transitions.test.ts` — every valid and invalid transition for both order and SLA state machines

**Verify:** `pnpm --filter @repo/engine-sla test` — all tests pass.

**Status:** `[x]`

---

### Cell 3.7 — Verify SLA Engine
**What:** End-to-end check.

**Inputs:** Cells 3.1–3.6 complete

**Outputs:** Nothing new.

**Verify checklist:**
- [x] All tests pass
- [x] `pnpm --filter @repo/engine-sla build` compiles to `dist/`
- [x] Emergency tier correctly skips `warning` state (breach threshold > warning threshold)
- [x] `canTransitionOrder("shipped", "cancelled")` → false
- [x] `evaluateSlaStatus` never returns `fulfilled` (only set explicitly)
- [x] All time math uses UTC — no timezone-dependent behavior

**Status:** `[x]`

---

## Phase 4 — Parts Graph Engine (`packages/engine-parts-graph`)
*The compatibility engine: given a model, return compatible parts grouped by fit type, sorted by stock and price. Given a part, return which models it fits.*

---

### Cell 4.1 — Scaffold `engine-parts-graph` Package
**What:** Create `packages/engine-parts-graph` following the monorepo package pattern.

**Inputs:** Phase 3 complete

**Outputs:**
- `packages/engine-parts-graph/package.json` — name `@repo/engine-parts-graph`, dep on `@repo/shared`
- `packages/engine-parts-graph/tsconfig.json`
- `packages/engine-parts-graph/src/index.ts` — empty barrel

**Verify:** `pnpm --filter @repo/engine-parts-graph typecheck` exits 0.

**Status:** `[x]`

---

### Cell 4.2 — Compatible Parts Lookup
**What:** Implement `findCompatibleParts` — find all parts for a model, grouped and sorted.

**Inputs:** Cell 4.1 complete

**Outputs:**
- `packages/engine-parts-graph/src/compatible-parts.ts`:
  - Types: `CompatiblePart { part, fitType, notes }`, `GroupedCompatibleParts { exact[], equivalent[], aftermarket[] }`
  - `findCompatibleParts(modelId, compatibilityRows, partsMap)` → `GroupedCompatibleParts`
  - Within each group: in-stock parts first, then sorted by `basePriceCents` ascending

**Verify:** Given 3 exact + 1 aftermarket edges for model `b...0001`: returns 3 exact (in-stock first, then by price), 0 equivalent, 1 aftermarket. Unknown model → all groups empty.

**Status:** `[x]`

---

### Cell 4.3 — Compatible Models Reverse Lookup
**What:** Implement `findCompatibleModels` — given a part, which models does it fit?

**Inputs:** Cell 4.2 complete

**Outputs:**
- `packages/engine-parts-graph/src/compatible-models.ts`:
  - Types: `CompatibleModel { model, fitType, notes }`, `GroupedCompatibleModels`
  - `findCompatibleModels(partId, compatibilityRows, modelsMap)` → `GroupedCompatibleModels`

**Verify:** The ST800 diaphragm (`c...0001`) appears as `exact` for model `b...0001` (ST800) and `equivalent` for model `b...0002` (Rosemount 3051). Unknown part → all groups empty.

**Status:** `[x]`

---

### Cell 4.4 — Flat Ranking
**What:** Implement `rankParts` — produce a single sorted list across all fit types.

**Inputs:** Cell 4.3 complete

**Outputs:**
- `packages/engine-parts-graph/src/rank.ts`:
  - `rankParts(parts: CompatiblePart[])` → `CompatiblePart[]`
  - Sort priority: fit type (exact=0, equivalent=1, aftermarket=2) → in-stock first → cheaper first

**Verify:** Mixed list of [aftermarket in-stock cheap, exact out-of-stock cheap, exact in-stock expensive] → exact in-stock expensive first, exact out-of-stock cheap second, aftermarket in-stock cheap last.

**Status:** `[x]`

---

### Cell 4.5 — Filter Helpers
**What:** Implement filter utility functions for sensor type, manufacturer, stock, and fit type.

**Inputs:** Cell 4.4 complete

**Outputs:**
- `packages/engine-parts-graph/src/filters.ts`:
  - `filterBySensorType(parts, sensorType)`
  - `filterByManufacturer(parts, manufacturer)`
  - `filterInStock(parts)` — returns only parts with `stockQuantity > 0`
  - `filterByFitType(compatibleParts, fitType)`

**Verify:** `filterInStock` on seed parts removes out-of-stock items. `filterBySensorType(parts, "pressure")` returns only pressure parts.

**Status:** `[x]`

---

### Cell 4.6 — Barrel Export and Tests
**What:** Wire `index.ts` and write tests with fixture data matching the seed structure.

**Inputs:** Cell 4.5 complete

**Outputs:**
- `packages/engine-parts-graph/src/index.ts` — exports all public functions and types
- `__tests__/fixtures.ts` — test data: 3 models, 6 parts, 8 compatibility edges; `partsMap` and `modelsMap` as `Map` instances
- `__tests__/compatible-parts.test.ts` — grouping, sorting by stock/price, unknown model, cross-model edge
- `__tests__/rank.test.ts` — ranking priority, tie-breaking
- `__tests__/filters.test.ts` — each filter function

**Verify:** `pnpm --filter @repo/engine-parts-graph test` — all tests pass.

**Status:** `[x]`

---

### Cell 4.7 — Verify Parts Graph Engine
**What:** End-to-end check.

**Inputs:** Cells 4.1–4.6 complete

**Outputs:** Nothing new.

**Verify checklist:**
- [x] All tests pass
- [x] `pnpm --filter @repo/engine-parts-graph build` compiles to `dist/`
- [x] ST800 diaphragm appears in both `exact` (for ST800) and `equivalent` (for 3051) groups
- [x] In-stock parts always sort before out-of-stock within the same fit type
- [x] `rankParts` produces a single list with exact first
- [x] All functions are pure — no DB calls, no side effects

**Status:** `[x]`

---

## Phase 5 — Integration Adapters
*Thin TypeScript wrappers around external services. No business logic — each adapter translates between the external API and the domain types from `@repo/shared`.*

> **Adapter build order:** Supabase → ERPNext → Typesense → Shippo → Resend → Stripe → PostHog. Each adapter can be built independently once Cell 5.1 is complete.

> **Boxwise WMS:** Deferred. The bin-location and fast-pick-zone workflow requires warehouse order-flow context that does not exist until Phase 7. It will be added as a dedicated cell when Phase 7 is broken down.

---

### Cell 5.1 — Environment Variables
**What:** Populate `.env` with all required values for local development. Verify `supabase/config.toml` credentials match.

**Inputs:** Phase 4 complete. All external service accounts created (Stripe, Shippo, Resend, PostHog test instances; ERPNext dev instance; Typesense dev instance).

**Outputs:**
- `.env` populated with real values for all keys listed in `.env.example`
- Local Supabase keys copied from `supabase start` output into `.env`

**Verify:** All vars in `.env` have non-empty values. `supabase start` keys match `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

**Status:** `[x]`

---

### Cell 5.2 — Supabase Client Adapter
**What:** Create `integrations/supabase/` with typed browser and server client instances.

**Inputs:** Cell 5.1 complete, `@supabase/supabase-js` installed

**Outputs:**
- `integrations/supabase/package.json` — name `@repo/supabase-client`
- `integrations/supabase/src/browser.ts` — `createBrowserClient()` using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `integrations/supabase/src/server.ts` — `createServerClient()` using `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- `integrations/supabase/src/index.ts` — barrel export

**Verify:** `createBrowserClient().from('parts').select('sku').limit(1)` returns a row. `createServerClient().from('suppliers').select('name').limit(1)` returns a row (service role bypasses RLS). `createBrowserClient().from('suppliers').select('name').limit(1)` returns empty (RLS blocks buyer).

**Status:** `[x]`

---

### Cell 5.3 — ERPNext Adapter (mock-first)
**What:** Create `integrations/erpnext/` — fetch stock quantities and lead times for parts. Built mock-first so local development and tests require no external credentials. A live ERPNext HTTP transport is included as an optional second implementation behind the same interface.

**Stack note:** ERPNext is open-source (free). For local dev, a fixture-backed mock transport is the default. A real ERPNext instance (self-hosted or Frappe Cloud) is only needed for live verification, which is deferred.

**Inputs:** Cell 5.2 complete

**Outputs:**
- `integrations/erpnext/src/errors.ts` — typed error classes: `ERPNextConfigError`, `ERPNextAuthError`, `ERPNextTransportError`, `ERPNextParseError`
- `integrations/erpnext/src/inventory.ts` — `fetchStockLevels(skus: string[])` → `StockLevel[]`; `InventoryTransport` interface; `mockTransport` fixture implementation seeded from seed.sql data; `setTransport()` for test overriding
- `integrations/erpnext/src/client.ts` — `createERPNextClient(config?)` — live ERPNext HTTP transport implementing `InventoryTransport`; validates `ERPNEXT_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`; queries the `Bin` DocType
- `integrations/erpnext/src/index.ts` — barrel export
- `integrations/erpnext/src/__tests__/inventory.test.ts` — unit tests against mock transport
- `integrations/erpnext/src/__tests__/client.test.ts` — config validation tests (no live HTTP)
- `integrations/erpnext/src/scripts/smoke.ts` — local smoke check using mock transport (no credentials needed)

**Verify (local, no credentials):** `fetchStockLevels(["HW-ST800-DIAP"])` returns `{ sku, stockQuantity, leadTimeDays }`. `fetchStockLevels([])` returns `[]`. Unknown SKU is omitted. `createERPNextClient({})` throws `ERPNextConfigError`. All pass via `pnpm --filter @repo/erpnext-client test`.

**Verify (live, deferred):** When real credentials are available, `setTransport(createERPNextClient())` then `fetchStockLevels(["HW-ST800-DIAP"])` returns live ERPNext data.

**Status:** `[x]`

---

### Cell 5.4 — Typesense Adapter
**What:** Create `integrations/typesense/` — index parts and models, expose a search function.

**Inputs:** Cell 5.2 complete, `typesense` npm package installed

**Outputs:**
- `integrations/typesense/src/client.ts` — Typesense client using `TYPESENSE_HOST` + `TYPESENSE_API_KEY`
- `integrations/typesense/src/schema.ts` — collection schema definitions for `parts` and `models`
- `integrations/typesense/src/index-parts.ts` — `indexParts(parts: Part[])` — upserts all parts into Typesense
- `integrations/typesense/src/search.ts` — `searchParts(query, filters?)` → `Part[]`
- `integrations/typesense/src/index.ts` — barrel export

**Verify:** Call `indexParts` with seed data. `searchParts("ST800")` returns the ST800 diaphragm and seal kit. `searchParts("pressure transmitter")` returns pressure-type parts.

**Status:** `[ ]`

---

### Cell 5.5 — Shippo Adapter
**What:** Create `integrations/shippo/` — get shipping rates and create labels.

**Inputs:** Cell 5.2 complete, `shippo` npm package installed

**Outputs:**
- `integrations/shippo/src/client.ts` — Shippo client using `SHIPPO_API_KEY`
- `integrations/shippo/src/rates.ts` — `getShippingRates(from, to, parcel)` → `{ method: ShippingMethod, rateCents: number, estimatedDays: number }[]`
- `integrations/shippo/src/labels.ts` — `createLabel(rateId)` → `{ trackingNumber, labelUrl }`
- `integrations/shippo/src/index.ts` — barrel export

**Verify:** `getShippingRates` with Houston TX → Beaumont TX returns at least UPS ground and overnight rates. `createLabel` with a test rate ID returns a label URL.

**Status:** `[ ]`

---

### Cell 5.6 — Resend Adapter
**What:** Create `integrations/resend/` — send SLA alert and order confirmation emails.

**Inputs:** Cell 5.2 complete, `resend` npm package installed

**Outputs:**
- `integrations/resend/src/client.ts` — Resend client using `RESEND_API_KEY`
- `integrations/resend/src/templates.ts` — `slaAlertEmail(order, slaStatus)` and `orderConfirmationEmail(order)` → email payload objects
- `integrations/resend/src/send.ts` — `sendEmail(to, template)` → `{ id }` or throws
- `integrations/resend/src/index.ts` — barrel export

**Verify:** `sendEmail` with a test address sends the SLA alert email. Response includes a Resend message ID.

**Status:** `[ ]`

---

### Cell 5.7 — PostHog Adapter
**What:** Create `integrations/posthog/` — event tracking wrapper.

**Inputs:** Cell 5.2 complete, `posthog-js` installed (browser) and `posthog-node` installed (server)

**Outputs:**
- `integrations/posthog/src/client.ts` — PostHog browser and server clients using `POSTHOG_API_KEY`
- `integrations/posthog/src/events.ts` — typed event constants: `PART_VIEWED`, `CART_UPDATED`, `ORDER_PLACED`, `SLA_BREACHED`
- `integrations/posthog/src/track.ts` — `trackEvent(event, properties)` wrapper
- `integrations/posthog/src/index.ts` — barrel export

**Verify:** `trackEvent("ORDER_PLACED", { orderId, companyId, totalCents })` sends to PostHog without error. Event appears in PostHog dashboard.

**Status:** `[ ]`

---

### Cell 5.8 — Stripe Adapter
**What:** Create `integrations/stripe/` — webhook signature validation and typed payment helpers.

**Inputs:** Cell 5.2 complete, `stripe` npm package installed

**Outputs:**
- `integrations/stripe/package.json` — name `@repo/stripe-client`
- `integrations/stripe/src/client.ts` — Stripe SDK instance using `STRIPE_SECRET_KEY`
- `integrations/stripe/src/webhook.ts` — `constructWebhookEvent(payload, signature, secret)` → `Stripe.Event` — validates the signature and returns a typed event; throws on invalid signature
- `integrations/stripe/src/index.ts` — barrel export

**Verify:** `constructWebhookEvent` with a valid test payload and matching secret returns a typed `Stripe.Event`. An invalid signature throws a typed `WebhookValidationError`. `STRIPE_SECRET_KEY` is never exported or logged.

**Status:** `[ ]`

---

### Cell 5.9 — Verify Integration Adapters
**What:** End-to-end check of all adapters.

**Inputs:** Cells 5.1–5.8 complete

**Outputs:** Nothing new.

**Verify checklist:**
- [ ] Supabase browser client reads parts (anon key)
- [ ] Supabase server client reads suppliers (service role bypasses RLS)
- [ ] ERPNext returns stock levels for at least one SKU
- [ ] Typesense search returns relevant parts
- [ ] Shippo rates returned for a TX → TX shipment
- [ ] Resend sends an email to a test address
- [ ] Stripe webhook signature validates correctly; invalid signature throws
- [ ] PostHog event visible in dashboard
- [ ] No API keys or secrets appear in any source file

**Status:** `[ ]`

---

## Phase 6 — Supabase Edge Functions
*Three server-side functions that run in the Supabase runtime: inventory sync (nightly), order webhook (Stripe events), and SLA check (60s cron).*

---

### Cell 6.1 — `inventory-sync` Edge Function
**What:** Pull stock quantities and lead times from ERPNext and update the `parts` table.

**Inputs:** Phase 5 complete, `supabase/functions/` directory exists

**Outputs:**
- `supabase/functions/inventory-sync/index.ts`:
  - Authenticated with Supabase service role
  - Fetches all part SKUs from `parts` table
  - Calls `fetchStockLevels()` from `@repo/erpnext` adapter
  - Updates `parts.stock_quantity` and `parts.lead_time_days` for each SKU
  - Returns `{ updated: N, errors: [] }`

**Verify:** `supabase functions serve inventory-sync --env-file .env` then `curl -X POST http://localhost:54321/functions/v1/inventory-sync` — returns JSON with `updated` count. Parts table shows refreshed stock quantities.

**Status:** `[ ]`

---

### Cell 6.2 — `order-webhook` Edge Function
**What:** Handle Stripe payment events. On `payment_intent.succeeded`, advance order status from `pending` to `confirmed` and stamp the SLA deadline.

**Inputs:** Cell 6.1 complete

**Outputs:**
- `supabase/functions/order-webhook/index.ts`:
  - Validates Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`
  - On `payment_intent.succeeded`: finds order by `payment_ref`, sets `status = 'confirmed'`, sets `sla_deadline = now() + window`, inserts `sla_events` row
  - Uses `canTransitionOrder('pending', 'confirmed')` guard before any update
  - Returns 200 on success, 400 on invalid signature, 422 on state machine violation

**Verify:** `supabase functions serve order-webhook` then send a test Stripe webhook event with `stripe trigger payment_intent.succeeded`. Order row in DB shows `status = 'confirmed'` and a valid `sla_deadline`. `sla_events` has one row for that order.

**Status:** `[ ]`

---

### Cell 6.3 — `sla-check` Edge Function
**What:** Cron function (every 60s) that evaluates all active orders' SLA status and fires alerts when thresholds are crossed.

**Inputs:** Cell 6.2 complete

**Outputs:**
- `supabase/functions/sla-check/index.ts`:
  - Fetches all orders where `sla_status NOT IN ('fulfilled', 'breached')`
  - For each: calls `evaluateSlaStatus(slaTier, slaDeadline, now)` from `@repo/engine-sla`
  - If new status differs from current: calls `canTransitionSla(current, new)` guard, updates `orders.sla_status`, inserts `sla_events` row
  - If new status is `warning` or `breach` or `breached`: calls Resend adapter to send alert email
  - Returns `{ evaluated: N, transitioned: N, alerted: N }`

**Verify:** Manually insert an order with `sla_deadline` 1 minute in the past and `sla_status = 'on_track'`. Invoke the function. Order `sla_status` → `'breached'`. `sla_events` has a new row. Alert email sent to ops contact.

**Status:** `[ ]`

---

### Cell 6.4 — Verify Edge Functions
**What:** End-to-end check of all three functions.

**Inputs:** Cells 6.1–6.3 complete

**Outputs:** Nothing new.

**Verify checklist:**
- [ ] `inventory-sync` updates `stock_quantity` and `lead_time_days` from ERPNext
- [ ] `order-webhook` rejects invalid Stripe signatures (returns 400)
- [ ] `order-webhook` advances order status and stamps SLA deadline
- [ ] `order-webhook` inserts a `sla_events` row on confirmation
- [ ] `sla-check` transitions order SLA status correctly
- [ ] `sla-check` sends alert emails at warning/breach/breached thresholds
- [ ] State machine guards prevent invalid transitions in all functions

**Status:** `[ ]`

---

## Phase 7 — Medusa OMS + Next.js Storefront
*Two apps built in parallel once the integration layer exists. `apps/medusa` is the headless order management backend; `apps/web` is the buyer-facing Next.js storefront. Detailed cells for each will be broken down further when this phase begins.*

---

### Cell 7.0 — Scaffold `apps/medusa`
**What:** Create the Medusa.js headless OMS backend app.

**Inputs:** Phase 6 complete

**Outputs:**
- `apps/medusa/` — Medusa.js project, TypeScript, connected to local Postgres
- `apps/medusa/medusa-config.ts` — Supabase DB URL, Stripe plugin, Shippo plugin
- `apps/medusa/package.json` — workspace app, deps on `@repo/shared`, `@repo/engine-pricing`
- Admin panel accessible at `http://localhost:9000/app`

**Verify:** `pnpm --filter @repo/medusa dev` → Medusa API responds at `http://localhost:9000/health`. Admin panel loads. Products endpoint returns an empty catalog.

**Status:** `[ ]`

---

### Cell 7.1 — Scaffold `apps/web`
**What:** Create the Next.js 14 App Router project with Tailwind CSS and shadcn/ui.

**Inputs:** Phase 6 complete

**Outputs:**
- `apps/web/` — Next.js 14 app with App Router, TypeScript strict, Tailwind CSS
- `apps/web/package.json` — deps on `@repo/shared`, `@repo/supabase-client`, `@repo/engine-pricing`, `@repo/engine-parts-graph`
- `apps/web/app/layout.tsx` — root layout shell
- `apps/web/app/page.tsx` — placeholder home

**Verify:** `pnpm --filter @repo/web dev` → app loads at `http://localhost:3000`. `pnpm --filter @repo/web build` → zero errors.

**Status:** `[ ]`

---

### Cell 7.2 — Model Catalog Page
**What:** Build `/models` — browsable, searchable list of sensor models.

**Inputs:** Cell 7.1 complete, Typesense adapter wired

**Outputs:**
- `apps/web/app/models/page.tsx` — server component fetching models from Supabase
- Search input → queries Typesense via `searchParts`
- Filter by `sensor_type` (pressure, temperature, flow, level, vibration, humidity, gas, proximity)
- Model cards: name, manufacturer, sensor type badge

**Verify:** Page loads with 5 seed models. Searching "ST800" returns the ST800 model. Filtering by "pressure" returns only pressure sensor models.

**Status:** `[ ]`

---

### Cell 7.3 — Model Detail & Compatibility Page
**What:** Build `/models/[id]` — shows a model's compatible parts grouped by fit type.

**Inputs:** Cell 7.2 complete

**Outputs:**
- `apps/web/app/models/[id]/page.tsx` — server component
- Calls `findCompatibleParts` from `@repo/engine-parts-graph` with data from Supabase
- Three sections: Exact (OEM), Equivalent, Aftermarket
- Each part card: SKU, name, stock badge (in stock / X days lead time), price (contract-tier price for authenticated buyers, list price for anon)
- Add to cart button (non-functional in this cell)

**Verify:** `/models/b...0001` (ST800) shows 4 exact parts and 1 aftermarket part. In-stock parts appear before out-of-stock. Price shows contract discount for authenticated gold-tier buyer.

**Status:** `[ ]`

---

### Cell 7.4 — Cart & Checkout
**What:** Build the cart and checkout flow via Medusa.js.

**Inputs:** Cell 7.3 complete, `apps/medusa` running

**Outputs:**
- Cart state managed via Medusa cart API
- Checkout page: address, SLA tier selection (emergency/standard/economy), shipping method (Shippo rates), payment (Stripe)
- Order created in Medusa → synced to Supabase `orders` table

**Verify:** Add ST800 diaphragm to cart → proceed to checkout → select standard SLA → select UPS ground → pay with test card → order appears in Supabase `orders` table with `status = 'pending'`.

**Status:** `[ ]`

---

### Cell 7.5 — Order Tracking Page
**What:** Build `/orders/[id]` — real-time SLA and fulfillment tracker.

**Inputs:** Cell 7.4 complete

**Outputs:**
- `apps/web/app/orders/[id]/page.tsx`
- SLA countdown timer (minutes remaining, color: green/amber/red by status)
- Order status timeline (pending → confirmed → picking → packed → shipped → delivered → fulfilled)
- Per-line status table (partial fulfillment visibility)
- Shipment tracking link (when available)
- Supabase Realtime subscription: order status, sla_events, shipments

**Verify:** Place an order. View `/orders/[id]`. Manually advance order status in Studio — page updates without refresh. SLA color changes at warning/breach thresholds.

**Status:** `[ ]`

---

### Cell 7.6 — Verify Storefront
**What:** End-to-end check of the complete storefront.

**Inputs:** Cells 7.1–7.5 complete

**Outputs:** Nothing new.

**Verify checklist:**
- [ ] Catalog lists all models, searchable by name
- [ ] Model detail shows compatible parts grouped by fit type
- [ ] Contract-tier prices shown to authenticated buyers
- [ ] Checkout flow creates an order end-to-end
- [ ] Order tracking page shows live status updates via Realtime
- [ ] `pnpm --filter @repo/web build` → zero errors
- [ ] No TypeScript errors

**Status:** `[ ]`

---

## Cell Index (Quick Reference)

| Cell | Name | Phase | Status |
|------|------|-------|--------|
| 1.1 | pnpm Workspace Wiring | Foundation | `[x]` |
| 1.2 | Turborepo Task Orchestration | Foundation | `[x]` |
| 1.3 | Local Supabase Stack | Foundation | `[x]` |
| 1.4 | Domain Model Comprehension | Foundation | `[x]` |
| 1.5 | Verify Foundation | Foundation | `[x]` |
| 2.1 | Scaffold engine-pricing | Pricing Engine | `[x]` |
| 2.2 | Discount Functions | Pricing Engine | `[x]` |
| 2.3 | Line Price Calculation | Pricing Engine | `[x]` |
| 2.4 | Order Total Calculation | Pricing Engine | `[x]` |
| 2.5 | Barrel Export | Pricing Engine | `[x]` |
| 2.6 | Pricing Engine Tests | Pricing Engine | `[x]` |
| 2.7 | Verify Pricing Engine | Pricing Engine | `[x]` |
| 3.1 | Scaffold engine-sla | SLA Engine | `[x]` |
| 3.2 | Deadline Calculation | SLA Engine | `[x]` |
| 3.3 | SLA Status Evaluation | SLA Engine | `[x]` |
| 3.4 | State Machine Transition Guards | SLA Engine | `[x]` |
| 3.5 | Barrel Export | SLA Engine | `[x]` |
| 3.6 | SLA Engine Tests | SLA Engine | `[x]` |
| 3.7 | Verify SLA Engine | SLA Engine | `[x]` |
| 4.1 | Scaffold engine-parts-graph | Parts Graph | `[x]` |
| 4.2 | Compatible Parts Lookup | Parts Graph | `[x]` |
| 4.3 | Compatible Models Reverse Lookup | Parts Graph | `[x]` |
| 4.4 | Flat Ranking | Parts Graph | `[x]` |
| 4.5 | Filter Helpers | Parts Graph | `[x]` |
| 4.6 | Barrel Export and Tests | Parts Graph | `[x]` |
| 4.7 | Verify Parts Graph Engine | Parts Graph | `[x]` |
| 5.1 | Environment Variables | Integrations | `[x]` |
| 5.2 | Supabase Client Adapter | Integrations | `[x]` |
| 5.3 | ERPNext Adapter | Integrations | `[x]` |
| 5.4 | Typesense Adapter | Integrations | `[ ]` |
| 5.5 | Shippo Adapter | Integrations | `[ ]` |
| 5.6 | Resend Adapter | Integrations | `[ ]` |
| 5.7 | PostHog Adapter | Integrations | `[ ]` |
| 5.8 | Stripe Adapter | Integrations | `[ ]` |
| 5.9 | Verify Integration Adapters | Integrations | `[ ]` |
| 6.1 | inventory-sync Edge Function | Edge Functions | `[ ]` |
| 6.2 | order-webhook Edge Function | Edge Functions | `[ ]` |
| 6.3 | sla-check Edge Function | Edge Functions | `[ ]` |
| 6.4 | Verify Edge Functions | Edge Functions | `[ ]` |
| 7.0 | Scaffold apps/medusa | Medusa OMS | `[ ]` |
| 7.1 | Scaffold apps/web | Storefront | `[ ]` |
| 7.2 | Model Catalog Page | Storefront | `[ ]` |
| 7.3 | Model Detail & Compatibility Page | Storefront | `[ ]` |
| 7.4 | Cart & Checkout | Storefront | `[ ]` |
| 7.5 | Order Tracking Page | Storefront | `[ ]` |
| 7.6 | Verify Storefront | Storefront | `[ ]` |

**Total: 47 cells across 7 phases**
