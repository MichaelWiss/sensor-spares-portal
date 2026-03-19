// ─────────────────────────────────────────────
// Sensor Models & Parts
// ─────────────────────────────────────────────

/** A sensor model (e.g. "Honeywell ST800 Pressure Transmitter") */
export interface Model {
  id: string;
  name: string;
  manufacturer: string;
  sensorType: SensorType;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A spare part / SKU that can be ordered */
export interface Part {
  id: string;
  sku: string;
  name: string;
  manufacturer: string;
  sensorType: SensorType;
  description: string | null;
  imageUrl: string | null;
  datasheetUrl: string | null;
  /** Base list price in cents (before contract discounts) */
  basePriceCents: number;
  /** Current stock quantity (synced from ERPNext) */
  stockQuantity: number;
  /** Lead time in business days when out of stock */
  leadTimeDays: number;
  /** Safety stock threshold — triggers reorder when stock falls below */
  safetyStock: number;
  /** Unit of measure (e.g. "each", "pack of 10") */
  uom: string;
  /** Weight in grams (for shipping calculations) */
  weightGrams: number;
  createdAt: string;
  updatedAt: string;
}

export type SensorType =
  | "pressure"
  | "temperature"
  | "flow"
  | "level"
  | "vibration"
  | "humidity"
  | "gas"
  | "proximity";

/** How well a part fits a given model */
export type FitType = "exact" | "equivalent" | "aftermarket";

/** A compatibility edge: links a Model to a Part */
export interface Compatibility {
  id: string;
  modelId: string;
  partId: string;
  fitType: FitType;
  notes: string | null;
}

// ─────────────────────────────────────────────
// Companies, Contracts & Pricing Tiers
// ─────────────────────────────────────────────

/** A buyer organization (factory, plant, maintenance company) */
export interface Company {
  id: string;
  name: string;
  billingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** A contract between us and a buyer company */
export interface Contract {
  id: string;
  companyId: string;
  tier: ContractTierName;
  /** Discount percentage for this tier (e.g. 15 = 15% off list) */
  discountPercent: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContractTierName = "standard" | "silver" | "gold" | "platinum";

/** Volume break thresholds within a contract tier */
export interface ContractTier {
  id: string;
  contractId: string;
  /** Minimum quantity to qualify for this break */
  minQuantity: number;
  /** Additional discount percentage on top of base tier discount */
  additionalDiscountPercent: number;
}

// ─────────────────────────────────────────────
// Orders & Line Items
// ─────────────────────────────────────────────

export interface Order {
  id: string;
  /** Human-readable order number (e.g. "ORD-2026-00142") */
  orderNumber: string;
  companyId: string;
  userId: string;
  status: OrderStatus;
  slaTier: SlaTier;
  /** UTC deadline — order must be fulfilled by this time */
  slaDeadline: string;
  slaStatus: SlaStatus;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  /** All amounts in cents */
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  /** Stripe payment intent ID or invoice ID */
  paymentRef: string | null;
  paymentMethod: PaymentMethod;
  notes: string | null;
  placedAt: string;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"       // just placed, awaiting payment confirmation
  | "confirmed"     // payment confirmed, SLA timer started
  | "picking"       // warehouse is picking items
  | "packed"        // items packed, awaiting label/dispatch
  | "shipped"       // in transit
  | "delivered"     // carrier confirmed delivery
  | "fulfilled"     // order complete, SLA closed
  | "cancelled";    // order cancelled

export type PaymentMethod = "ach" | "invoice_net30" | "card";

export interface OrderLine {
  id: string;
  orderId: string;
  partId: string;
  /** Quantity ordered */
  quantity: number;
  /** Price per unit in cents (after contract discount) */
  unitPriceCents: number;
  /** Line total in cents */
  lineTotalCents: number;
  /** Discount applied to this line (percentage) */
  discountPercent: number;
  /** Current status of this specific line (for partial fulfillment) */
  status: OrderLineStatus;
}

export type OrderLineStatus =
  | "pending"
  | "picking"
  | "packed"
  | "shipped"
  | "delivered";

// ─────────────────────────────────────────────
// SLA (Service Level Agreement)
// ─────────────────────────────────────────────

/** SLA tier selected at checkout — determines fulfillment deadline */
export type SlaTier = "emergency" | "standard" | "economy";

/** Current SLA enforcement state for an order */
export type SlaStatus =
  | "on_track"      // within deadline, no warnings
  | "warning"       // crossed warning threshold (e.g. 90min left)
  | "breach"        // crossed breach threshold (e.g. 110min left)
  | "breached"      // deadline passed without fulfillment
  | "fulfilled";    // order fulfilled within deadline

export type EscalationLevel = "none" | "warning" | "breach" | "critical";

/** A record of an SLA state change (for audit trail) */
export interface SlaEvent {
  id: string;
  orderId: string;
  previousStatus: SlaStatus | null;
  newStatus: SlaStatus;
  /** Who/what triggered this change */
  triggeredBy: "system" | "manual";
  note: string | null;
  occurredAt: string;
}

/** Defines the rules for an SLA tier */
export interface SlaPolicy {
  tier: SlaTier;
  /** Total fulfillment window in minutes */
  fulfillmentWindowMinutes: number;
  /** Minutes remaining when warning fires */
  warningThresholdMinutes: number;
  /** Minutes remaining when breach alert fires */
  breachThresholdMinutes: number;
}

// ─────────────────────────────────────────────
// Shipping & Fulfillment
// ─────────────────────────────────────────────

export type ShippingMethod =
  | "ups_overnight"
  | "ups_ground"
  | "fedex_overnight"
  | "fedex_ground"
  | "usps_priority"
  | "own_courier"     // sub-50mi same-day delivery
  | "pickup";         // customer picks up from warehouse

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string | null;
  shippingMethod: ShippingMethod;
  status: ShipmentStatus;
  /** Tracking label PDF URL (from Shippo or own courier system) */
  labelUrl: string | null;
  /** Shipping cost in cents */
  costCents: number;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentStatus =
  | "pending"         // label created, not yet picked up
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"          // delivery attempt failed
  | "returned";

// ─────────────────────────────────────────────
// Suppliers (from ERPNext)
// ─────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Average lead time in business days */
  leadTimeDays: number;
  /** Whether this supplier is currently active/approved */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Links a supplier to the parts they can provide */
export interface SupplierPart {
  id: string;
  supplierId: string;
  partId: string;
  /** Supplier's cost to us in cents */
  costCents: number;
  /** Supplier's lead time for this specific part */
  leadTimeDays: number;
  /** Is this the preferred/primary supplier for this part? */
  isPrimary: boolean;
}

// ─────────────────────────────────────────────
// Users & Auth
// ─────────────────────────────────────────────

export type UserRole = "buyer" | "admin" | "ops";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Quotes
// ─────────────────────────────────────────────

export interface Quote {
  id: string;
  companyId: string;
  userId: string;
  status: QuoteStatus;
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  /** Pricing is valid until this date */
  expiresAt: string;
  /** If converted, the resulting order ID */
  convertedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "expired" | "converted";

export interface QuoteLine {
  id: string;
  quoteId: string;
  partId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  discountPercent: number;
}
