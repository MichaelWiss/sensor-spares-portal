import type { Part, SensorType, FitType } from "@repo/shared";
import type { CompatiblePart } from "./compatible-parts.js";

/**
 * WHAT THESE DO:
 * Pure filter functions that the storefront UI passes results through.
 * Each takes an array and returns a subset — they do not mutate the input.
 *
 * WHY PURE FUNCTIONS INSTEAD OF QUERY PARAMS:
 * These run on data already in memory (fetched once per page load).
 * The storefront fetches all compatible parts for a model, then applies
 * filters client-side as the buyer refines their search. No extra DB round-trips.
 *
 * COMPOSITION:
 * Filters can be chained:
 *   const results = filterInStock(filterBySensorType(parts, "pressure"));
 */

/** Keep only parts of a specific sensor type (pressure / temperature / flow / ...) */
export function filterBySensorType(parts: Part[], sensorType: SensorType): Part[] {
  return parts.filter((p) => p.sensorType === sensorType);
}

/** Keep only parts from a specific manufacturer (e.g. "Honeywell") */
export function filterByManufacturer(parts: Part[], manufacturer: string): Part[] {
  return parts.filter((p) => p.manufacturer === manufacturer);
}

/**
 * Keep only parts currently in stock.
 * Uses stockQuantity > 0 — parts with stockQuantity === 0 are shown as
 * "available to order" on the UI but excluded from the in-stock filter.
 */
export function filterInStock(parts: Part[]): Part[] {
  return parts.filter((p) => p.stockQuantity > 0);
}

/** Keep only CompatiblePart entries with a specific fit type */
export function filterByFitType(parts: CompatiblePart[], fitType: FitType): CompatiblePart[] {
  return parts.filter((cp) => cp.fitType === fitType);
}
