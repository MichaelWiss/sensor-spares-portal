import { describe, it, expect } from "vitest";
import { calculateLinePrice } from "../line-price.js";

describe("calculateLinePrice", () => {
  it("no discount: $450 × 1 = $450.00", () => {
    const r = calculateLinePrice(45000, 1, 0);
    expect(r.unitPriceCents).toBe(45000);
    expect(r.lineTotalCents).toBe(45000);
    expect(r.savingsCents).toBe(0);
  });

  it("15% discount: $450 × 1 = $382.50", () => {
    const r = calculateLinePrice(45000, 1, 15);
    expect(r.unitPriceCents).toBe(38250);
    expect(r.lineTotalCents).toBe(38250);
    expect(r.savingsCents).toBe(6750);
  });

  it("17% discount: $450 × 10 = $3,735.00", () => {
    const r = calculateLinePrice(45000, 10, 17);
    expect(r.unitPriceCents).toBe(37350);
    expect(r.lineTotalCents).toBe(373500);
  });

  it("quantity 0 produces 0 total", () => {
    const r = calculateLinePrice(45000, 0, 15);
    expect(r.lineTotalCents).toBe(0);
  });

  it("rounds correctly: $35 at 8% = $32.20 = 3220 cents", () => {
    const r = calculateLinePrice(3500, 1, 8);
    expect(r.unitPriceCents).toBe(3220);
  });
});
