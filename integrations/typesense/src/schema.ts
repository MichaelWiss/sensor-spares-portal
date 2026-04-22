/**
 * Typesense collection schema definitions.
 *
 * Collection: "parts"
 *   Searchable fields   : sku, name, manufacturer, description
 *   Filterable fields   : sensorType, manufacturer, stockQuantity
 *   Sortable fields     : basePriceCents, stockQuantity, leadTimeDays
 *
 * Numeric fields use int32/float for efficient filtering and sorting.
 * Optional string fields (description) use optional: true so documents
 * without them still index cleanly.
 */

// CollectionCreateSchema is the correct input type for create() — it lives in
// Collections.js (plural), not Collection.js. CollectionSchema is the response
// type and includes read-only server fields we don't need here.
import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections.js";

export const PARTS_COLLECTION = "parts";

export const partsCollectionSchema: CollectionCreateSchema = {
  name: PARTS_COLLECTION,
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────
    { name: "id",             type: "string" },
    { name: "sku",            type: "string" },

    // ── Search targets ────────────────────────────────────────────────────
    { name: "name",           type: "string" },
    { name: "manufacturer",   type: "string", facet: true },
    { name: "sensorType",     type: "string", facet: true },
    { name: "description",    type: "string", optional: true },

    // ── Numeric — filterable + sortable ───────────────────────────────────
    { name: "basePriceCents", type: "int32"  },
    { name: "stockQuantity",  type: "int32"  },
    { name: "leadTimeDays",   type: "int32"  },
    { name: "weightGrams",    type: "int32"  },

    // ── Additional metadata ───────────────────────────────────────────────
    { name: "uom",            type: "string" },
    { name: "safetyStock",    type: "int32"  },
  ],
  default_sorting_field: "basePriceCents",
};
