import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

/**
 * Creates a Supabase client for use in browser (client-side) contexts.
 *
 * Uses the public anon key — all queries run through RLS policies.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * environment variables, which Next.js inlines at build time for browser bundles.
 *
 * Never call this from server-only code — use createServerClient() instead.
 */
export function createBrowserClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }

  return createClient<Database>(url, anonKey);
}

export type BrowserClient = ReturnType<typeof createBrowserClient>;
