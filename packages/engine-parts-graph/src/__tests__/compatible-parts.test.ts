import { describe, it, expect } from "vitest";
import { findCompatibleParts } from "../compatible-parts.js";
import {
  compatibilityRows,
  partsMap,
  partSeal,
  partDiaphragm,
  partElectronics,
  partExpensiveOutOfStock,
  partAftermarketSeal,
} from "./fixtures.js";

/**
 * WHAT THESE TESTS VERIFY:
 * 1. Correct grouping — edges end up in the right bucket
 * 2. Sort order within each group — in-stock before out-of-stock, cheaper first
 * 3. Cross-model edges don't bleed between models
 * 4. Unknown model IDs produce empty groups
 * 5. The "notes" field is preserved on the result
 */

describe("findCompatibleParts — ST800 model", () => {
  const result = findCompatibleParts("model-st800", compatibilityRows, partsMap);

  it("exact group has 4 parts", () => {
    expect(result.exact).toHaveLength(4);
  });

  it("equivalent group is empty (no equivalent edges for ST800)", () => {
    expect(result.equivalent).toHaveLength(0);
  });

  it("aftermarket group has 1 part", () => {
    expect(result.aftermarket).toHaveLength(1);
    expect(result.aftermarket[0].part.sku).toBe("ISD-SEAL-GEN");
  });

  it("aftermarket note is preserved", () => {
    expect(result.aftermarket[0].notes).toBe("Verify specs before install");
  });

  describe("exact group sort order", () => {
    /**
     * Parts: seal (in-stock $120), diaphragm (in-stock $450), electronics (OOS $890), expensive (OOS $1200)
     * Expected order: seal first (in-stock, cheapest), diaphragm second (in-stock, pricier),
     *                 electronics third (OOS, cheaper), expensive-oos last (OOS, most expensive)
     */
    it("first part is the cheapest in-stock part (seal kit at $120)", () => {
      expect(result.exact[0].part.sku).toBe(partSeal.sku);
    });

    it("second part is next cheapest in-stock (diaphragm at $450)", () => {
      expect(result.exact[1].part.sku).toBe(partDiaphragm.sku);
    });

    it("third part is cheapest out-of-stock (electronics at $890)", () => {
      expect(result.exact[2].part.sku).toBe(partElectronics.sku);
    });

    it("last part is most expensive out-of-stock (premium housing at $1200)", () => {
      expect(result.exact[3].part.sku).toBe(partExpensiveOutOfStock.sku);
    });
  });
});

describe("findCompatibleParts — 3051S model", () => {
  const result = findCompatibleParts("model-3051", compatibilityRows, partsMap);

  it("exact group has 1 part (native 3051 diaphragm)", () => {
    expect(result.exact).toHaveLength(1);
    expect(result.exact[0].part.sku).toBe("EM-3051-DIAP");
  });

  it("equivalent group has 1 part (ST800 diaphragm with adapter note)", () => {
    expect(result.equivalent).toHaveLength(1);
    expect(result.equivalent[0].part.sku).toBe("HW-ST800-DIAP");
    expect(result.equivalent[0].notes).toBe("Requires mounting adapter kit");
  });

  it("aftermarket group is empty", () => {
    expect(result.aftermarket).toHaveLength(0);
  });
});

describe("findCompatibleParts — PT100 model", () => {
  const result = findCompatibleParts("model-pt100", compatibilityRows, partsMap);

  it("exact group has 1 part (temperature element)", () => {
    expect(result.exact).toHaveLength(1);
    expect(result.exact[0].part.sku).toBe("EH-PT100-ELEM");
  });

  it("no pressure parts bleed into PT100 results", () => {
    const allSkus = [
      ...result.exact,
      ...result.equivalent,
      ...result.aftermarket,
    ].map((cp) => cp.part.sku);
    expect(allSkus).not.toContain("HW-ST800-DIAP");
    expect(allSkus).not.toContain("HW-ST800-SEAL");
  });
});

describe("findCompatibleParts — edge cases", () => {
  it("unknown model ID returns all empty groups", () => {
    const result = findCompatibleParts("model-does-not-exist", compatibilityRows, partsMap);
    expect(result.exact).toHaveLength(0);
    expect(result.equivalent).toHaveLength(0);
    expect(result.aftermarket).toHaveLength(0);
  });

  it("compatibility row referencing missing part is silently skipped", () => {
    const brokenRows = [
      ...compatibilityRows,
      { id: "c-broken", modelId: "model-st800", partId: "part-ghost", fitType: "exact" as const, notes: null, createdAt: new Date() },
    ];
    // Should not throw — the ghost part simply won't appear
    expect(() => findCompatibleParts("model-st800", brokenRows, partsMap)).not.toThrow();
    const result = findCompatibleParts("model-st800", brokenRows, partsMap);
    // Still 4 exact parts — the ghost is skipped
    expect(result.exact).toHaveLength(4);
  });
});
