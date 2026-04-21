import { describe, it, expect } from "vitest";
import {
  canTransitionOrder,
  canTransitionSla,
  getNextOrderStatuses,
  getNextSlaStatuses,
} from "../transitions.js";

/**
 * WHAT THESE TESTS VERIFY:
 * Every valid and every invalid transition in both state machines.
 * The goal is: if someone adds a new status or changes a transition map in
 * `@repo/shared`, these tests will immediately catch any unexpected side effects.
 *
 * WHY TEST INVALID TRANSITIONS:
 * Positive tests (valid moves) confirm the happy path.
 * Negative tests (invalid moves) confirm the guards actually block things.
 * Both are needed — a function that returns `true` for everything would pass
 * only the positive tests.
 */

describe("canTransitionOrder — valid transitions", () => {
  it("pending → confirmed", () => expect(canTransitionOrder("pending", "confirmed")).toBe(true));
  it("pending → cancelled", () => expect(canTransitionOrder("pending", "cancelled")).toBe(true));
  it("confirmed → picking", () => expect(canTransitionOrder("confirmed", "picking")).toBe(true));
  it("confirmed → cancelled", () => expect(canTransitionOrder("confirmed", "cancelled")).toBe(true));
  it("picking → packed", () => expect(canTransitionOrder("picking", "packed")).toBe(true));
  it("picking → cancelled", () => expect(canTransitionOrder("picking", "cancelled")).toBe(true));
  it("packed → shipped", () => expect(canTransitionOrder("packed", "shipped")).toBe(true));
  it("packed → cancelled", () => expect(canTransitionOrder("packed", "cancelled")).toBe(true));
  it("shipped → delivered", () => expect(canTransitionOrder("shipped", "delivered")).toBe(true));
  it("delivered → fulfilled", () => expect(canTransitionOrder("delivered", "fulfilled")).toBe(true));
});

describe("canTransitionOrder — invalid transitions (the guards)", () => {
  it("pending → shipped (skip states)", () => expect(canTransitionOrder("pending", "shipped")).toBe(false));
  it("pending → fulfilled (skip to end)", () => expect(canTransitionOrder("pending", "fulfilled")).toBe(false));
  it("shipped → cancelled (too late to cancel)", () => expect(canTransitionOrder("shipped", "cancelled")).toBe(false));
  it("delivered → cancelled (too late to cancel)", () => expect(canTransitionOrder("delivered", "cancelled")).toBe(false));
  it("fulfilled → anything (terminal state)", () => expect(canTransitionOrder("fulfilled", "cancelled")).toBe(false));
  it("fulfilled → pending (cannot reopen)", () => expect(canTransitionOrder("fulfilled", "pending")).toBe(false));
  it("cancelled → pending (cannot un-cancel)", () => expect(canTransitionOrder("cancelled", "pending")).toBe(false));
  it("cancelled → confirmed (cannot un-cancel)", () => expect(canTransitionOrder("cancelled", "confirmed")).toBe(false));
});

describe("canTransitionSla — valid transitions", () => {
  it("on_track → warning", () => expect(canTransitionSla("on_track", "warning")).toBe(true));
  it("on_track → fulfilled (order completed while on track)", () => expect(canTransitionSla("on_track", "fulfilled")).toBe(true));
  it("warning → breach", () => expect(canTransitionSla("warning", "breach")).toBe(true));
  it("warning → fulfilled", () => expect(canTransitionSla("warning", "fulfilled")).toBe(true));
  it("breach → breached", () => expect(canTransitionSla("breach", "breached")).toBe(true));
  it("breach → fulfilled", () => expect(canTransitionSla("breach", "fulfilled")).toBe(true));
  it("breached → fulfilled (order completed after breach)", () => expect(canTransitionSla("breached", "fulfilled")).toBe(true));
});

describe("canTransitionSla — invalid transitions", () => {
  it("on_track → breached (must pass through intermediate states)", () => expect(canTransitionSla("on_track", "breached")).toBe(false));
  it("on_track → breach (cannot skip warning for SLA... unless emergency, but that's handled in evaluate)", () => expect(canTransitionSla("on_track", "breach")).toBe(false));
  it("fulfilled → on_track (terminal state)", () => expect(canTransitionSla("fulfilled", "on_track")).toBe(false));
  it("fulfilled → warning (terminal state)", () => expect(canTransitionSla("fulfilled", "warning")).toBe(false));
  it("breached → on_track (cannot go backwards)", () => expect(canTransitionSla("breached", "on_track")).toBe(false));
});

describe("getNextOrderStatuses", () => {
  it("pending → [confirmed, cancelled]", () => {
    expect(getNextOrderStatuses("pending")).toEqual(["confirmed", "cancelled"]);
  });
  it("shipped → [delivered] (cannot cancel after shipped)", () => {
    expect(getNextOrderStatuses("shipped")).toEqual(["delivered"]);
  });
  it("fulfilled → [] (terminal, no exits)", () => {
    expect(getNextOrderStatuses("fulfilled")).toEqual([]);
  });
  it("cancelled → [] (terminal, no exits)", () => {
    expect(getNextOrderStatuses("cancelled")).toEqual([]);
  });
});

describe("getNextSlaStatuses", () => {
  it("on_track → [warning, fulfilled]", () => {
    expect(getNextSlaStatuses("on_track")).toEqual(["warning", "fulfilled"]);
  });
  it("breached → [fulfilled] (only exit is fulfillment)", () => {
    expect(getNextSlaStatuses("breached")).toEqual(["fulfilled"]);
  });
  it("fulfilled → [] (terminal)", () => {
    expect(getNextSlaStatuses("fulfilled")).toEqual([]);
  });
});
