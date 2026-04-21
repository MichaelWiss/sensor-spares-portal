import { describe, it, expect } from "vitest";
import { evaluateSlaStatus, getEscalationLevel } from "../evaluate.js";

/**
 * WHAT THESE TESTS VERIFY:
 * Boundary conditions at each threshold. The goal is to test the exact
 * minute where the status changes — 1 minute before, exactly at, and 1 minute after.
 * These are the most operationally important tests in the codebase: a wrong
 * boundary means an alert fires too late (or not at all) in production.
 *
 * READING THE EMERGENCY QUIRK IN TESTS:
 * Emergency: breachThreshold=110, warningThreshold=90.
 * Because 110 > 90, there is no time window where remainingMinutes is
 * between 90 and 110 — that range is entirely covered by "breach".
 * So the emergency tier never produces "warning". The tests confirm this.
 */

describe("evaluateSlaStatus — emergency tier (4hr window)", () => {
  // deadline = 14:00 UTC, placed at 10:00 UTC
  const deadline = new Date("2026-03-20T14:00:00Z");

  it("3hr (180min) remaining → on_track", () => {
    const now = new Date("2026-03-20T11:00:00Z"); // 180min left
    expect(evaluateSlaStatus("emergency", deadline, now)).toBe("on_track");
  });

  it("111min remaining → on_track (1 min above breach threshold of 110)", () => {
    const now = new Date(deadline.getTime() - 111 * 60_000);
    expect(evaluateSlaStatus("emergency", deadline, now)).toBe("on_track");
  });

  it("110min remaining → breach (exactly at breach threshold)", () => {
    const now = new Date(deadline.getTime() - 110 * 60_000);
    expect(evaluateSlaStatus("emergency", deadline, now)).toBe("breach");
  });

  it("90min remaining → breach (warning threshold, but breach fires first for emergency)", () => {
    // This confirms the quirk: warning threshold (90) < breach threshold (110),
    // so the breach check fires before the warning check can apply.
    const now = new Date(deadline.getTime() - 90 * 60_000);
    expect(evaluateSlaStatus("emergency", deadline, now)).toBe("breach");
  });

  it("1min remaining → breach", () => {
    const now = new Date(deadline.getTime() - 1 * 60_000);
    expect(evaluateSlaStatus("emergency", deadline, now)).toBe("breach");
  });

  it("0min remaining → breached (exactly at deadline)", () => {
    expect(evaluateSlaStatus("emergency", deadline, deadline)).toBe("breached");
  });

  it("past deadline → breached", () => {
    const now = new Date(deadline.getTime() + 30 * 60_000);
    expect(evaluateSlaStatus("emergency", deadline, now)).toBe("breached");
  });
});

describe("evaluateSlaStatus — standard tier (24hr window)", () => {
  // deadline = 2026-03-21T10:00:00Z (placed 10:00 day before)
  const deadline = new Date("2026-03-21T10:00:00Z");

  it("7hr (420min) remaining → on_track (above 360min warning)", () => {
    const now = new Date("2026-03-21T03:00:00Z");
    expect(evaluateSlaStatus("standard", deadline, now)).toBe("on_track");
  });

  it("361min remaining → on_track (1 min above warning threshold)", () => {
    const now = new Date(deadline.getTime() - 361 * 60_000);
    expect(evaluateSlaStatus("standard", deadline, now)).toBe("on_track");
  });

  it("360min remaining → warning (exactly at warning threshold)", () => {
    const now = new Date(deadline.getTime() - 360 * 60_000);
    expect(evaluateSlaStatus("standard", deadline, now)).toBe("warning");
  });

  it("121min remaining → warning (1 min above breach threshold)", () => {
    const now = new Date(deadline.getTime() - 121 * 60_000);
    expect(evaluateSlaStatus("standard", deadline, now)).toBe("warning");
  });

  it("120min remaining → breach (exactly at breach threshold)", () => {
    const now = new Date(deadline.getTime() - 120 * 60_000);
    expect(evaluateSlaStatus("standard", deadline, now)).toBe("breach");
  });

  it("past deadline → breached", () => {
    const now = new Date(deadline.getTime() + 1 * 60_000);
    expect(evaluateSlaStatus("standard", deadline, now)).toBe("breached");
  });
});

describe("evaluateSlaStatus — economy tier (72hr window)", () => {
  // deadline = 2026-03-23T10:00:00Z
  const deadline = new Date("2026-03-23T10:00:00Z");

  it("13hr (780min) remaining → on_track (above 720min warning)", () => {
    const now = new Date("2026-03-22T21:00:00Z");
    expect(evaluateSlaStatus("economy", deadline, now)).toBe("on_track");
  });

  it("720min remaining → warning (exactly at warning threshold)", () => {
    const now = new Date(deadline.getTime() - 720 * 60_000);
    expect(evaluateSlaStatus("economy", deadline, now)).toBe("warning");
  });

  it("240min remaining → breach (exactly at breach threshold)", () => {
    const now = new Date(deadline.getTime() - 240 * 60_000);
    expect(evaluateSlaStatus("economy", deadline, now)).toBe("breach");
  });

  it("past deadline → breached", () => {
    const now = new Date(deadline.getTime() + 60 * 60_000);
    expect(evaluateSlaStatus("economy", deadline, now)).toBe("breached");
  });
});

describe("getEscalationLevel", () => {
  it("on_track → none (no alert needed)", () => {
    expect(getEscalationLevel("on_track")).toBe("none");
  });
  it("warning → warning (email the fulfillment team)", () => {
    expect(getEscalationLevel("warning")).toBe("warning");
  });
  it("breach → breach (email + Slack the ops manager)", () => {
    expect(getEscalationLevel("breach")).toBe("breach");
  });
  it("breached → critical (email + Slack + phone)", () => {
    expect(getEscalationLevel("breached")).toBe("critical");
  });
  it("fulfilled → none (order is done, no alert)", () => {
    expect(getEscalationLevel("fulfilled")).toBe("none");
  });
});
