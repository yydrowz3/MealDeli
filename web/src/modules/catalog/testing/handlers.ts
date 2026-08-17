import { graphql, HttpResponse, type RequestHandler } from "msw";

import type { CategorySummary, RestaurantDetail, RestaurantSummary } from "../model/types";
import {
  buildCategory,
  buildRestaurant,
  buildRestaurantDetail,
  dishToGraphql,
  restaurantToGraphql,
} from "./fixtures";

export type CatalogHandlerOverrides = {
  categories?: readonly CategorySummary[];
  restaurants?: readonly RestaurantSummary[];
  restaurant?: RestaurantDetail | null;
  errorOperation?:
    | "CatalogAllCategories"
    | "CatalogRestaurants"
    | "CatalogCategory"
    | "CatalogSearchRestaurants"
    | "CatalogRestaurant";
  malformedOperation?: CatalogHandlerOverrides["errorOperation"];
};

export function createCatalogHandlers(overrides: CatalogHandlerOverrides = {}): RequestHandler[] {
  const categories = overrides.categories ?? [buildCategory()];
  const restaurants = overrides.restaurants ?? [buildRestaurant()];
  const restaurant =
    overrides.restaurant === undefined ? buildRestaurantDetail() : overrides.restaurant;

  const responseFor = (
    operation: NonNullable<CatalogHandlerOverrides["errorOperation"]>,
    data: Record<string, unknown>,
  ) => {
    if (overrides.errorOperation === operation) {
      return HttpResponse.json<{ errors: { message: string }[] }>({
        errors: [{ message: "Catalog unavailable" }],
      });
    }
    if (overrides.malformedOperation === operation) {
      return HttpResponse.json<{ data: Record<string, unknown> }>({ data: { broken: true } });
    }
    return HttpResponse.json<{ data: Record<string, unknown> }>({ data });
  };

  const pageOutput = {
    __typename: "RestaurantsOutput",
    ok: true,
    error: null,
    totalPages: restaurants.length ? 1 : 0,
    totalResults: restaurants.length,
    restaurants: restaurants.map(restaurantToGraphql),
  };

  return [
    graphql.query("CatalogAllCategories", () =>
      responseFor("CatalogAllCategories", {
        allCategory: {
          __typename: "AllCategoriesOutput",
          ok: true,
          error: null,
          categories: categories.map((category) => ({ __typename: "Category", ...category })),
        },
      }),
    ),
    graphql.query("CatalogRestaurants", () =>
      responseFor("CatalogRestaurants", { restaurants: pageOutput }),
    ),
    graphql.query("CatalogCategory", () =>
      responseFor("CatalogCategory", { category: { ...pageOutput, __typename: "CategoryOutput" } }),
    ),
    graphql.query("CatalogSearchRestaurants", () =>
      responseFor("CatalogSearchRestaurants", {
        searchRestaurant: { ...pageOutput, __typename: "SearchRestaurantOutput" },
      }),
    ),
    graphql.query("CatalogRestaurant", () =>
      responseFor("CatalogRestaurant", {
        restaurant: {
          __typename: "RestaurantOutput",
          ok: restaurant !== null,
          error: restaurant ? null : "Restaurant not found.",
          restaurant: restaurant
            ? {
                ...restaurantToGraphql(restaurant),
                dishes: restaurant.dishes.map(dishToGraphql),
              }
            : null,
        },
      }),
    ),
  ];
}
