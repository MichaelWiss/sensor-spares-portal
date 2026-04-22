/**
 * searchParts — full-text search over the `parts` collection.
 *
 * Searches across `sku`, `name`, `manufacturer`, and `description`.
 * Supports optional facet filters so callers can narrow by sensorType
 * or manufacturer without touching the query string.
 *
 * Returns an array of `Part`-shaped objects reconstructed from the
 * Typesense hit documents.
 */

import type { Client } from "typesense";
import type { Part, SensorType } from "@repo/shared";
import { PARTS_COLLECTION } from "./schema.js";

export interface SearchFilters {
  sensorType?: SensorType;
  manufacturer?: string;
  /** Only return parts with stockQuantity > 0 */
  inStockOnly?: boolean;
}

/**
 * Search parts by a free-text query with optional filters.
 *
 * @param client  - Authenticated Typesense.Client
 * @param query   - Search string (e.g. "ST800 diaphragm")
 * @param filters - Optional filter options
 * @returns       - Matching parts ranked by relevance
 */
export async function searchParts(
  client: Client,
  query: string,
  filters: SearchFilters = {},
): Promise<Part[]> {
  const filterClauses: string[] = [];

  if (filters.sensorType) {
    filterClauses.push(`sensorType:=${filters.sensorType}`);
  }
  if (filters.manufacturer) {
    filterClauses.push(`manufacturer:=${filters.manufacturer}`);
  }
  if (filters.inStockOnly) {
    filterClauses.push("stockQuantity:>0");
  }

  const searchParams = {
    q:              query,
    query_by:       "name,sku,manufacturer,description",
    query_by_weights: "4,3,2,1",
    per_page:       50,
    ...(filterClauses.length > 0 && { filter_by: filterClauses.join(" && ") }),
  };

  const result = await client
    .collections(PARTS_COLLECTION)
    .documents()
    .search(searchParams);

  if (!result.hits) return [];

  return result.hits.flatMap((hit): Part[] => {
    const d = hit.document as Record<string, unknown>;

    // Reconstruct a Part object from the Typesense document fields.
    // Non-nullable fields must be present; guard defensively.
    if (
      typeof d["id"]             !== "string" ||
      typeof d["sku"]            !== "string" ||
      typeof d["name"]           !== "string" ||
      typeof d["manufacturer"]   !== "string" ||
      typeof d["sensorType"]     !== "string" ||
      typeof d["basePriceCents"] !== "number" ||
      typeof d["stockQuantity"]  !== "number" ||
      typeof d["leadTimeDays"]   !== "number"
    ) {
      return [];
    }

    return [
      {
        id:             d["id"] as string,
        sku:            d["sku"] as string,
        name:           d["name"] as string,
        manufacturer:   d["manufacturer"] as string,
        sensorType:     d["sensorType"] as SensorType,
        description:    typeof d["description"] === "string" ? d["description"] : null,
        imageUrl:       null,
        datasheetUrl:   null,
        basePriceCents: d["basePriceCents"] as number,
        stockQuantity:  d["stockQuantity"] as number,
        leadTimeDays:   d["leadTimeDays"] as number,
        safetyStock:    typeof d["safetyStock"] === "number" ? d["safetyStock"] as number : 0,
        uom:            typeof d["uom"] === "string" ? d["uom"] as string : "each",
        weightGrams:    typeof d["weightGrams"] === "number" ? d["weightGrams"] as number : 0,
        createdAt:      "",
        updatedAt:      "",
      },
    ];
  });
}
