import type { Model, Part, Compatibility } from "@repo/shared";

/**
 * WHAT THIS FILE IS:
 * Shared test data for all engine-parts-graph tests.
 * Mirrors the seed data structure (same UUIDs aren't needed — just realistic shapes).
 *
 * Three models, seven parts, nine compatibility edges covering all three fit types
 * and the cross-model equivalent scenario from the real seed data.
 */

// ─── Models ──────────────────────────────────────────────────────────────────

export const modelST800: Model = {
  id: "model-st800",
  name: "Honeywell ST800",
  manufacturer: "Honeywell",
  sensorType: "pressure",
  description: "Smart pressure transmitter",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export const model3051: Model = {
  id: "model-3051",
  name: "Emerson Rosemount 3051S",
  manufacturer: "Emerson",
  sensorType: "pressure",
  description: "Scalable pressure transmitter",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export const modelPT100: Model = {
  id: "model-pt100",
  name: "E+H PT100",
  manufacturer: "Endress+Hauser",
  sensorType: "temperature",
  description: "RTD temperature sensor",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ─── Parts ───────────────────────────────────────────────────────────────────

/** ST800 diaphragm — in stock, exact fit for ST800, equivalent for 3051S */
export const partDiaphragm: Part = {
  id: "part-diaphragm",
  sku: "HW-ST800-DIAP",
  name: "ST800 Diaphragm Assembly",
  manufacturer: "Honeywell",
  sensorType: "pressure",
  basePriceCents: 45000,
  stockQuantity: 12,
  leadTimeDays: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/** ST800 seal — in stock, cheaper than diaphragm */
export const partSeal: Part = {
  id: "part-seal",
  sku: "HW-ST800-SEAL",
  name: "ST800 Process Seal Kit",
  manufacturer: "Honeywell",
  sensorType: "pressure",
  basePriceCents: 12000,
  stockQuantity: 8,
  leadTimeDays: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/** ST800 electronics — out of stock */
export const partElectronics: Part = {
  id: "part-electronics",
  sku: "HW-ST800-ELEC",
  name: "ST800 Electronics Module",
  manufacturer: "Honeywell",
  sensorType: "pressure",
  basePriceCents: 89000,
  stockQuantity: 0,
  leadTimeDays: 14,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/** Aftermarket seal — in stock, cheap */
export const partAftermarketSeal: Part = {
  id: "part-aftermarket-seal",
  sku: "ISD-SEAL-GEN",
  name: "Generic Process Seal (aftermarket)",
  manufacturer: "Industrial Spares Direct",
  sensorType: "pressure",
  basePriceCents: 8500,
  stockQuantity: 50,
  leadTimeDays: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/** Emerson 3051 diaphragm — in stock */
export const part3051Diaphragm: Part = {
  id: "part-3051-diaphragm",
  sku: "EM-3051-DIAP",
  name: "Rosemount 3051S Diaphragm",
  manufacturer: "Emerson",
  sensorType: "pressure",
  basePriceCents: 52000,
  stockQuantity: 3,
  leadTimeDays: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/** PT100 sensor element — temperature, different type entirely */
export const partPT100Element: Part = {
  id: "part-pt100-element",
  sku: "EH-PT100-ELEM",
  name: "PT100 Sensor Element",
  manufacturer: "Endress+Hauser",
  sensorType: "temperature",
  basePriceCents: 18000,
  stockQuantity: 6,
  leadTimeDays: 0,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/** Out-of-stock, expensive exact fit (for sort order testing) */
export const partExpensiveOutOfStock: Part = {
  id: "part-expensive-oos",
  sku: "HW-ST800-XPNS",
  name: "ST800 Premium Housing",
  manufacturer: "Honeywell",
  sensorType: "pressure",
  basePriceCents: 120000,
  stockQuantity: 0,
  leadTimeDays: 21,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ─── Compatibility Edges ──────────────────────────────────────────────────────

export const compatibilityRows: Compatibility[] = [
  // ST800 parts
  { id: "c-1", modelId: "model-st800", partId: "part-diaphragm",       fitType: "exact",       notes: null,                            createdAt: new Date("2026-01-01") },
  { id: "c-2", modelId: "model-st800", partId: "part-seal",            fitType: "exact",       notes: null,                            createdAt: new Date("2026-01-01") },
  { id: "c-3", modelId: "model-st800", partId: "part-electronics",     fitType: "exact",       notes: null,                            createdAt: new Date("2026-01-01") },
  { id: "c-4", modelId: "model-st800", partId: "part-expensive-oos",   fitType: "exact",       notes: null,                            createdAt: new Date("2026-01-01") },
  { id: "c-5", modelId: "model-st800", partId: "part-aftermarket-seal",fitType: "aftermarket", notes: "Verify specs before install",   createdAt: new Date("2026-01-01") },

  // Cross-model: ST800 diaphragm also fits the 3051S (equivalent, needs adapter)
  { id: "c-6", modelId: "model-3051",  partId: "part-diaphragm",       fitType: "equivalent",  notes: "Requires mounting adapter kit", createdAt: new Date("2026-01-01") },
  // 3051S native part
  { id: "c-7", modelId: "model-3051",  partId: "part-3051-diaphragm",  fitType: "exact",       notes: null,                            createdAt: new Date("2026-01-01") },

  // PT100 temperature sensor — completely separate
  { id: "c-8", modelId: "model-pt100", partId: "part-pt100-element",   fitType: "exact",       notes: null,                            createdAt: new Date("2026-01-01") },
];

// ─── Convenience Maps ─────────────────────────────────────────────────────────

export const partsMap = new Map<string, Part>([
  ["part-diaphragm",        partDiaphragm],
  ["part-seal",             partSeal],
  ["part-electronics",      partElectronics],
  ["part-aftermarket-seal", partAftermarketSeal],
  ["part-3051-diaphragm",   part3051Diaphragm],
  ["part-pt100-element",    partPT100Element],
  ["part-expensive-oos",    partExpensiveOutOfStock],
]);

export const modelsMap = new Map<string, Model>([
  ["model-st800",  modelST800],
  ["model-3051",   model3051],
  ["model-pt100",  modelPT100],
]);
