/**
 * Unit tests for the Typesense schema definition.
 * These tests make no HTTP calls — they verify the schema shape matches
 * what the rest of the adapter expects.
 */
import { describe, it, expect } from "vitest";
import { partsCollectionSchema, PARTS_COLLECTION } from "../schema.js";

describe("partsCollectionSchema", () => {
  it("has the correct collection name", () => {
    expect(partsCollectionSchema.name).toBe(PARTS_COLLECTION);
    expect(PARTS_COLLECTION).toBe("parts");
  });

  it("includes all required field names", () => {
    const names = partsCollectionSchema.fields!.map((f: { name: string }) => f.name);
    const required = [
      "id", "sku", "name", "manufacturer", "sensorType",
      "basePriceCents", "stockQuantity", "leadTimeDays",
      "weightGrams", "uom", "safetyStock",
    ];
    for (const field of required) {
      expect(names, `missing field: ${field}`).toContain(field);
    }
  });

  it("marks description as optional", () => {
    const desc = partsCollectionSchema.fields!.find((f: { name: string; optional?: boolean }) => f.name === "description");
    expect(desc).toBeDefined();
    expect(desc!.optional).toBe(true);
  });

  it("marks manufacturer and sensorType as facets", () => {
    const facets = partsCollectionSchema.fields!.filter((f: { name: string; facet?: boolean }) => f.facet === true).map((f: { name: string }) => f.name);
    expect(facets).toContain("manufacturer");
    expect(facets).toContain("sensorType");
  });

  it("uses int32 for numeric fields", () => {
    const numerics = ["basePriceCents", "stockQuantity", "leadTimeDays", "weightGrams", "safetyStock"];
    for (const name of numerics) {
      const field = partsCollectionSchema.fields!.find((f: { name: string; type: string }) => f.name === name);
      expect(field?.type, `${name} should be int32`).toBe("int32");
    }
  });

  it("sets a default_sorting_field", () => {
    expect(partsCollectionSchema.default_sorting_field).toBe("basePriceCents");
  });
});
