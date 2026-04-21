import { describe, it, expect } from "vitest";
import { filterBySensorType, filterByManufacturer, filterInStock, filterByFitType } from "../filters.js";
import type { CompatiblePart } from "../compatible-parts.js";
import {
  partDiaphragm,
  partSeal,
  partElectronics,
  partAftermarketSeal,
  partPT100Element,
} from "./fixtures.js";

const allPressureParts = [partDiaphragm, partSeal, partElectronics, partAftermarketSeal];
const allParts = [...allPressureParts, partPT100Element];

describe("filterBySensorType", () => {
  it("returns only pressure parts", () => {
    const result = filterBySensorType(allParts, "pressure");
    expect(result).toHaveLength(4);
    expect(result.every((p) => p.sensorType === "pressure")).toBe(true);
  });

  it("returns only temperature parts", () => {
    const result = filterBySensorType(allParts, "temperature");
    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe("EH-PT100-ELEM");
  });

  it("returns empty when no parts match the sensor type", () => {
    const result = filterBySensorType(allParts, "flow");
    expect(result).toHaveLength(0);
  });

  it("does not mutate the input array", () => {
    const copy = [...allParts];
    filterBySensorType(allParts, "pressure");
    expect(allParts).toHaveLength(copy.length);
  });
});

describe("filterByManufacturer", () => {
  it("returns only Honeywell parts", () => {
    const result = filterByManufacturer(allParts, "Honeywell");
    expect(result).toHaveLength(3); // diaphragm, seal, electronics
    expect(result.every((p) => p.manufacturer === "Honeywell")).toBe(true);
  });

  it("returns empty for unknown manufacturer", () => {
    const result = filterByManufacturer(allParts, "ACME");
    expect(result).toHaveLength(0);
  });
});

describe("filterInStock", () => {
  it("excludes parts with stockQuantity === 0", () => {
    const result = filterInStock(allParts);
    expect(result.every((p) => p.stockQuantity > 0)).toBe(true);
  });

  it("includes parts with stockQuantity > 0", () => {
    // diaphragm (12), seal (8), aftermarket seal (50), PT100 (6) are in stock
    // electronics (0) is out of stock
    const result = filterInStock(allPressureParts);
    expect(result).toHaveLength(3); // diaphragm, seal, aftermarket seal
    expect(result.map((p) => p.sku)).not.toContain("HW-ST800-ELEC");
  });

  it("returns empty when all parts are out of stock", () => {
    const result = filterInStock([partElectronics]);
    expect(result).toHaveLength(0);
  });
});

describe("filterByFitType", () => {
  const mixedCompatible: CompatiblePart[] = [
    { part: partDiaphragm,       fitType: "exact",       notes: null },
    { part: partSeal,            fitType: "exact",       notes: null },
    { part: partElectronics,     fitType: "equivalent",  notes: "adapter needed" },
    { part: partAftermarketSeal, fitType: "aftermarket", notes: null },
  ];

  it("returns only exact entries", () => {
    const result = filterByFitType(mixedCompatible, "exact");
    expect(result).toHaveLength(2);
    expect(result.every((cp) => cp.fitType === "exact")).toBe(true);
  });

  it("returns only equivalent entries", () => {
    const result = filterByFitType(mixedCompatible, "equivalent");
    expect(result).toHaveLength(1);
    expect(result[0].notes).toBe("adapter needed");
  });

  it("returns only aftermarket entries", () => {
    const result = filterByFitType(mixedCompatible, "aftermarket");
    expect(result).toHaveLength(1);
  });

  it("returns empty when no entries match the fit type", () => {
    const exactOnly: CompatiblePart[] = [{ part: partDiaphragm, fitType: "exact", notes: null }];
    expect(filterByFitType(exactOnly, "aftermarket")).toHaveLength(0);
  });
});
