import type { Compatibility, Model, FitType } from "@repo/shared";

export interface CompatibleModel {
  model: Model;
  fitType: FitType;
  notes: string | null;
}

export interface GroupedCompatibleModels {
  exact: CompatibleModel[];
  equivalent: CompatibleModel[];
  aftermarket: CompatibleModel[];
}

/**
 * WHAT THIS DOES:
 * The reverse of findCompatibleParts. A buyer browsing a specific part (e.g.
 * the ST800 Diaphragm Assembly) needs to know: "which sensor models will this
 * fit?" This walks the same compatibility graph in the opposite direction.
 *
 * WHY THIS EXISTS SEPARATELY:
 * The part detail page is a different user journey from the model detail page.
 * On the model page, you start with a sensor and find parts.
 * On the part page, you start with a part and confirm it fits your sensor.
 * Both use the same underlying graph — just traversed in different directions.
 *
 * REAL EXAMPLE FROM SEED DATA:
 * Part HW-ST800-DIAP (ST800 Diaphragm Assembly) has two compatibility edges:
 *   - model b...0001 (Honeywell ST800) → fit_type: exact
 *   - model b...0002 (Emerson 3051S)  → fit_type: equivalent (with adapter note)
 * A buyer looking at this part sees both models listed — confirms it fits their
 * specific sensor before adding to cart.
 *
 * INPUTS:
 *   partId            — the UUID of the part being looked up
 *   compatibilityRows — ALL compatibility rows from the DB (same pre-fetched set)
 *   modelsMap         — Map<modelId, Model> built from the models table
 *
 * OUTPUT:
 *   GroupedCompatibleModels — three arrays (no sort needed: model lists are short)
 */
export function findCompatibleModels(
  partId: string,
  compatibilityRows: Compatibility[],
  modelsMap: Map<string, Model>
): GroupedCompatibleModels {
  const groups: GroupedCompatibleModels = { exact: [], equivalent: [], aftermarket: [] };

  for (const row of compatibilityRows) {
    if (row.partId !== partId) continue;
    const model = modelsMap.get(row.modelId);
    if (!model) continue;
    groups[row.fitType].push({ model, fitType: row.fitType, notes: row.notes ?? null });
  }

  return groups;
}
