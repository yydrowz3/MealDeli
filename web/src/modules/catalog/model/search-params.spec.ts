import { describe, expect, it } from "vitest";

import {
  parseCatalogSearch,
  selectCatalogCategory,
  selectCatalogPage,
  selectCatalogQuery,
  serializeCatalogSearch,
} from "./search-params";

describe("catalog search params", () => {
  it("normalizes empty filters and invalid pages", () => {
    expect(parseCatalogSearch({ query: "   ", page: "-3" })).toEqual({ page: 1 });
    expect(parseCatalogSearch({ page: "0" })).toEqual({ page: 1 });
    expect(parseCatalogSearch({ page: "2.5" })).toEqual({ page: 1 });
  });

  it("makes query and category mutually exclusive", () => {
    expect(parseCatalogSearch({ query: " ramen ", category: "korean", page: "3" })).toEqual({
      query: "ramen",
      page: 3,
    });
    expect(selectCatalogQuery(" sushi ")).toEqual({ query: "sushi", page: 1 });
    expect(selectCatalogCategory("thai")).toEqual({ category: "thai", page: 1 });
    expect(selectCatalogCategory()).toEqual({ page: 1 });
  });

  it("changes pages without dropping the active filter and serializes defaults sparsely", () => {
    const search = selectCatalogPage({ category: "pizza", page: 1 }, 4);
    expect(search).toEqual({ category: "pizza", page: 4 });
    expect(serializeCatalogSearch(search).toString()).toBe("category=pizza&page=4");
    expect(serializeCatalogSearch({ page: 1 }).toString()).toBe("");
  });
});
