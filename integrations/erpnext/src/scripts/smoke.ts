/**
 * Smoke test for the ERPNext adapter — mock-first (no credentials needed).
 *
 * Run from repo root:
 *   pnpm --filter @repo/erpnext-client smoke
 *
 * Verifies the four claims from BUILD_PLAN Cell 5.3:
 *   1. Known SKU returns stockQuantity and leadTimeDays
 *   2. Empty input returns []
 *   3. Unknown SKU is omitted from results
 *   4. createERPNextClient throws ERPNextConfigError on missing config
 */

import { fetchStockLevels, mockTransport, setTransport } from "../inventory.js";
import { createERPNextClient } from "../client.js";
import { ERPNextConfigError } from "../errors.js";

// Ensure mock transport is active (default, but explicit for clarity)
setTransport(mockTransport);

let failed = false;

function pass(label: string, detail: string) {
  console.log(`  PASS  ${label} — ${detail}`);
}

function fail(label: string, detail: string) {
  console.error(`  FAIL  ${label} — ${detail}`);
  failed = true;
}

async function main() {
  console.log("ERPNext adapter smoke test (mock transport)\n");

  // ── 1. Known SKU returns structured data ───────────────────────────────────
  try {
    const result = await fetchStockLevels(["HW-ST800-DIAP"]);
    if (result.length !== 1) {
      fail("known SKU → result", `expected 1 result, got ${result.length}`);
    } else if (
      typeof result[0]!.stockQuantity !== "number" ||
      typeof result[0]!.leadTimeDays !== "number"
    ) {
      fail("known SKU → result", "stockQuantity or leadTimeDays missing");
    } else {
      pass(
        "known SKU → result",
        `HW-ST800-DIAP: stockQty=${result[0]!.stockQuantity} leadDays=${result[0]!.leadTimeDays}`,
      );
    }
  } catch (err) {
    fail("known SKU → result", `threw: ${(err as Error).message}`);
  }

  // ── 2. Empty input returns [] ──────────────────────────────────────────────
  try {
    const result = await fetchStockLevels([]);
    if (result.length !== 0) {
      fail("empty input → []", `expected 0 results, got ${result.length}`);
    } else {
      pass("empty input → []", "returned empty array");
    }
  } catch (err) {
    fail("empty input → []", `threw: ${(err as Error).message}`);
  }

  // ── 3. Unknown SKU is omitted ──────────────────────────────────────────────
  try {
    const result = await fetchStockLevels(["UNKNOWN-SKU-DOES-NOT-EXIST"]);
    if (result.length !== 0) {
      fail("unknown SKU → omitted", `expected 0 results, got ${result.length}`);
    } else {
      pass("unknown SKU → omitted", "correctly returned no rows");
    }
  } catch (err) {
    fail("unknown SKU → omitted", `threw: ${(err as Error).message}`);
  }

  // ── 4. createERPNextClient throws on missing config ────────────────────────
  try {
    createERPNextClient({});
    fail("missing config → ERPNextConfigError", "expected throw but none occurred");
  } catch (err) {
    if (err instanceof ERPNextConfigError) {
      pass("missing config → ERPNextConfigError", `threw correctly: "${(err as Error).message}"`);
    } else {
      fail("missing config → ERPNextConfigError", `threw wrong error type: ${(err as Error).name}`);
    }
  }

  console.log();
  if (failed) {
    console.error("Smoke test FAILED");
    process.exit(1);
  } else {
    console.log("All checks passed.");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
