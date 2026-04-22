/**
 * Typesense client factory.
 *
 * Reads connection details from the provided config or environment variables:
 *   TYPESENSE_HOST      — hostname only, e.g. "localhost"
 *   TYPESENSE_PORT      — defaults to 8108
 *   TYPESENSE_PROTOCOL  — defaults to "http" (use "https" in production)
 *   TYPESENSE_API_KEY   — admin API key (for indexing) or search-only key
 *
 * For local dev: `docker run -p 8108:8108 typesense/typesense:27.1 \
 *   --data-dir /tmp/typesense-data --api-key=xyz --enable-cors`
 */

import { Client } from "typesense";

export interface TypesenseClientConfig {
  host: string;
  port: number;
  protocol: "http" | "https";
  apiKey: string;
}

/**
 * Create an authenticated Typesense client.
 * Throws if required configuration is missing.
 */
export function createTypesenseClient(
  config: Partial<TypesenseClientConfig> = {},
): Client {
  const host     = config.host     ?? process.env["TYPESENSE_HOST"];
  const apiKey   = config.apiKey   ?? process.env["TYPESENSE_API_KEY"];
  const port     = config.port     ?? Number(process.env["TYPESENSE_PORT"] ?? 8108);
  const protocol = config.protocol ?? (process.env["TYPESENSE_PROTOCOL"] as "http" | "https" | undefined) ?? "http";

  if (!host)   throw new Error("TYPESENSE_HOST must be set");
  if (!apiKey) throw new Error("TYPESENSE_API_KEY must be set");

  return new Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 5,
  });
}
