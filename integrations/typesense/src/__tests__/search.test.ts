/**
 * Unit tests for searchParts.
 * Typesense HTTP client is mocked — no server needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Part } from "@repo/shared";
import { searchParts } from "../search.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHit(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    document: {
      id:             "c0000000-0000-0000-0000-000000000001",
      sku:            "HW-ST800-DIAP",
      name:           "ST800 Diaphragm Assembly",
      manufacturer:   "Honeywell",
      sensorType:     "pressure",
      basePriceCents: 45000,
      stockQuantity:  24,
      leadTimeDays:   5,
      safetyStock:    10,
      uom:            "each",
      weightGrams:    340,
      ...overrides,
    },
  };
}

function makeClient(hits: ReturnType<typeof makeHit>[]) {
  const searchMock = vi.fn().mockResolvedValue({ hits });
  return {
    collections: vi.fn(() => ({
      documents: vi.fn(() => ({ search: searchMock })),
    })),
    _searchMock: searchMock,
  } as unknown as import("typesense").Client & { _searchMock: ReturnType<typeof vi.fn> };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("searchParts", () => {
  it("returns an empty array when hits is undefined", async () => {
    const client = {
      collections: vi.fn(() => ({
        documents: vi.fn(() => ({
          search: vi.fn().mockResolvedValue({}),
        })),
      })),
    } as unknown as import("typesense").Client;
    expect(await searchParts(client, "ST800")).toEqual([]);
  });

  it("returns an empty array when hits is empty", async () => {
    const client = makeClient([]);
    expect(await searchParts(client, "ST800")).toEqual([]);
  });

  it("maps a valid hit to a Part object", async () => {
    const client = makeClient([makeHit()]);
    const results = await searchParts(client, "ST800");
    expect(results).toHaveLength(1);
    const part = results[0] as Part;
    expect(part.sku).toBe("HW-ST800-DIAP");
    expect(part.manufacturer).toBe("Honeywell");
    expect(part.sensorType).toBe("pressure");
    expect(part.basePriceCents).toBe(45000);
  });

  it("skips hits with missing required fields", async () => {
    const client = makeClient([
      makeHit({ sku: undefined }),    // missing sku → skip
      makeHit({ id: "2", sku: "HW-ST800-SEAL" }), // valid
    ]);
    const results = await searchParts(client, "ST800");
    expect(results).toHaveLength(1);
    expect(results[0]!.sku).toBe("HW-ST800-SEAL");
  });

  it("sets description to null when not present in document", async () => {
    const client = makeClient([makeHit()]);
    const results = await searchParts(client, "ST800");
    expect(results[0]!.description).toBeNull();
  });

  it("sets description from document when present", async () => {
    const client = makeClient([makeHit({ description: "Replaces OEM diaphragm" })]);
    const results = await searchParts(client, "ST800");
    expect(results[0]!.description).toBe("Replaces OEM diaphragm");
  });

  it("passes sensorType filter to Typesense", async () => {
    const client = makeClient([makeHit()]);
    const c = client as ReturnType<typeof makeClient>;
    await searchParts(client, "RTD", { sensorType: "temperature" });
    const [params] = c._searchMock.mock.calls[0] as [Record<string, unknown>];
    expect(params["filter_by"]).toContain("sensorType:=temperature");
  });

  it("passes inStockOnly filter to Typesense", async () => {
    const client = makeClient([makeHit()]);
    const c = client as ReturnType<typeof makeClient>;
    await searchParts(client, "ST800", { inStockOnly: true });
    const [params] = c._searchMock.mock.calls[0] as [Record<string, unknown>];
    expect(params["filter_by"]).toContain("stockQuantity:>0");
  });

  it("combines multiple filters with &&", async () => {
    const client = makeClient([makeHit()]);
    const c = client as ReturnType<typeof makeClient>;
    await searchParts(client, "ST800", { sensorType: "pressure", inStockOnly: true });
    const [params] = c._searchMock.mock.calls[0] as [Record<string, unknown>];
    expect(params["filter_by"]).toContain(" && ");
  });

  it("omits filter_by when no filters are provided", async () => {
    const client = makeClient([makeHit()]);
    const c = client as ReturnType<typeof makeClient>;
    await searchParts(client, "ST800");
    const [params] = c._searchMock.mock.calls[0] as [Record<string, unknown>];
    expect(params).not.toHaveProperty("filter_by");
  });
});
