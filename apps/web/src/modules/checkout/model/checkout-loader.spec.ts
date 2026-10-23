import { describe, expect, it, vi } from "vitest";

import { buildDish, buildRestaurantDetail } from "../../catalog";
import type { CatalogRepository } from "../../catalog";
import { buildCart, buildCartLine } from "../testing/fixtures";
import { loadCheckout } from "./checkout-loader";

const customer = {
  id: "customer-1",
  email: "customer@example.test",
  name: "Customer",
  role: "CUSTOMER",
  verifiedAt: "2026-08-17T00:00:00.000Z",
  address: "10 Main Street",
  image: null,
} as const;

function catalog(detail = buildRestaurantDetail()): CatalogRepository {
  return {
    getCategories: vi.fn(),
    getRestaurants: vi.fn(),
    getRestaurant: vi.fn().mockResolvedValue(detail),
  };
}

describe("loadCheckout", () => {
  it("gates customer and verification before catalog access", async () => {
    const repository = catalog();
    expect(await loadCheckout({ user: null, cart: buildCart(), catalog: repository })).toEqual({
      kind: "forbidden",
    });
    expect(
      await loadCheckout({
        user: { ...customer, verifiedAt: null },
        cart: buildCart(),
        catalog: repository,
      }),
    ).toEqual({ kind: "verification-required" });
    expect(repository.getRestaurant).not.toHaveBeenCalled();
  });

  it("returns an empty state without a redirect loop", async () => {
    expect(
      await loadCheckout({
        user: customer,
        cart: { version: 1, restaurant: null, lines: [] },
        catalog: catalog(),
      }),
    ).toEqual({ kind: "empty" });
  });

  it("marks missing dishes, options, and choices invalid", async () => {
    const detail = buildRestaurantDetail({ dishes: [buildDish()] });
    const cart = buildCart({
      lines: [
        buildCartLine({ lineId: "missing-dish", dishId: "gone" }),
        buildCartLine({
          lineId: "missing-option",
          options: [{ optionId: "gone", name: "Gone", choices: [] }],
        }),
        buildCartLine({
          lineId: "missing-choice",
          options: [
            {
              optionId: "option-heat",
              name: "Heat level",
              choices: [{ choiceId: "gone", name: "Gone", extraMinor: 0 }],
            },
          ],
        }),
      ],
    });
    const result = await loadCheckout({ user: customer, cart, catalog: catalog(detail) });
    expect(result).toMatchObject({
      kind: "ready",
      address: "10 Main Street",
      invalidLines: [
        { lineId: "missing-dish", reason: "DISH_MISSING" },
        { lineId: "missing-option", reason: "OPTION_MISSING" },
        { lineId: "missing-choice", reason: "CHOICE_MISSING" },
      ],
    });
  });

  it("maps missing restaurants and network errors", async () => {
    const missing = catalog();
    vi.mocked(missing.getRestaurant).mockResolvedValue(null);
    expect(await loadCheckout({ user: customer, cart: buildCart(), catalog: missing })).toEqual({
      kind: "restaurant-missing",
    });
    vi.mocked(missing.getRestaurant).mockRejectedValue(new Error("offline"));
    expect(await loadCheckout({ user: customer, cart: buildCart(), catalog: missing })).toEqual({
      kind: "error",
      message: "We couldn’t load checkout. Try again.",
    });
  });
});
