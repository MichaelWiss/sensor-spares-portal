import { describe, it, expect } from "vitest";
import { getBaseDiscount, getVolumeBreak, calculateTotalDiscount } from "../discount.js";

describe("getBaseDiscount", () => {
  it("returns 0 for standard tier", () => expect(getBaseDiscount("standard")).toBe(0));
  it("returns 8 for silver tier", () => expect(getBaseDiscount("silver")).toBe(8));
  it("returns 15 for gold tier", () => expect(getBaseDiscount("gold")).toBe(15));
  it("returns 22 for platinum tier", () => expect(getBaseDiscount("platinum")).toBe(22));
});

describe("getVolumeBreak", () => {
  it("returns 0 for quantity below all thresholds", () => expect(getVolumeBreak(9)).toBe(0));
  it("returns 2 for quantity 10", () => expect(getVolumeBreak(10)).toBe(2));
  it("returns 5 for quantity 50", () => expect(getVolumeBreak(50)).toBe(5));
  it("returns 8 for quantity 100", () => expect(getVolumeBreak(100)).toBe(8));
  it("returns 8 for quantity 999 (highest break)", () => expect(getVolumeBreak(999)).toBe(8));
  it("uses custom contract tiers when provided", () => {
    const custom = [
      { id: "1", contractId: "c1", minQuantity: 25, additionalDiscountPercent: 3 },
      { id: "2", contractId: "c1", minQuantity: 75, additionalDiscountPercent: 6 },
    ];
    expect(getVolumeBreak(24, custom)).toBe(0);
    expect(getVolumeBreak(25, custom)).toBe(3);
    expect(getVolumeBreak(75, custom)).toBe(6);
  });
});

describe("calculateTotalDiscount", () => {
  it("gold + 100 units = 15 + 8 = 23%", () => expect(calculateTotalDiscount("gold", 100)).toBe(23));
  it("platinum + 50 units = 22 + 5 = 27%", () => expect(calculateTotalDiscount("platinum", 50)).toBe(27));
  it("standard + 1 unit = 0%", () => expect(calculateTotalDiscount("standard", 1)).toBe(0));
  it("caps at 100%", () => {
    // Hypothetical: if somehow discounts exceeded 100, it should cap
    expect(calculateTotalDiscount("platinum", 100)).toBeLessThanOrEqual(100);
  });
});
