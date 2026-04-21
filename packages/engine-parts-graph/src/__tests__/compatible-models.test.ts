import { describe, it, expect } from "vitest";
import { findCompatibleModels } from "../compatible-models.js";
import { compatibilityRows, modelsMap } from "./fixtures.js";

/**
 * WHAT THESE TESTS VERIFY:
 * The reverse traversal: given a part, which models reference it, and in which bucket.
 * Key scenario: the ST800 diaphragm appears in BOTH the ST800 (exact) and 3051S (equivalent).
 * This is the cross-model equivalent edge that makes the graph interesting.
 */

describe("findCompatibleModels — ST800 diaphragm (cross-model part)", () => {
  const result = findCompatibleModels("part-diaphragm", compatibilityRows, modelsMap);

  it("exact group contains the ST800 model", () => {
    expect(result.exact).toHaveLength(1);
    expect(result.exact[0].model.name).toBe("Honeywell ST800");
  });

  it("equivalent group contains the 3051S model", () => {
    expect(result.equivalent).toHaveLength(1);
    expect(result.equivalent[0].model.name).toBe("Emerson Rosemount 3051S");
  });

  it("equivalent notes are preserved (adapter kit requirement)", () => {
    expect(result.equivalent[0].notes).toBe("Requires mounting adapter kit");
  });

  it("aftermarket group is empty (diaphragm has no aftermarket edges)", () => {
    expect(result.aftermarket).toHaveLength(0);
  });
});

describe("findCompatibleModels — native 3051S diaphragm (single-model part)", () => {
  const result = findCompatibleModels("part-3051-diaphragm", compatibilityRows, modelsMap);

  it("exact group contains only the 3051S model", () => {
    expect(result.exact).toHaveLength(1);
    expect(result.exact[0].model.name).toBe("Emerson Rosemount 3051S");
  });

  it("does not appear on the ST800 model", () => {
    const allModelNames = [...result.exact, ...result.equivalent, ...result.aftermarket].map(
      (cm) => cm.model.name
    );
    expect(allModelNames).not.toContain("Honeywell ST800");
  });
});

describe("findCompatibleModels — aftermarket seal", () => {
  const result = findCompatibleModels("part-aftermarket-seal", compatibilityRows, modelsMap);

  it("aftermarket group contains the ST800 model", () => {
    expect(result.aftermarket).toHaveLength(1);
    expect(result.aftermarket[0].model.name).toBe("Honeywell ST800");
  });

  it("exact and equivalent groups are empty", () => {
    expect(result.exact).toHaveLength(0);
    expect(result.equivalent).toHaveLength(0);
  });
});

describe("findCompatibleModels — edge cases", () => {
  it("unknown part ID returns all empty groups", () => {
    const result = findCompatibleModels("part-does-not-exist", compatibilityRows, modelsMap);
    expect(result.exact).toHaveLength(0);
    expect(result.equivalent).toHaveLength(0);
    expect(result.aftermarket).toHaveLength(0);
  });

  it("compatibility row referencing missing model is silently skipped", () => {
    const brokenRows = [
      ...compatibilityRows,
      { id: "c-broken", modelId: "model-ghost", partId: "part-diaphragm", fitType: "exact" as const, notes: null, createdAt: new Date() },
    ];
    expect(() => findCompatibleModels("part-diaphragm", brokenRows, modelsMap)).not.toThrow();
    const result = findCompatibleModels("part-diaphragm", brokenRows, modelsMap);
    // Still only 1 exact — the ghost model is skipped
    expect(result.exact).toHaveLength(1);
  });
});
