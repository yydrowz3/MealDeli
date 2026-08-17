import { z } from "zod";

import type { CatalogSearch } from "./types";

const optionalFilterSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || undefined : undefined),
  z.string().max(100, "Use 100 characters or fewer.").optional(),
);

const pageSchema = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  return Number(value);
}, z.number().int().positive().safe().catch(1));

export const catalogSearchSchema = z
  .object({
    query: optionalFilterSchema,
    category: optionalFilterSchema,
    page: pageSchema.default(1),
  })
  .transform(({ query, category, page }): CatalogSearch => {
    if (query) return { query, page };
    if (category) return { category, page };
    return { page };
  });

export type CatalogSearchInput =
  | URLSearchParams
  | Record<string, string | number | null | undefined>;

export function parseCatalogSearch(input: CatalogSearchInput): CatalogSearch {
  const values =
    input instanceof URLSearchParams
      ? {
          query: input.get("query"),
          category: input.get("category"),
          page: input.get("page"),
        }
      : input;
  return catalogSearchSchema.parse(values);
}

export function selectCatalogQuery(query: string): CatalogSearch {
  const normalized = query.trim();
  return normalized ? { query: normalized, page: 1 } : { page: 1 };
}

export function selectCatalogCategory(category?: string): CatalogSearch {
  const normalized = category?.trim();
  return normalized ? { category: normalized, page: 1 } : { page: 1 };
}

export function selectCatalogPage(search: CatalogSearch, page: number): CatalogSearch {
  return { ...search, page: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}

export function serializeCatalogSearch(search: CatalogSearch): URLSearchParams {
  const normalized = catalogSearchSchema.parse(search);
  const params = new URLSearchParams();
  if (normalized.query) params.set("query", normalized.query);
  if (normalized.category) params.set("category", normalized.category);
  if (normalized.page > 1) params.set("page", String(normalized.page));
  return params;
}
