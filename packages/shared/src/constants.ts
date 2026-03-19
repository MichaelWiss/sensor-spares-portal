import type { SlaPolicy, SlaTier, ContractTierName, OrderStatus, SlaStatus, ShippingMethod } from "./types.js";

// ─────────────────────────────────────────────
// SLA Policies
// ─────────────────────────────────────────────

/**
 * SLA policy definitions for each tier.
 * These drive the SLA engine's deadline calculation and alert thresholds.
 */
export const SLA_POLICIES: Record<SlaTier, SlaPolicy> = {
  emergency: {
    tier: "emergency",
    fulfillmentWindowMinutes: 240,       // 4 hours
    warningThresholdMinutes: 90,         // alert ops at 90min remaining
    breachThresholdMinutes: 110,         // escalation at 110min remaining
  },
  standard: {
    tier: "standard",
    fulfillmentWindowMinutes: 1440,      // 24 hours
    warningThresholdMinutes: 360,        // alert at 6hr remaining
    breachThresholdMinutes: 120,         // escalation at 2hr remaining
  },
  economy: {
    tier: "economy",
    fulfillmentWindowMinutes: 4320,      // 72 hours
    warningThresholdMinutes: 720,        // alert at 12hr remaining
    breachThresholdMinutes: 240,         // escalation at 4hr remaining
  },
};

/** How often the SLA check edge function polls (in seconds) */
export const SLA_POLL_INTERVAL_SECONDS = 60;

// ─────────────────────────────────────────────
// Contract Tier Discounts
// ─────────────────────────────────────────────

/**
 * Base discount percentage per contract tier.
 * Volume breaks (in ContractTier records) stack on top of these.
 */
export const CONTRACT_TIER_DISCOUNTS: Record<ContractTierName, number> = {
  standard: 0,
  silver: 8,
  gold: 15,
  platinum: 22,
};

/** Display labels for contract tiers */
export const CONTRACT_TIER_LABELS: Record<ContractTierName, string> = {
  standard: "Standard",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

/**
 * Volume break thresholds (quantity → additional discount %).
 * Applied on top of the base tier discount.
 */
export const VOLUME_BREAKS = [
  { minQuantity: 10, additionalDiscountPercent: 2 },
  { minQuantity: 50, additionalDiscountPercent: 5 },
  { minQuantity: 100, additionalDiscountPercent: 8 },
] as const;

// ─────────────────────────────────────────────
// Order Status Flow
// ─────────────────────────────────────────────

/**
 * Valid status transitions for orders.
 * Key = current status, value = array of statuses it can move to.
 * This is the state machine that governs the order lifecycle.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["picking", "cancelled"],
  picking:   ["packed", "cancelled"],
  packed:    ["shipped", "cancelled"],
  shipped:   ["delivered"],
  delivered: ["fulfilled"],
  fulfilled: [],
  cancelled: [],
};

/** Human-readable labels for order statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  picking:   "Picking",
  packed:    "Packed",
  shipped:   "Shipped",
  delivered: "Delivered",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

// ─────────────────────────────────────────────
// SLA Status Flow
// ─────────────────────────────────────────────

/** Valid SLA status transitions */
export const SLA_STATUS_TRANSITIONS: Record<SlaStatus, SlaStatus[]> = {
  on_track:  ["warning", "fulfilled"],
  warning:   ["breach", "fulfilled"],
  breach:    ["breached", "fulfilled"],
  breached:  ["fulfilled"],              // can still fulfill after breach
  fulfilled: [],
};

export const SLA_STATUS_LABELS: Record<SlaStatus, string> = {
  on_track:  "On Track",
  warning:   "Warning",
  breach:    "Breach Alert",
  breached:  "SLA Breached",
  fulfilled: "Fulfilled",
};

// ─────────────────────────────────────────────
// Shipping
// ─────────────────────────────────────────────

/** Own courier service configuration */
export const OWN_COURIER = {
  maxRadiusMiles: 50,
  flatRateCents: 8000,                   // $80.00
  estimatedDeliveryMinutes: 120,         // 2 hours
  dispatchTimeoutMinutes: 30,            // fallback to overnight if no courier in 30min
} as const;

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  ups_overnight:   "UPS Overnight",
  ups_ground:      "UPS Ground",
  fedex_overnight: "FedEx Overnight",
  fedex_ground:    "FedEx Ground",
  usps_priority:   "USPS Priority",
  own_courier:     "Same-Day Courier",
  pickup:          "Warehouse Pickup",
};

// ─────────────────────────────────────────────
// Quotes
// ─────────────────────────────────────────────

/** Number of days a quote's pricing remains valid */
export const QUOTE_VALIDITY_DAYS = 7;

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
