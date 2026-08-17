import { describe, expect, it } from "vitest";

import {
  adaptCategoriesOutput,
  adaptCategory,
  adaptDish,
  adaptRestaurantDetail,
  adaptRestaurantOutput,
  adaptRestaurantPageOutput,
  adaptRestaurantSummary,
  CatalogResponseError,
} from "./catalog-adapter";

describe("catalog adapter", () => {
  it("safely maps nullable category fields", () => {
    expect(
      adaptCategory({
        id: "cat",
        name: "Korean",
        slug: "korean",
        image: null,
        restaurantCount: null,
      }),
    ).toEqual({ id: "cat", name: "Korean", slug: "korean", image: null, restaurantCount: 0 });
    expect(
      adaptRestaurantSummary({
        id: "restaurant",
        name: "Seoul Kitchen",
        address: "Market Street",
        image: null,
        promotedUntil: null,
        categoryId: "cat",
        category: null,
      }).category,
    ).toEqual({ id: "cat", name: "Uncategorized", slug: "" });
  });

  it("maps Dish options and keeps cents as integers", () => {
    const dish = adaptDish({
      id: "dish",
      restaurantId: "restaurant",
      name: "Bibimbap",
      description: "Rice bowl",
      priceMinor: 1299,
      image: undefined,
      options: [
        {
          id: "option",
          name: "Heat",
          minSelections: 1,
          maxSelections: 1,
          choices: [{ id: "choice", name: "Hot", extraMinor: 150 }],
        },
      ],
    });
    expect(dish.priceMinor).toBe(1299);
    expect(dish.options[0]?.choices[0]?.extraMinor).toBe(150);
  });

  it("rejects fractional cents and invalid option bounds", () => {
    expect(() =>
      adaptDish({
        id: "dish",
        restaurantId: "restaurant",
        name: "Soup",
        description: "Soup",
        priceMinor: 12.5,
        image: null,
        options: [],
      }),
    ).toThrow(CatalogResponseError);
    expect(() =>
      adaptDish({
        id: "dish",
        restaurantId: "restaurant",
        name: "Soup",
        description: "Soup",
        priceMinor: 1200,
        image: null,
        options: [{ id: "option", name: "Size", minSelections: 2, maxSelections: 1, choices: [] }],
      }),
    ).toThrow(CatalogResponseError);
  });

  it("adapts nullable detail, categories, and pagination collections", () => {
    const summary = {
      id: "restaurant",
      name: "Seoul Kitchen",
      address: "Market Street",
      categoryId: "cat",
      category: { id: "cat", name: "Korean", slug: "korean" },
    };
    expect(adaptRestaurantDetail({ ...summary, dishes: null }).dishes).toEqual([]);
    expect(
      adaptCategoriesOutput({
        ok: true,
        categories: [{ id: "cat", name: "Korean", slug: "korean" }],
      }),
    ).toHaveLength(1);
    expect(adaptCategoriesOutput({ ok: true, categories: null })).toEqual([]);
    expect(adaptRestaurantPageOutput({ ok: true, restaurants: null }, 3)).toEqual({
      items: [],
      page: 3,
      totalPages: 0,
      totalResults: 0,
    });
    expect(
      adaptRestaurantPageOutput(
        { ok: true, restaurants: [summary], totalPages: 2, totalResults: 10 },
        1,
      ),
    ).toMatchObject({ page: 1, totalPages: 2, totalResults: 10 });
  });

  it("preserves detail not-found semantics and rejects other server failures", () => {
    expect(
      adaptRestaurantOutput({
        ok: false,
        error: "Restaurant not found",
        restaurant: null,
      }),
    ).toBeNull();
    expect(adaptRestaurantOutput({ ok: true, restaurant: null })).toBeNull();
    expect(() =>
      adaptRestaurantOutput({ ok: false, error: "Permission denied", restaurant: null }),
    ).toThrow("Permission denied");
    expect(() => adaptCategoriesOutput({ ok: false, error: null, categories: [] })).toThrow(
      "The catalog request failed.",
    );
    expect(() => adaptRestaurantPageOutput({ ok: false, error: "Offline" }, 1)).toThrow(
      "Offline",
    );
  });

  it("rejects malformed collection and detail response shapes", () => {
    expect(() => adaptCategory({ id: "", name: "", slug: "" })).toThrow(
      CatalogResponseError,
    );
    expect(() => adaptCategoriesOutput({ ok: true, categories: "bad" })).toThrow(
      "Malformed categories response.",
    );
    expect(() => adaptRestaurantPageOutput({ ok: true, totalPages: -1 }, 1)).toThrow(
      "Malformed restaurant page response.",
    );
    expect(() => adaptRestaurantOutput({ ok: true, restaurant: { id: "bad" } })).toThrow(
      "Malformed restaurant detail response.",
    );
  });
});
