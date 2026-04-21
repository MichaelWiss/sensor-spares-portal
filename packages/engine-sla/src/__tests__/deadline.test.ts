import { describe, it, expect } from "vitest";
import { calculateDeadline, getTimeRemaining } from "../deadline.js";

/**
 * WHAT THESE TESTS VERIFY:
 * That deadline arithmetic is exact for all three SLA tiers.
 * If calculateDeadline is off by even one minute, every downstream threshold
 * comparison (warning, breach) will also be off — possibly causing missed alerts.
 */

describe("calculateDeadline", () => {
  const placed = new Date("2026-03-20T10:00:00Z");

  it("emergency: 240min (4hr) window → deadline at 14:00", () => {
    expect(calculateDeadline("emergency", placed)).toEqual(new Date("2026-03-20T14:00:00Z"));
  });

  it("standard: 1440min (24hr) window → deadline next day at 10:00", () => {
    expect(calculateDeadline("standard", placed)).toEqual(new Date("2026-03-21T10:00:00Z"));
  });

  it("economy: 4320min (72hr) window → deadline 3 days later at 10:00", () => {
    expect(calculateDeadline("economy", placed)).toEqual(new Date("2026-03-23T10:00:00Z"));
  });
});

describe("getTimeRemaining", () => {
  it("2hr remaining → 120 minutes, not overdue", () => {
    const deadline = new Date("2026-03-20T14:00:00Z");
    const now = new Date("2026-03-20T12:00:00Z");
    expect(getTimeRemaining(deadline, now)).toEqual({ remainingMinutes: 120, isOverdue: false });
  });

  it("exactly at deadline → 0 minutes, overdue", () => {
    const deadline = new Date("2026-03-20T14:00:00Z");
    const now = new Date("2026-03-20T14:00:00Z");
    // Math.floor((0) / 60_000) = 0, which is <= 0
    expect(getTimeRemaining(deadline, now)).toEqual({ remainingMinutes: 0, isOverdue: true });
  });

  it("30min past deadline → -30 minutes, overdue", () => {
    const deadline = new Date("2026-03-20T14:00:00Z");
    const now = new Date("2026-03-20T14:30:00Z");
    expect(getTimeRemaining(deadline, now)).toEqual({ remainingMinutes: -30, isOverdue: true });
  });

  it("uses floor: 89.9min remaining rounds down to 89 (conservative)", () => {
    const deadline = new Date("2026-03-20T14:00:00Z");
    // 89min 59sec remaining = 5399 seconds = 89.983 minutes → floor → 89
    const now = new Date(deadline.getTime() - (89 * 60_000 + 59 * 1000));
    const result = getTimeRemaining(deadline, now);
    expect(result.remainingMinutes).toBe(89);
    expect(result.isOverdue).toBe(false);
  });
});
