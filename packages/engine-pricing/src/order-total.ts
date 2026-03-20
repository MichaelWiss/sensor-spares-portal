export interface OrderTotalInput {
  lines: { lineTotalCents: number; savingsCents: number }[];
  shippingCents: number;
  taxCents: number;
}

export interface OrderTotalResult {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export function calculateOrderTotal(input: OrderTotalInput): OrderTotalResult {
  const subtotalCents = input.lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const discountCents = input.lines.reduce((sum, l) => sum + l.savingsCents, 0);
  return {
    subtotalCents,
    discountCents,
    shippingCents: input.shippingCents,
    taxCents: input.taxCents,
    totalCents: subtotalCents + input.shippingCents + input.taxCents,
  };
}
