import type { Compatibility, Part, FitType } from "@repo/shared";

export interface CompatiblePart {
  part: Part;
  fitType: FitType;
  notes: string | null;
}

export interface GroupedCompatibleParts {
  exact: CompatiblePart[];
  equivalent: CompatiblePart[];
  aftermarket: CompatiblePart[];
}

/**
 * WHAT THIS DOES:
 * The compatibility table is a graph. Each row is an edge: model → part, with
 * a fit_type label (exact / equivalent / aftermarket). This function walks all
 * edges for a given model and builds three buckets from the results.
 *
 * WHY A MAP INSTEAD OF AN ARRAY SCAN:
 * `partsMap` is a `Map<partId, Part>` built once from the full parts array.
 * Looking up a part by ID is O(1) instead of O(n) per compatibility row.
 * When a model has 20+ compatible parts and you're rendering a page, this
 * matters — though the bigger reason is clarity: the intent is explicit.
 *
 * WHY SORT WITHIN EACH GROUP:
 * Buyers see the grouped results on the model detail page. Within "Exact Fit",
 * they should see in-stock parts before out-of-stock, and cheaper options
 * before expensive ones. This sort order is the default display order — the
 * storefront UI can override it, but this is the sensible baseline.
 *
 * INPUTS:
 *   modelId           — the UUID of the sensor model being looked up
 *   compatibilityRows — ALL compatibility rows from the DB (pre-fetched once)
 *   partsMap          — Map<partId, Part> built from the parts table
 *
 * OUTPUT:
 *   GroupedCompatibleParts — three arrays, each sorted by stock then price
 */
function sortByStockThenPrice(parts: CompatiblePart[]): CompatiblePart[] {
  return [...parts].sort((a, b) => {
    const aInStock = a.part.stockQuantity > 0 ? 0 : 1;
    const bInStock = b.part.stockQuantity > 0 ? 0 : 1;
    if (aInStock !== bInStock) return aInStock - bInStock;
    return a.part.basePriceCents - b.part.basePriceCents;
  });
}

export function findCompatibleParts(
  modelId: string,
  compatibilityRows: Compatibility[],
  partsMap: Map<string, Part>
): GroupedCompatibleParts {
  const groups: GroupedCompatibleParts = { exact: [], equivalent: [], aftermarket: [] };

  for (const row of compatibilityRows) {
    if (row.modelId !== modelId) continue;
    const part = partsMap.get(row.partId);
    if (!part) continue;
    groups[row.fitType].push({ part, fitType: row.fitType, notes: row.notes ?? null });
  }

  groups.exact = sortByStockThenPrice(groups.exact);
  groups.equivalent = sortByStockThenPrice(groups.equivalent);
  groups.aftermarket = sortByStockThenPrice(groups.aftermarket);
  return groups;
}
