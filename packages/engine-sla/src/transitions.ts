import { ORDER_STATUS_TRANSITIONS, SLA_STATUS_TRANSITIONS } from "@repo/shared";
import type { OrderStatus, SlaStatus } from "@repo/shared";

/**
 * WHAT THIS DOES:
 * A state machine is a set of rules that says "from state X, you are only allowed
 * to move to states in this list." These four functions are the GUARDS — the
 * bouncers that check the rules before any status change is applied.
 *
 * WHY THIS MATTERS:
 * Without guards, code anywhere in the system could accidentally write
 * `status = 'shipped'` on a `pending` order. With guards, every transition is
 * checked first. The transition maps live in `@repo/shared` so the same rules
 * apply everywhere — the Edge Functions, the storefront, and any future admin tool.
 *
 * EXAMPLE — what the transition maps look like:
 *   ORDER_STATUS_TRANSITIONS["pending"]   = ["confirmed", "cancelled"]
 *   ORDER_STATUS_TRANSITIONS["shipped"]   = ["delivered"]          ← can't cancel a shipped order
 *   ORDER_STATUS_TRANSITIONS["fulfilled"] = []                     ← no exits, terminal state
 *
 *   SLA_STATUS_TRANSITIONS["on_track"]    = ["warning", "fulfilled"]
 *   SLA_STATUS_TRANSITIONS["breached"]    = ["fulfilled"]          ← can still fulfill after breach
 *   SLA_STATUS_TRANSITIONS["fulfilled"]   = []                     ← terminal
 *
 * USAGE IN THE EDGE FUNCTIONS:
 *   Before writing to the DB:
 *     if (!canTransitionOrder(currentStatus, nextStatus)) throw new Error(...)
 *   This makes invalid state changes impossible at the application level,
 *   complementing the DB constraints.
 */

/** Returns true if moving from `current` to `target` is a legal order transition. */
export function canTransitionOrder(current: OrderStatus, target: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[current].includes(target);
}

/** Returns true if moving from `current` to `target` is a legal SLA transition. */
export function canTransitionSla(current: SlaStatus, target: SlaStatus): boolean {
  return SLA_STATUS_TRANSITIONS[current].includes(target);
}

/** Returns all valid next statuses from the current order status. */
export function getNextOrderStatuses(current: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[current];
}

/** Returns all valid next statuses from the current SLA status. */
export function getNextSlaStatuses(current: SlaStatus): SlaStatus[] {
  return SLA_STATUS_TRANSITIONS[current];
}
