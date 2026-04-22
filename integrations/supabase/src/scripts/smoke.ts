/**
 * Smoke test for the Supabase client adapter.
 *
 * Run from repo root with:
 *   pnpm --filter @repo/supabase-client smoke
 *
 * Requires:
 *   - `supabase start` running locally
 *   - .env populated with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *     SUPABASE_SERVICE_ROLE_KEY
 *
 * Verifies the three claims from BUILD_PLAN Cell 5.2:
 *   1. Browser client reads `parts` (public catalog table, anon key OK)
 *   2. Server client reads `suppliers` (service role bypasses RLS)
 *   3. Browser client gets ZERO suppliers (RLS blocks anon access)
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from the repo root (4 levels up from this file)
const here = fileURLToPath(import.meta.url);
config({ path: resolve(here, "../../../../../.env") });

const { createBrowserClient } = await import("../browser.js");
const { createServerClient } = await import("../server.js");

let failed = false;

function pass(label: string, detail: string) {
  console.log(`  PASS  ${label} — ${detail}`);
}

function fail(label: string, detail: string) {
  console.error(`  FAIL  ${label} — ${detail}`);
  failed = true;
}

async function main() {
  console.log("Supabase client adapter smoke test\n");

  // ── 1. Browser client reads parts via anon key ────────────────────────────
  try {
    const browser = createBrowserClient();
    const { data, error } = await browser
      .from("parts")
      .select("sku, name, base_price_cents")
      .limit(3);

    if (error) {
      fail("browser → parts", `query error: ${error.message}`);
    } else if (!data || data.length === 0) {
      fail("browser → parts", "no rows returned (did you run `supabase db reset`?)");
    } else {
      pass(
        "browser → parts",
        `read ${data.length} rows (e.g. ${data[0]?.sku} @ ${data[0]?.base_price_cents}c)`,
      );
    }
  } catch (err) {
    fail("browser → parts", `threw: ${(err as Error).message}`);
  }

  // ── 2. Server client reads suppliers via service role ─────────────────────
  try {
    const server = createServerClient();
    const { data, error } = await server
      .from("suppliers")
      .select("name, contact_email")
      .limit(3);

    if (error) {
      fail("server → suppliers", `query error: ${error.message}`);
    } else if (!data || data.length === 0) {
      fail("server → suppliers", "no rows returned");
    } else {
      pass(
        "server → suppliers",
        `read ${data.length} rows (e.g. ${data[0]?.name})`,
      );
    }
  } catch (err) {
    fail("server → suppliers", `threw: ${(err as Error).message}`);
  }

  // ── 3. Browser client is BLOCKED from suppliers by RLS ────────────────────
  // RLS policy returns zero rows rather than an error for unauthorized SELECT.
  try {
    const browser = createBrowserClient();
    const { data, error } = await browser.from("suppliers").select("name");

    if (error) {
      fail("browser → suppliers (RLS)", `unexpected error: ${error.message}`);
    } else if (data && data.length > 0) {
      fail(
        "browser → suppliers (RLS)",
        `expected 0 rows but got ${data.length} — RLS is NOT blocking anon access`,
      );
    } else {
      pass("browser → suppliers (RLS)", "0 rows returned (anon correctly blocked)");
    }
  } catch (err) {
    fail("browser → suppliers (RLS)", `threw: ${(err as Error).message}`);
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
