// Types
export type {
  // Models & Parts
  Model,
  Part,
  SensorType,
  FitType,
  Compatibility,

  // Companies & Contracts
  Company,
  Address,
  Contract,
  ContractTierName,
  ContractTier,

  // Orders
  Order,
  OrderStatus,
  PaymentMethod,
  OrderLine,
  OrderLineStatus,

  // SLA
  SlaTier,
  SlaStatus,
  EscalationLevel,
  SlaEvent,
  SlaPolicy,

  // Shipping
  ShippingMethod,
  Shipment,
  ShipmentStatus,

  // Suppliers
  Supplier,
  SupplierPart,

  // Users
  UserRole,
  UserProfile,

  // Quotes
  Quote,
  QuoteStatus,
  QuoteLine,
} from "./types.js";

// Constants
export {
  // SLA
  SLA_POLICIES,
  SLA_POLL_INTERVAL_SECONDS,

  // Pricing
  CONTRACT_TIER_DISCOUNTS,
  CONTRACT_TIER_LABELS,
  VOLUME_BREAKS,

  // Order lifecycle
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,

  // SLA lifecycle
  SLA_STATUS_TRANSITIONS,
  SLA_STATUS_LABELS,

  // Shipping
  OWN_COURIER,
  SHIPPING_METHOD_LABELS,

  // Quotes
  QUOTE_VALIDITY_DAYS,

  // Pagination
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./constants.js";
