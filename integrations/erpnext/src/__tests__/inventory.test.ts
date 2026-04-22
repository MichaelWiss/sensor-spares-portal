import { describe, it, expect, beforeEach } from "vitest";
import { fetchStockLevels, mockTransport, setTransport } from "../inventory.js";

// Always reset to the mock transport before each test.
beforeEach(() => setTransport(mockTransport));

describe("fetchStockLevels", () => {
  it("returns empty array for empty input without calling transport", async () => {
    expect(await fetchStockLevels([])).toEqual([]);
  });

  it("returns stockQuantity and leadTimeDays for a known SKU", async () => {
    const result = await fetchStockLevels(["HW-ST800-DIAP"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sku: "HW-ST800-DIAP",
      stockQuantity: expect.any(Number),
      leadTimeDays: expect.any(Number),
    });
    expect(result[0]!.stockQuantity).toBeGreaterThanOrEqual(0);
    expect(result[0]!.leadTimeDays).toBeGreaterThanOrEqual(0);
  });

  it("omits unknown SKUs from results", async () => {
    const result = await fetchStockLevels(["UNKNOWN-SKU-DOES-NOT-EXIST"]);
    expect(result).toHaveLength(0);
  });

  it("returns correct data for multiple known SKUs", async () => {
    const result = await fetchStockLevels(["HW-ST800-DIAP", "HW-ST800-SEAL", "EM-3051-ELEC"]);
    expect(result).toHaveLength(3);
    const skus = result.map((r) => r.sku);
    expect(skus).toContain("HW-ST800-DIAP");
    expect(skus).toContain("HW-ST800-SEAL");
    expect(skus).toContain("EM-3051-ELEC");
  });

  it("handles mix of known and unknown SKUs", async () => {
    const result = await fetchStockLevels(["HW-ST800-DIAP", "FAKE-SKU-999"]);
    expect(result).toHaveLength(1);
    expect(result[0]!.sku).toBe("HW-ST800-DIAP");
  });

  it("each result has non-negative stockQuantity and leadTimeDays", async () => {
    const skus = ["HW-ST800-DIAP", "HW-ST800-SEAL", "HW-ST800-ELEC", "HW-ST800-GSKT"];
    const result = await fetchStockLevels(skus);
    for (const r of result) {
      expect(r.stockQuantity).toBeGreaterThanOrEqual(0);
      expect(r.leadTimeDays).toBeGreaterThanOrEqual(0);
    }
  });

  it("supports swapping transport via setTransport", async () => {
    setTransport({
      async fetchLevels(skus) {
        return skus.map((sku) => ({ sku, stockQuantity: 999, leadTimeDays: 1 }));
      },
    });
    const result = await fetchStockLevels(["ANY-SKU"]);
    expect(result[0]!.stockQuantity).toBe(999);
  });
});
