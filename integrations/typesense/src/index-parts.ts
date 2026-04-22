/**
 * indexParts — upsert Part documents into the Typesense `parts` collection.
 *
 * - Creates the collection if it does not exist.
 * - Uses `action: "upsert"` so calling this multiple times is safe.
 * - Returns a summary of how many succeeded and failed.
 */

import type { Client } from "typesense";
import type { Part } from "@repo/shared";
import { PARTS_COLLECTION, partsCollectionSchema } from "./schema.js";

export interface IndexResult {
  total: number;
  succeeded: number;
  failed: number;
}

/**
 * Ensure the `parts` collection exists, creating it if necessary.
 */
async function ensureCollection(client: Client): Promise<void> {
  try {
    await client.collections(PARTS_COLLECTION).retrieve();
  } catch {
    // Collection does not exist — create it.
    await client.collections().create(partsCollectionSchema);
  }
}

/**
 * Map a shared `Part` domain object to a flat Typesense document.
 * Null optional fields are dropped so Typesense treats them as missing.
 */
function toDocument(part: Part): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    id:             part.id,
    sku:            part.sku,
    name:           part.name,
    manufacturer:   part.manufacturer,
    sensorType:     part.sensorType,
    basePriceCents: part.basePriceCents,
    stockQuantity:  part.stockQuantity,
    leadTimeDays:   part.leadTimeDays,
    safetyStock:    part.safetyStock,
    uom:            part.uom,
    weightGrams:    part.weightGrams,
  };
  if (part.description !== null) doc["description"] = part.description;
  return doc;
}

/**
 * Upsert all parts into Typesense.
 *
 * @param client - An authenticated Typesense.Client instance
 * @param parts  - Array of Part objects to index
 */
export async function indexParts(
  client: Client,
  parts: Part[],
): Promise<IndexResult> {
  if (parts.length === 0) return { total: 0, succeeded: 0, failed: 0 };

  await ensureCollection(client);

  const documents = parts.map(toDocument);
  const results = await client
    .collections(PARTS_COLLECTION)
    .documents()
    .import(documents, { action: "upsert" });

  const succeeded = results.filter((r: { success: boolean }) => r.success).length;
  const failed    = results.length - succeeded;

  return { total: results.length, succeeded, failed };
}

/**
 * Drop and recreate the `parts` collection.
 * Useful during development to reset the index state.
 */
export async function resetPartsCollection(client: Client): Promise<void> {
  try {
    await client.collections(PARTS_COLLECTION).delete();
  } catch {
    // Collection may not exist yet — that's fine.
  }
  await client.collections().create(partsCollectionSchema);
}
