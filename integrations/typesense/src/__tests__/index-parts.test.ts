/**
 * Unit tests for indexParts and resetPartsCollection.
 * The Typesense HTTP client is mocked at the module level so no server is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Part } from "@repo/shared";
import { indexParts, resetPartsCollection } from "../index-parts.js";

// ── Minimal Typesense client mock ─────────────────────────────────────────────

const importMock   = vi.fn();
const retrieveMock = vi.fn();
const createMock   = vi.fn();
const deleteMock   = vi.fn();

function makeClient() {
  return {
    collections: vi.fn((name?: string) => {
      if (name) {
        return {
          retrieve: retrieveMock,
          delete:   deleteMock,
          documents: vi.fn(() => ({ import: importMock })),
        };
      }
      return { create: createMock };
    }),
  } as unknown as import("typesense").Client;
}

// ── Seed fixtures ─────────────────────────────────────────────────────────────

const makePart = (overrides: Partial<Part> = {}): Part => ({
  id:             "c0000000-0000-0000-0000-000000000001",
  sku:            "HW-ST800-DIAP",
  name:           "ST800 Diaphragm Assembly",
  manufacturer:   "Honeywell",
  sensorType:     "pressure",
  description:    null,
  imageUrl:       null,
  datasheetUrl:   null,
  basePriceCents: 45000,
  stockQuantity:  24,
  leadTimeDays:   5,
  safetyStock:    10,
  uom:            "each",
  weightGrams:    340,
  createdAt:      "2026-01-01T00:00:00.000Z",
  updatedAt:      "2026-01-01T00:00:00.000Z",
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("indexParts", () => {
  let client: ReturnType<typeof makeClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
    retrieveMock.mockResolvedValue({ name: "parts" });
    importMock.mockResolvedValue([{ success: true }, { success: true }]);
  });

  it("returns { total:0, succeeded:0, failed:0 } for empty array", async () => {
    const result = await indexParts(client, []);
    expect(result).toEqual({ total: 0, succeeded: 0, failed: 0 });
    expect(importMock).not.toHaveBeenCalled();
  });

  it("reports correct succeeded/failed counts", async () => {
    importMock.mockResolvedValue([
      { success: true },
      { success: false, error: "bad doc" },
    ]);
    const result = await indexParts(client, [makePart(), makePart({ id: "2" })]);
    expect(result).toEqual({ total: 2, succeeded: 1, failed: 1 });
  });

  it("creates the collection when retrieve throws", async () => {
    retrieveMock.mockRejectedValue(new Error("not found"));
    importMock.mockResolvedValue([{ success: true }]);
    await indexParts(client, [makePart()]);
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("skips collection creation when it already exists", async () => {
    retrieveMock.mockResolvedValue({ name: "parts" });
    importMock.mockResolvedValue([{ success: true }]);
    await indexParts(client, [makePart()]);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("passes upsert action to import", async () => {
    importMock.mockResolvedValue([{ success: true }]);
    await indexParts(client, [makePart()]);
    expect(importMock).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ action: "upsert" }),
    );
  });

  it("omits null description from document", async () => {
    importMock.mockResolvedValue([{ success: true }]);
    await indexParts(client, [makePart({ description: null })]);
    const [docs] = importMock.mock.calls[0] as [Record<string, unknown>[]];
    expect(Object.keys(docs[0]!)).not.toContain("description");
  });

  it("includes non-null description in document", async () => {
    importMock.mockResolvedValue([{ success: true }]);
    await indexParts(client, [makePart({ description: "A test description" })]);
    const [docs] = importMock.mock.calls[0] as [Record<string, unknown>[]];
    expect(docs[0]!["description"]).toBe("A test description");
  });
});

describe("resetPartsCollection", () => {
  let client: ReturnType<typeof makeClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
  });

  it("deletes and recreates the collection", async () => {
    deleteMock.mockResolvedValue({});
    await resetPartsCollection(client);
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("still creates when delete throws (collection did not exist)", async () => {
    deleteMock.mockRejectedValue(new Error("not found"));
    await resetPartsCollection(client);
    expect(createMock).toHaveBeenCalledOnce();
  });
});
