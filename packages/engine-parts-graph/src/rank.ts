import type { FitType } from "@repo/shared";
import type { CompatiblePart } from "./compatible-parts.js";

const FIT_TYPE_RANK: Record<FitType, number> = {
  exact: 0,
  equivalent: 1,
  aftermarket: 2,
};

/**
 * WHAT THIS DOES:
 * Produces a single flat list from a mixed collection of CompatibleParts,
 * sorted by three criteria in priority order:
 *   1. Fit type  (exact first, aftermarket last)
 *   2. Stock     (in-stock before out-of-stock within the same fit type)
 *   3. Price     (cheaper first when stock status is the same)
 *
 * WHEN TO USE THIS VS findCompatibleParts:
 * findCompatibleParts → model detail page: three labelled sections
 *                       (buyers compare fit categories deliberately)
 * rankParts           → search results, "top recommendations" widget,
 *                       any context where you want ONE list, not tabs
 *
 * WHY THE THREE-LEVEL SORT:
 * An exact in-stock expensive part is still better than an equivalent
 * in-stock cheap part — the buyer should not have to hunt for it.
 * But within exact matches, cheaper in-stock is preferable to pricier in-stock.
 * This mirrors how a knowledgeable parts counter clerk would sequence a verbal
 * recommendation.
 */
export function rankParts(parts: CompatiblePart[]): CompatiblePart[] {
  return [...parts].sort((a, b) => {
    // 1. Fit type rank
    const fitDiff = FIT_TYPE_RANK[a.fitType] - FIT_TYPE_RANK[b.fitType];
    if (fitDiff !== 0) return fitDiff;
    // 2. In-stock first
    const aInStock = a.part.stockQuantity > 0 ? 0 : 1;
    const bInStock = b.part.stockQuantity > 0 ? 0 : 1;
    if (aInStock !== bInStock) return aInStock - bInStock;
    // 3. Cheaper first
    return a.part.basePriceCents - b.part.basePriceCents;
  });
}
