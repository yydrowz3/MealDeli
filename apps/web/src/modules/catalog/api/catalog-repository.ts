import type {
  ApolloClient,
  MaybeMasked,
  OperationVariables,
  TypedDocumentNode,
} from "@apollo/client";

import {
  CatalogAllCategoriesDocument,
  CatalogCategoryDocument,
  CatalogRestaurantDocument,
  CatalogRestaurantsDocument,
  CatalogSearchRestaurantsDocument,
} from "../../../gql/graphql";
import type {
  CatalogPage,
  CatalogSearch,
  CategorySummary,
  RestaurantDetail,
  RestaurantSummary,
} from "../model/types";
import {
  adaptAllCategoriesQuery,
  adaptGeneratedRestaurantDetail,
  adaptGeneratedRestaurantPage,
} from "./catalog-adapter";

export type CatalogFetchPolicy = "cache-first" | "network-only";

export type CatalogGraphqlClient = Pick<ApolloClient, "query">;

export type CatalogRepository = {
  getCategories(): Promise<readonly CategorySummary[]>;
  getRestaurants(search: CatalogSearch): Promise<CatalogPage<RestaurantSummary>>;
  getRestaurant(restaurantId: string): Promise<RestaurantDetail | null>;
};

export class CatalogNetworkError extends Error {
  constructor(message = "The catalog could not be loaded.", options?: ErrorOptions) {
    super(message, options);
    this.name = "CatalogNetworkError";
  }
}

async function query<TData, TVariables extends OperationVariables>(
  client: CatalogGraphqlClient,
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  fetchPolicy: CatalogFetchPolicy = "cache-first",
): Promise<MaybeMasked<TData>> {
  try {
    const response = await client.query({ query: document, variables, fetchPolicy });
    if (!response.data) throw new CatalogNetworkError("The catalog returned no data.");
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.name.startsWith("Catalog")) throw error;
    throw new CatalogNetworkError(undefined, { cause: error });
  }
}

export function createCatalogRepository(client: CatalogGraphqlClient): CatalogRepository {
  return {
    async getCategories() {
      const data = await query(client, CatalogAllCategoriesDocument, {});
      return adaptAllCategoriesQuery(data);
    },

    async getRestaurants(search) {
      if (search.query) {
        const data = await query(
          client,
          CatalogSearchRestaurantsDocument,
          { input: { query: search.query, page: search.page } },
          "network-only",
        );
        return adaptGeneratedRestaurantPage(data.searchRestaurant, search.page);
      }
      if (search.category) {
        const data = await query(
          client,
          CatalogCategoryDocument,
          { input: { slug: search.category, page: search.page } },
          "network-only",
        );
        return adaptGeneratedRestaurantPage(data.category, search.page);
      }
      const data = await query(
        client,
        CatalogRestaurantsDocument,
        { input: { page: search.page } },
        "network-only",
      );
      return adaptGeneratedRestaurantPage(data.restaurants, search.page);
    },

    async getRestaurant(restaurantId) {
      const data = await query(client, CatalogRestaurantDocument, {
        input: { restaurantId },
      });
      return adaptGeneratedRestaurantDetail(data);
    },
  };
}
