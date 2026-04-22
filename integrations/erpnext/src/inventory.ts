/**
 * Inventory transport interface and fetchStockLevels public API.
 *
 * Architecture:
 *   - InventoryTransport is the interface both the mock and live ERPNext
 *     client implement.
 *   - mockTransport is the default transport, seeded from supabase/seed.sql
 *     data so local development and tests need no external credentials.
 *   - setTransport() lets tests (or a future real ERPNext client) swap the
 *     active transport without changing callers of fetchStockLevels.
 */

export interface StockLevel {
  sku: string;
  /** Current stock quantity — 0 means out of stock, not unknown. */
  stockQuantity: number;
  /** Lead time in business days when a reorder is placed. */
  leadTimeDays: number;
}

export interface InventoryTransport {
  fetchLevels(skus: string[]): Promise<StockLevel[]>;
}

// ── Mock transport ────────────────────────────────────────────────────────────
// Values mirror supabase/seed.sql `parts` insert so fixtures stay consistent.
const MOCK_STOCK: Readonly<Record<string, { stockQuantity: number; leadTimeDays: number }>> = {
  "HW-ST800-DIAP": { stockQuantity: 24,  leadTimeDays: 5  },
  "HW-ST800-SEAL": { stockQuantity: 80,  leadTimeDays: 3  },
  "HW-ST800-ELEC": { stockQuantity: 8,   leadTimeDays: 10 },
  "HW-ST800-GSKT": { stockQuantity: 200, leadTimeDays: 2  },
  "EM-3051-DIAP":  { stockQuantity: 15,  leadTimeDays: 7  },
  "EM-3051-ELEC":  { stockQuantity: 5,   leadTimeDays: 12 },
  "EM-3051-MNFLD": { stockQuantity: 40,  leadTimeDays: 3  },
  "GN-PRES-GSKT":  { stockQuantity: 300, leadTimeDays: 1  },
  "EH-RTD-ELEM":   { stockQuantity: 50,  leadTimeDays: 3  },
  "EH-RTD-WELL":   { stockQuantity: 30,  leadTimeDays: 5  },
  "EH-RTD-HEAD":   { stockQuantity: 45,  leadTimeDays: 3  },
  "GN-RTD-WIRE":   { stockQuantity: 120, leadTimeDays: 2  },
};

/** Fixture-backed transport — no network calls, no credentials needed. */
export const mockTransport: InventoryTransport = {
  async fetchLevels(skus: string[]): Promise<StockLevel[]> {
    return skus.flatMap((sku) => {
      const level = MOCK_STOCK[sku];
      return level !== undefined ? [{ sku, ...level }] : [];
    });
  },
};

// ── Active transport (swappable) ──────────────────────────────────────────────
let activeTransport: InventoryTransport = mockTransport;

/**
 * Replace the active transport.
 * Call with `mockTransport` in tests (beforeEach) or with
 * `createERPNextClient()` when real credentials are available.
 */
export function setTransport(transport: InventoryTransport): void {
  activeTransport = transport;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch stock levels for a list of SKUs.
 *
 * - Returns results only for recognised SKUs; unknown SKUs are omitted.
 * - Returns `[]` immediately when `skus` is empty.
 * - Throws typed `ERPNextError` subclasses on transport or parse failures.
 */
export async function fetchStockLevels(skus: string[]): Promise<StockLevel[]> {
  if (skus.length === 0) return [];
  return activeTransport.fetchLevels(skus);
}
