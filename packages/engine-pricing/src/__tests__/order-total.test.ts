import { describe, it, expect } from "vitest";
import { calculateOrderTotal } from "../order-total.js";

describe("calculateOrderTotal", () => {
  it("sums lines + shipping + tax", () => {
    const r = calculateOrderTotal({
      lines: [
        { lineTotalCents: 38250, savingsCents: 6750 },
        { lineTotalCents: 373500, savingsCents: 76500 },
      ],
      shippingCents: 8000,
      taxCents: 32940,
    });
    expect(r.subtotalCents).toBe(411750);
    expect(r.discountCents).toBe(83250);
    expect(r.shippingCents).toBe(8000);
    expect(r.taxCents).toBe(32940);
    expect(r.totalCents).toBe(452690);
  });

  it("handles empty lines", () => {
    const r = calculateOrderTotal({ lines: [], shippingCents: 8000, taxCents: 0 });
    expect(r.subtotalCents).toBe(0);
    expect(r.totalCents).toBe(8000);
  });
});
