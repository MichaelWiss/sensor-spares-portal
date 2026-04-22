/**
 * Typed error hierarchy for the ERPNext adapter.
 * All errors extend ERPNextError so callers can catch the base class
 * or handle specific failure modes individually.
 */

export class ERPNextError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ERPNextError";
  }
}

/** Missing or invalid configuration (ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET). */
export class ERPNextConfigError extends ERPNextError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ERPNextConfigError";
  }
}

/** HTTP 401 / 403 — credentials were rejected by ERPNext. */
export class ERPNextAuthError extends ERPNextError {
  constructor(message: string) {
    super(message, "AUTH_ERROR");
    this.name = "ERPNextAuthError";
  }
}

/** Network failure or non-2xx / non-auth HTTP error. */
export class ERPNextTransportError extends ERPNextError {
  constructor(message: string) {
    super(message, "TRANSPORT_ERROR");
    this.name = "ERPNextTransportError";
  }
}

/** ERPNext response shape did not match the expected structure. */
export class ERPNextParseError extends ERPNextError {
  constructor(message: string) {
    super(message, "PARSE_ERROR");
    this.name = "ERPNextParseError";
  }
}
