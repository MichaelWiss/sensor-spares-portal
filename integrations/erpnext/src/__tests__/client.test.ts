import { describe, it, expect } from "vitest";
import { createERPNextClient } from "../client.js";
import { ERPNextConfigError } from "../errors.js";

describe("createERPNextClient — config validation", () => {
  it("throws ERPNextConfigError when url is missing", () => {
    expect(() =>
      createERPNextClient({ apiKey: "test-key", apiSecret: "test-secret" }),
    ).toThrow(ERPNextConfigError);
  });

  it("throws ERPNextConfigError when apiKey is missing", () => {
    expect(() =>
      createERPNextClient({ url: "http://erp.dev", apiSecret: "test-secret" }),
    ).toThrow(ERPNextConfigError);
  });

  it("throws ERPNextConfigError when apiSecret is missing", () => {
    expect(() =>
      createERPNextClient({ url: "http://erp.dev", apiKey: "test-key" }),
    ).toThrow(ERPNextConfigError);
  });

  it("returns an InventoryTransport when all config is provided", () => {
    const client = createERPNextClient({
      url: "http://erp.dev",
      apiKey: "test-key",
      apiSecret: "test-secret",
    });
    expect(typeof client.fetchLevels).toBe("function");
  });

  it("config error message includes the missing variable name", () => {
    try {
      createERPNextClient({ apiKey: "k", apiSecret: "s" });
    } catch (err) {
      expect(err).toBeInstanceOf(ERPNextConfigError);
      expect((err as Error).message).toMatch(/ERPNEXT_URL/);
    }
  });
});
