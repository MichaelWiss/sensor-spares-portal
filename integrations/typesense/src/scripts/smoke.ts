/**
 * Smoke test for the Typesense adapter.
 *
 * Requires a running Typesense server:
 *   docker run -d -p 8108:8108 \
 *     -v /tmp/typesense-data:/data \
 *     typesense/typesense:27.1 \
 *     --data-dir /data --api-key=xyz --enable-cors
 *
 * Then add to .env:
 *   TYPESENSE_HOST=localhost
 *   TYPESENSE_PORT=8108
 *   TYPESENSE_PROTOCOL=http
 *   TYPESENSE_API_KEY=xyz
 *
 * Run from repo root:
 *   pnpm --filter @repo/typesense-client smoke
 *
 * Verifies the three claims from BUILD_PLAN Cell 5.4:
 *   1. indexParts with seed data succeeds without errors
 *   2. searchParts("ST800") returns the ST800 diaphragm and seal kit
 *   3. searchParts("pressure transmitter") returns pressure-type parts
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Part } from "@repo/shared";

const here = fileURLToPath(import.meta.url);
config({ path: resolve(here, "../../../../../.env") });

const { createTypesenseClient } = await import("../client.js");
const { indexParts, resetPartsCollection } = await import("../index-parts.js");
const { searchParts } = await import("../search.js");

// Seed parts mirror supabase/seed.sql (pressure + temperature subset)
const SEED_PARTS: Part[] = [
  { id: "c0000000-0000-0000-0000-000000000001", sku: "HW-ST800-DIAP", name: "ST800 Diaphragm Assembly",     manufacturer: "Honeywell",       sensorType: "pressure",    description: null, imageUrl: null, datasheetUrl: null, basePriceCents: 45000, stockQuantity: 24,  leadTimeDays: 5,  safetyStock: 10, uom: "each", weightGrams: 340, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c0000000-0000-0000-0000-000000000002", sku: "HW-ST800-SEAL", name: "ST800 Process Seal Kit",        manufacturer: "Honeywell",       sensorType: "pressure",    description: null, imageUrl: null, datasheetUrl: null, basePriceCents: 12500, stockQuantity: 80,  leadTimeDays: 3,  safetyStock: 20, uom: "each", weightGrams: 120, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c0000000-0000-0000-0000-000000000003", sku: "HW-ST800-ELEC", name: "ST800 Electronics Module",      manufacturer: "Honeywell",       sensorType: "pressure",    description: null, imageUrl: null, datasheetUrl: null, basePriceCents: 89000, stockQuantity: 8,   leadTimeDays: 10, safetyStock: 5,  uom: "each", weightGrams: 280, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c0000000-0000-0000-0000-000000000004", sku: "HW-ST800-GSKT", name: "ST800 Gasket Set (10-pack)",    manufacturer: "Honeywell",       sensorType: "pressure",    description: null, imageUrl: null, datasheetUrl: null, basePriceCents:  3500, stockQuantity: 200, leadTimeDays: 2,  safetyStock: 50, uom: "each", weightGrams: 85,  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c0000000-0000-0000-0000-000000000005", sku: "EM-3051-DIAP",  name: "Rosemount 3051 Diaphragm",      manufacturer: "Emerson",         sensorType: "pressure",    description: null, imageUrl: null, datasheetUrl: null, basePriceCents: 52000, stockQuantity: 15,  leadTimeDays: 7,  safetyStock: 8,  uom: "each", weightGrams: 360, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c0000000-0000-0000-0000-000000000009", sku: "EH-RTD-ELEM",   name: "PT100 RTD Element",             manufacturer: "Endress+Hauser",  sensorType: "temperature", description: null, imageUrl: null, datasheetUrl: null, basePriceCents: 15000, stockQuantity: 50,  leadTimeDays: 3,  safetyStock: 20, uom: "each", weightGrams: 45,  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c0000000-0000-0000-0000-000000000010", sku: "EH-RTD-WELL",   name: "Thermowell 316SS",              manufacturer: "Endress+Hauser",  sensorType: "temperature", description: null, imageUrl: null, datasheetUrl: null, basePriceCents: 22000, stockQuantity: 30,  leadTimeDays: 5,  safetyStock: 10, uom: "each", weightGrams: 380, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
];

let failed = false;

function pass(label: string, detail: string) { console.log(`  PASS  ${label} — ${detail}`); }
function fail(label: string, detail: string) { console.error(`  FAIL  ${label} — ${detail}`); failed = true; }

async function main() {
  console.log("Typesense adapter smoke test\n");

  let client: import("typesense").Client;
  try {
    client = createTypesenseClient();
  } catch (err) {
    console.error(`Cannot create Typesense client: ${(err as Error).message}`);
    console.error("Start Typesense with Docker and set TYPESENSE_HOST + TYPESENSE_API_KEY in .env");
    process.exit(1);
  }

  // ── 1. Reset + index ───────────────────────────────────────────────────────
  try {
    await resetPartsCollection(client);
    const result = await indexParts(client, SEED_PARTS);
    if (result.failed > 0) {
      fail("indexParts", `${result.failed}/${result.total} documents failed to index`);
    } else {
      pass("indexParts", `indexed ${result.succeeded} parts, 0 failures`);
    }
  } catch (err) {
    fail("indexParts", `threw: ${(err as Error).message}`);
  }

  // ── 2. searchParts("ST800") returns ST800 parts ────────────────────────────
  try {
    const results = await searchParts(client, "ST800");
    const st800Skus = results.map((p) => p.sku).filter((s) => s.startsWith("HW-ST800"));
    if (st800Skus.length < 2) {
      fail('searchParts("ST800")', `expected ≥2 ST800 results, got ${st800Skus.length}: ${st800Skus.join(", ")}`);
    } else {
      pass('searchParts("ST800")', `returned ${results.length} results incl. ${st800Skus.join(", ")}`);
    }
  } catch (err) {
    fail('searchParts("ST800")', `threw: ${(err as Error).message}`);
  }

  // ── 3. searchParts("pressure transmitter") returns pressure parts ──────────
  try {
    const results = await searchParts(client, "pressure transmitter");
    const pressureParts = results.filter((p) => p.sensorType === "pressure");
    if (pressureParts.length === 0) {
      fail('searchParts("pressure transmitter")', "no pressure-type parts returned");
    } else {
      pass(
        'searchParts("pressure transmitter")',
        `${pressureParts.length} pressure parts (e.g. ${pressureParts[0]!.sku})`,
      );
    }
  } catch (err) {
    fail('searchParts("pressure transmitter")', `threw: ${(err as Error).message}`);
  }

  console.log();
  if (failed) { console.error("Smoke test FAILED"); process.exit(1); }
  else { console.log("All checks passed."); }
}

main().catch((err) => { console.error("Unhandled error:", err); process.exit(1); });
