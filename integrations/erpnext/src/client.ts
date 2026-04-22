/**
 * Live ERPNext HTTP transport.
 *
 * Creates an InventoryTransport that queries the ERPNext REST API using
 * token-based authentication (Authorization: token api_key:api_secret).
 *
 * DocType queried: `Bin` — the per-warehouse stock record.
 *   Fields used: item_code (= SKU), actual_qty (current stock).
 *   Lead time is sourced from the Item master (lead_time_days field).
 *
 * This transport is intentionally separate from the mock so callers are
 * not affected when switching. Use setTransport(createERPNextClient()) to
 * activate it once real credentials are in .env.
 */

import {
  ERPNextAuthError,
  ERPNextConfigError,
  ERPNextParseError,
  ERPNextTransportError,
} from "./errors.js";
import type { InventoryTransport, StockLevel } from "./inventory.js";

export interface ERPNextClientConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Create a live ERPNext inventory transport.
 *
 * Reads credentials from the provided config object first, then falls back to
 * environment variables (ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET).
 *
 * Throws `ERPNextConfigError` immediately if any credential is missing.
 */
export function createERPNextClient(config: Partial<ERPNextClientConfig> = {}): InventoryTransport {
  const url = config.url ?? process.env["ERPNEXT_URL"];
  const apiKey = config.apiKey ?? process.env["ERPNEXT_API_KEY"];
  const apiSecret = config.apiSecret ?? process.env["ERPNEXT_API_SECRET"];

  if (!url)       throw new ERPNextConfigError("ERPNEXT_URL must be set");
  if (!apiKey)    throw new ERPNextConfigError("ERPNEXT_API_KEY must be set");
  if (!apiSecret) throw new ERPNextConfigError("ERPNEXT_API_SECRET must be set");

  const baseUrl = url.replace(/\/$/, "");
  const authHeader = `token ${apiKey}:${apiSecret}`;

  return {
    async fetchLevels(skus: string[]): Promise<StockLevel[]> {
      // Batch-query the Bin DocType for all requested SKUs.
      const filters = JSON.stringify([["item_code", "in", skus]]);
      const fields  = JSON.stringify(["item_code", "actual_qty", "lead_time_days"]);
      const endpoint =
        `${baseUrl}/api/resource/Bin` +
        `?filters=${encodeURIComponent(filters)}` +
        `&fields=${encodeURIComponent(fields)}`;

      let res: Response;
      try {
        res = await fetch(endpoint, {
          headers: {
            Authorization: authHeader,
            Accept: "application/json",
          },
        });
      } catch (err) {
        throw new ERPNextTransportError(
          `Network request to ERPNext failed: ${(err as Error).message}`,
        );
      }

      if (res.status === 401 || res.status === 403) {
        throw new ERPNextAuthError(`ERPNext rejected credentials (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new ERPNextTransportError(`ERPNext returned HTTP ${res.status}`);
      }

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        throw new ERPNextParseError("ERPNext response was not valid JSON");
      }

      if (
        typeof body !== "object" ||
        body === null ||
        !Array.isArray((body as Record<string, unknown>)["data"])
      ) {
        throw new ERPNextParseError("ERPNext response missing expected `data` array");
      }

      const rows = (body as { data: unknown[] })["data"];

      return rows.flatMap((row): StockLevel[] => {
        if (
          typeof row !== "object" ||
          row === null ||
          typeof (row as Record<string, unknown>)["item_code"] !== "string" ||
          typeof (row as Record<string, unknown>)["actual_qty"] !== "number"
        ) {
          return [];
        }
        const r = row as Record<string, unknown>;
        return [
          {
            sku: r["item_code"] as string,
            stockQuantity: r["actual_qty"] as number,
            leadTimeDays:
              typeof r["lead_time_days"] === "number"
                ? (r["lead_time_days"] as number)
                : 0,
          },
        ];
      });
    },
  };
}
