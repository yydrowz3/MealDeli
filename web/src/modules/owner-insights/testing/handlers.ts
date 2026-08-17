import { graphql, HttpResponse } from "msw";

type HandlerOptions = Readonly<{
  promotedUntil?: string | null;
  createError?: string;
  networkError?: boolean;
}>;

export function createOwnerInsightsHandlers(options: HandlerOptions = {}) {
  const restaurant = {
    id: "00000000-0000-7000-8000-000000000001",
    name: "Jade Kitchen",
    promotedUntil: options.promotedUntil ?? null,
  };
  return [
    graphql.query("OwnerInsightsPromotionRestaurant", () =>
      HttpResponse.json({
        data: {
          myRestaurant: { ok: true, error: null, restaurant },
        },
      }),
    ),
    graphql.query("OwnerInsightsPromotionHistory", () =>
      HttpResponse.json({
        data: {
          getPayments: {
            ok: true,
            error: null,
            payments: [
              {
                id: "payment-1",
                transactionId: "demo_00000000-0000-7000-8000-000000000009",
                ownerId: "owner-1",
                restaurantId: restaurant.id,
                createdAt: "2026-08-16T12:00:00.000Z",
                updatedAt: "2026-08-16T12:00:00.000Z",
              },
            ],
          },
          myRestaurants: {
            ok: true,
            error: null,
            restaurants: [{ id: restaurant.id, name: restaurant.name }],
          },
        },
      }),
    ),
    graphql.mutation("OwnerInsightsCreatePromotion", () => {
      if (options.networkError) return HttpResponse.error();
      return HttpResponse.json({
        data: {
          createPayment: options.createError
            ? { ok: false, error: options.createError }
            : { ok: true, error: null },
        },
      });
    }),
  ];
}
