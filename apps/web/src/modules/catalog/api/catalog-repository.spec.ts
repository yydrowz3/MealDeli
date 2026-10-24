import { InMemoryCache } from "@apollo/client";
import { print } from "graphql";
import { describe, expect, it, vi } from "vitest";

import { CatalogRestaurantsDocument } from "../../../gql/graphql";
import { buildRestaurant, restaurantToGraphql } from "../testing/fixtures";
import { catalogTypePolicies } from "./cache-policies";
import { createCatalogRepository } from "./catalog-repository";

const rawRestaurant = restaurantToGraphql(buildRestaurant());

function pageData(root: "restaurants" | "category" | "searchRestaurant") {
  return {
    [root]: {
      __typename: `${root}Output`,
      ok: true,
      error: null,
      totalPages: 4,
      totalResults: 50,
      restaurants: [rawRestaurant],
    },
  };
}

describe("catalog repository", () => {
  it("uses the generated categories document and unmasks fragment data", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        data: {
          allCategory: {
            __typename: "AllCategoriesOutput",
            ok: true,
            error: null,
            categories: [
              {
                __typename: "Category",
                id: "category-korean",
                name: "Korean",
                slug: "korean",
                image: null,
                restaurantCount: null,
              },
            ],
          },
        },
      }),
    };

    const result = await createCatalogRepository(client).getCategories();
    expect(result).toEqual([
      {
        id: "category-korean",
        name: "Korean",
        slug: "korean",
        image: null,
        restaurantCount: 0,
      },
    ]);
    expect(print(client.query.mock.calls[0]?.[0].query)).toContain("query CatalogAllCategories");
  });

  it.each([
    [{ page: 2 }, "CatalogRestaurants", { input: { page: 2 } }, "restaurants"],
    [
      { query: "ramen", page: 3 },
      "CatalogSearchRestaurants",
      { input: { query: "ramen", page: 3 } },
      "searchRestaurant",
    ],
    [
      { category: "korean", page: 4 },
      "CatalogCategory",
      { input: { slug: "korean", page: 4 } },
      "category",
    ],
  ] as const)(
    "chooses the operation and variables for %o",
    async (search, operation, variables, root) => {
      const client = {
        query: vi.fn().mockImplementation(({ query }) => {
          expect(print(query)).toContain(`query ${operation}`);
          return Promise.resolve({ data: pageData(root) });
        }),
      };
      const repository = createCatalogRepository(client);
      const result = await repository.getRestaurants(search);
      expect(client.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables, fetchPolicy: "network-only" }),
      );
      expect(result.page).toBe(search.page);
      expect(result.items[0]?.name).toBe("Seoul Kitchen");
    },
  );

  it("isolates numbered pages in Apollo cache", () => {
    const cache = new InMemoryCache({ typePolicies: catalogTypePolicies });
    const makeResult = (id: string, name: string) => ({
      restaurants: {
        __typename: "RestaurantsOutput" as const,
        ok: true,
        error: null,
        totalPages: 2,
        totalResults: 2,
        restaurants: [restaurantToGraphql(buildRestaurant({ id, name }))],
      },
    });
    cache.writeQuery({
      query: CatalogRestaurantsDocument,
      variables: { input: { page: 1 } },
      data: makeResult("restaurant-1", "First page"),
    });
    cache.writeQuery({
      query: CatalogRestaurantsDocument,
      variables: { input: { page: 2 } },
      data: makeResult("restaurant-2", "Second page"),
    });

    const first = cache.readQuery<Record<string, { restaurants: { name: string }[] }>>({
      query: CatalogRestaurantsDocument,
      variables: { input: { page: 1 } },
    });
    const second = cache.readQuery<Record<string, { restaurants: { name: string }[] }>>({
      query: CatalogRestaurantsDocument,
      variables: { input: { page: 2 } },
    });
    expect(first?.restaurants.restaurants[0]?.name).toBe("First page");
    expect(second?.restaurants.restaurants[0]?.name).toBe("Second page");
  });

  it("maps a generated detail result and preserves not-found semantics", async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            restaurant: {
              __typename: "RestaurantOutput",
              ok: true,
              error: null,
              restaurant: {
                ...rawRestaurant,
                dishes: [
                  {
                    __typename: "Dish",
                    id: "dish-bibimbap",
                    restaurantId: "restaurant-seoul-kitchen",
                    name: "Bibimbap",
                    description: "Rice bowl",
                    priceMinor: 1299,
                    image: null,
                    options: [
                      {
                        __typename: "DishOption",
                        id: "option-size",
                        name: "Size",
                        minSelections: 1,
                        maxSelections: 1,
                        choices: [
                          {
                            __typename: "DishChoice",
                            id: "choice-large",
                            name: "Large",
                            extraMinor: 200,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            restaurant: {
              __typename: "RestaurantOutput",
              ok: false,
              error: "Restaurant not found.",
              restaurant: null,
            },
          },
        }),
    };
    const catalog = createCatalogRepository(client);

    const detail = await catalog.getRestaurant("restaurant-seoul-kitchen");
    expect(detail?.dishes[0]?.priceMinor).toBe(1299);
    expect(detail?.dishes[0]?.options[0]?.choices[0]?.extraMinor).toBe(200);
    await expect(catalog.getRestaurant("missing")).resolves.toBeNull();
    expect(print(client.query.mock.calls[0]?.[0].query)).toContain("query CatalogRestaurant");
  });
});
