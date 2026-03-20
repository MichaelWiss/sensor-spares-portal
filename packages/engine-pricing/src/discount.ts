import { CONTRACT_TIER_DISCOUNTS, VOLUME_BREAKS } from "@repo/shared";
import type { ContractTierName, ContractTier } from "@repo/shared";

/** Look up the base discount for a contract tier (e.g., gold → 15) */
export function getBaseDiscount(tier: ContractTierName): number {
  return CONTRACT_TIER_DISCOUNTS[tier];
}

/**
 * Find the highest qualifying volume break for a given quantity.
 * If custom contractTiers are provided, use those; otherwise fall back to VOLUME_BREAKS.
 * Returns the additional discount percentage (e.g., 5 for 5%).
 */
export function getVolumeBreak(quantity: number, contractTiers?: ContractTier[]): number {
  const breaks = contractTiers && contractTiers.length > 0
    ? contractTiers.map(t => ({ minQuantity: t.minQuantity, additionalDiscountPercent: t.additionalDiscountPercent }))
    : [...VOLUME_BREAKS];

  // Sort descending by minQuantity so we find the highest qualifying break first
  const sorted = breaks.sort((a, b) => b.minQuantity - a.minQuantity);
  const match = sorted.find(b => quantity >= b.minQuantity);
  return match?.additionalDiscountPercent ?? 0;
}

/**
 * Total discount = base tier discount + volume break.
 * Capped at 100%.
 */
export function calculateTotalDiscount(
  tier: ContractTierName,
  quantity: number,
  contractTiers?: ContractTier[]
): number {
  return Math.min(100, getBaseDiscount(tier) + getVolumeBreak(quantity, contractTiers));
}
