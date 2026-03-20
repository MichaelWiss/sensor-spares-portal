export interface LinePriceResult {
  unitPriceCents: number;
  lineTotalCents: number;
  discountPercent: number;
  savingsCents: number;
}

/**
 * Calculate the discounted price for a single order line.
 * Rounds unit price BEFORE multiplying by quantity to prevent cent drift.
 */
export function calculateLinePrice(
  basePriceCents: number,
  quantity: number,
  discountPercent: number
): LinePriceResult {
  const unitPriceCents = Math.round(basePriceCents * (1 - discountPercent / 100));
  const lineTotalCents = unitPriceCents * quantity;
  const savingsCents = (basePriceCents * quantity) - lineTotalCents;
  return { unitPriceCents, lineTotalCents, discountPercent, savingsCents };
}
