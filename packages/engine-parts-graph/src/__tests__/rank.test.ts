import { describe, it, expect } from "vitest";
import { rankParts } from "../rank.js";
import type { CompatiblePart } from "../compatible-parts.js";
import {
  partDiaphragm,
  partSeal,
  partElectronics,
  partAftermarketSeal,
  partExpensiveOutOfStock,
} from "./fixtures.js";

/**
 * WHAT THESE TESTS VERIFY:
 * The three-level sort: fit type → stock → price.
 * Tests verify that a higher-priority criterion always beats a lower one:
 * an exact out-of-stock expensive part should appear before an
 * aftermarket in-stock cheap part.
 */

const makeCP = (part: typeof partDiaphragm, fitType: CompatiblePart["fitType"]): CompatiblePart => ({
  part,
  fitType,
  notes: null,
});

describe("rankParts — fit type is the primary sort key", () => {
  it("exact parts come before equivalent, which come before aftermarket", () => {
    const input: CompatiblePart[] = [
      makeCP(partAftermarketSeal, "aftermarket"),
      makeCP(partSeal, "equivalent"),
      makeCP(partDiaphragm, "exact"),
    ];
    const ranked = rankParts(input);
    expect(ranked[0].fitType).toBe("exact");
    expect(ranked[1].fitType).toBe("equivalent");
    expect(ranked[2].fitType).toBe("aftermarket");
  });

  it("exact out-of-stock beats aftermarket in-stock (fit type wins)", () => {
    const input: CompatiblePart[] = [
      makeCP(partAftermarketSeal, "aftermarket"),  // in-stock, $85
      makeCP(partElectronics, "exact"),             // out-of-stock, $890
    ];
    const ranked = rankParts(input);
    expect(ranked[0].part.sku).toBe(partElectronics.sku);   // exact OOS first
    expect(ranked[1].part.sku).toBe(partAftermarketSeal.sku); // aftermarket in-stock second
  });
});

describe("rankParts — within same fit type, stock is the secondary key", () => {
  it("in-stock parts come before out-of-stock", () => {
    const input: CompatiblePart[] = [
      makeCP(partElectronics, "exact"),        // out-of-stock
      makeCP(partExpensiveOutOfStock, "exact"), // out-of-stock
      makeCP(partDiaphragm, "exact"),          // in-stock
      makeCP(partSeal, "exact"),               // in-stock
    ];
    const ranked = rankParts(input);
    expect(ranked[0].part.stockQuantity).toBeGreaterThan(0); // in-stock
    expect(ranked[1].part.stockQuantity).toBeGreaterThan(0); // in-stock
    expect(ranked[2].part.stockQuantity).toBe(0);            // out-of-stock
    expect(ranked[3].part.stockQuantity).toBe(0);            // out-of-stock
  });
});

describe("rankParts — within same fit type and stock status, price is the tertiary key", () => {
  it("cheaper in-stock part comes before pricier in-stock part", () => {
    const input: CompatiblePart[] = [
      makeCP(partDiaphragm, "exact"),  // in-stock, $450
      makeCP(partSeal, "exact"),       // in-stock, $120
    ];
    const ranked = rankParts(input);
    expect(ranked[0].part.sku).toBe(partSeal.sku);       // $120 first
    expect(ranked[1].part.sku).toBe(partDiaphragm.sku);  // $450 second
  });

  it("cheaper out-of-stock comes before pricier out-of-stock", () => {
    const input: CompatiblePart[] = [
      makeCP(partExpensiveOutOfStock, "exact"),  // OOS, $1200
      makeCP(partElectronics, "exact"),           // OOS, $890
    ];
    const ranked = rankParts(input);
    expect(ranked[0].part.sku).toBe(partElectronics.sku);        // $890 first
    expect(ranked[1].part.sku).toBe(partExpensiveOutOfStock.sku); // $1200 second
  });
});

describe("rankParts — full mixed list", () => {
  it("produces correct overall order across all three criteria", () => {
    const input: CompatiblePart[] = [
      makeCP(partAftermarketSeal, "aftermarket"),   // aftermarket, in-stock, $85
      makeCP(partExpensiveOutOfStock, "exact"),      // exact, OOS, $1200
      makeCP(partSeal, "exact"),                     // exact, in-stock, $120
      makeCP(partDiaphragm, "equivalent"),           // equivalent, in-stock, $450
      makeCP(partElectronics, "exact"),              // exact, OOS, $890
    ];
    const ranked = rankParts(input);

    expect(ranked[0].part.sku).toBe(partSeal.sku);              // exact, in-stock, $120
    expect(ranked[1].part.sku).toBe(partElectronics.sku);       // exact, OOS, $890
    expect(ranked[2].part.sku).toBe(partExpensiveOutOfStock.sku); // exact, OOS, $1200
    expect(ranked[3].part.sku).toBe(partDiaphragm.sku);         // equivalent, in-stock
    expect(ranked[4].part.sku).toBe(partAftermarketSeal.sku);   // aftermarket, in-stock
  });
});

describe("rankParts — edge cases", () => {
  it("empty array returns empty array", () => {
    expect(rankParts([])).toEqual([]);
  });

  it("single item returns that item", () => {
    const input = [makeCP(partSeal, "exact")];
    expect(rankParts(input)).toHaveLength(1);
  });

  it("does not mutate the original array", () => {
    const input: CompatiblePart[] = [
      makeCP(partAftermarketSeal, "aftermarket"),
      makeCP(partSeal, "exact"),
    ];
    const originalFirst = input[0].part.sku;
    rankParts(input);
    expect(input[0].part.sku).toBe(originalFirst); // input unchanged
  });
});
