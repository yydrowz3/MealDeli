import type { TypePolicies } from "@apollo/client";

export const catalogTypePolicies = {
  Category: { keyFields: ["id"] },
  Restaurant: { keyFields: ["id"] },
  Dish: { keyFields: ["id"] },
  Query: {
    fields: {
      restaurants: { keyArgs: ["input"] },
      searchRestaurant: { keyArgs: ["input"] },
      category: { keyArgs: ["input"] },
    },
  },
} satisfies TypePolicies;
