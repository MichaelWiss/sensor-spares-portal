import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";

/**
 * Creates a Supabase client for use in server-only contexts (Edge Functions,
 * server components, API routes, admin scripts).
 *
 * Uses the service role key which BYPASSES all RLS policies.
 * Never expose this client or its key to the browser.
 *
 * - autoRefreshToken: false — server processes don't need token refresh
 * - persistSession: false  — no cookie/localStorage in server contexts
 */
export function createServerClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type ServerClient = ReturnType<typeof createServerClient>;
