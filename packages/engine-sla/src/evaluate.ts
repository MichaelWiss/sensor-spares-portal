import { SLA_POLICIES } from "@repo/shared";
import type { SlaTier, SlaStatus, EscalationLevel } from "@repo/shared";
import { getTimeRemaining } from "./deadline.js";

/**
 * WHAT THIS DOES:
 * This is the core decision function of the SLA engine. Given an order's tier,
 * its deadline, and the current time — it answers: "what should the SLA status
 * be RIGHT NOW?"
 *
 * The sla-check Edge Function calls this every 60 seconds for every active order.
 * If the returned status differs from what's stored in the database, the function
 * triggers a transition and sends an alert.
 *
 * WHY "DOES NOT RETURN FULFILLED":
 * `fulfilled` is not a time-based state — it happens when a human (or the order
 * webhook) explicitly marks the order as fulfilled. This function only answers
 * "how close are we to a breach?" not "is the order done?" Those are separate
 * concerns with separate triggers.
 *
 * THE EMERGENCY TIER QUIRK:
 * Emergency: fulfillmentWindow=240min, warningThreshold=90min, breachThreshold=110min.
 * Since 110 > 90, the breach threshold fires BEFORE the warning threshold as time
 * runs out. An emergency order goes: on_track → breach → breached. It SKIPS warning.
 * This is intentional — emergency orders escalate fast with no intermediate state.
 *
 * Standard: warning@360min, breach@120min → on_track → warning → breach → breached (full path)
 * Economy:  warning@720min, breach@240min → on_track → warning → breach → breached (full path)
 */
export function evaluateSlaStatus(slaTier: SlaTier, deadline: Date, now: Date): SlaStatus {
  const { remainingMinutes } = getTimeRemaining(deadline, now);
  const policy = SLA_POLICIES[slaTier];

  if (remainingMinutes <= 0) return "breached";
  if (remainingMinutes <= policy.breachThresholdMinutes) return "breach";
  if (remainingMinutes <= policy.warningThresholdMinutes) return "warning";
  return "on_track";
}

/**
 * WHAT THIS DOES:
 * Maps an SLA status to an escalation level. The escalation level tells the
 * notification system WHO to alert and HOW urgently.
 *
 * WHY A SEPARATE MAPPING:
 * SLA statuses describe the order's time state. Escalation levels describe
 * the notification response. Keeping them separate means you can change the
 * alerting policy (e.g. "on_track should also ping Slack") without touching
 * the SLA evaluation logic.
 *
 * EscalationLevel values:
 *   none     → no alert needed
 *   warning  → email the fulfillment team
 *   breach   → email + Slack the ops manager
 *   critical → email + Slack + phone call to on-call
 */
export function getEscalationLevel(slaStatus: SlaStatus): EscalationLevel {
  switch (slaStatus) {
    case "on_track":  return "none";
    case "warning":   return "warning";
    case "breach":    return "breach";
    case "breached":  return "critical";
    case "fulfilled": return "none";
  }
}
