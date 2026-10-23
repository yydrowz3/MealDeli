import { graphql, HttpResponse } from "msw";

import { buildOwnerRestaurant } from "./fixtures";

export type OwnerManagementHandlerOverrides = Readonly<{
  restaurants?: ReturnType<typeof buildOwnerRestaurant>[];
}>;

export function createOwnerManagementHandlers(overrides: OwnerManagementHandlerOverrides = {}) {
  const restaurants = overrides.restaurants ?? [buildOwnerRestaurant()];
  return [
    graphql.query("OwnerManagementMyRestaurants", () =>
      HttpResponse.json({
        data: { myRestaurants: { ok: true, error: null, restaurants } },
      }),
    ),
    graphql.query("OwnerManagementMyRestaurant", ({ variables }) => {
      const input = variables.input as { id: string };
      const restaurant = restaurants.find((item) => item.id === input.id) ?? null;
      return HttpResponse.json({
        data: {
          myRestaurant: {
            ok: Boolean(restaurant),
            error: restaurant ? null : "Restaurant not found.",
            restaurant,
          },
        },
      });
    }),
  ];
}
