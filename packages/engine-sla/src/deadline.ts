import { SLA_POLICIES } from "@repo/shared";
import type { SlaTier } from "@repo/shared";

const MS_PER_MINUTE = 60_000;

/**
 * WHAT THIS DOES:
 * When a buyer places an order and picks an SLA tier (emergency / standard / economy),
 * we need to know the exact moment by which the order must be fulfilled.
 * This function takes "when was the order placed" and adds the policy's
 * fulfillment window to produce that deadline Date.
 *
 * WHY IT MATTERS:
 * Every downstream decision — whether to alert ops, whether to escalate to a
 * manager, whether a breach has occurred — is calculated relative to this deadline.
 * Get the deadline wrong and the whole SLA system is off.
 *
 * WHY PURE JS DATE MATH (not a library):
 * Date.getTime() returns milliseconds since epoch — a plain integer.
 * Adding minutes × 60_000 is exact integer arithmetic. No timezone ambiguity,
 * no DST surprises, no dependency on a date library.
 */
export function calculateDeadline(slaTier: SlaTier, placedAt: Date): Date {
  const policy = SLA_POLICIES[slaTier];
  return new Date(placedAt.getTime() + policy.fulfillmentWindowMinutes * MS_PER_MINUTE);
}

/**
 * WHAT THIS DOES:
 * Given a deadline and the current time, calculates how many whole minutes
 * remain and whether the deadline has already passed.
 *
 * WHY INTEGER MINUTES:
 * The SLA policies define thresholds in whole minutes (90min, 110min, 360min...).
 * Using Math.floor ensures we never round up — if 89.9 minutes remain, that is
 * still 89, which keeps the threshold comparisons conservative (alerts fire earlier,
 * not later).
 */
export function getTimeRemaining(deadline: Date, now: Date): {
  remainingMinutes: number;
  isOverdue: boolean;
} {
  const remainingMinutes = Math.floor((deadline.getTime() - now.getTime()) / MS_PER_MINUTE);
  return { remainingMinutes, isOverdue: remainingMinutes <= 0 };
}
