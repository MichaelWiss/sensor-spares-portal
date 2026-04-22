export { createTypesenseClient } from "./client.js";
export type { TypesenseClientConfig } from "./client.js";

export { PARTS_COLLECTION, partsCollectionSchema } from "./schema.js";

export { indexParts, resetPartsCollection } from "./index-parts.js";
export type { IndexResult } from "./index-parts.js";

export { searchParts } from "./search.js";
export type { SearchFilters } from "./search.js";
