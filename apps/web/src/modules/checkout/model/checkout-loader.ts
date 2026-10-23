import type { CatalogRepository, RestaurantDetail } from "../../catalog";
import type { SessionUser } from "../../identity";
import type { CartLine, CartState } from "./types";

export type InvalidCartLine = Readonly<{
  lineId: string;
  reason: "DISH_MISSING" | "OPTION_MISSING" | "CHOICE_MISSING" | "INVALID_SELECTION";
}>;

export type CheckoutLoadResult =
  | Readonly<{ kind: "forbidden" }>
  | Readonly<{ kind: "verification-required" }>
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "restaurant-missing" }>
  | Readonly<{ kind: "error"; message: string }>
  | Readonly<{
      kind: "ready";
      restaurant: RestaurantDetail;
      address: string | null;
      invalidLines: readonly InvalidCartLine[];
    }>;

function validateLine(line: CartLine, restaurant: RestaurantDetail): InvalidCartLine | null {
  const dish = restaurant.dishes.find((candidate) => candidate.id === line.dishId);
  if (!dish) return { lineId: line.lineId, reason: "DISH_MISSING" };
  for (const optionSnapshot of line.options) {
    const option = dish.options.find((candidate) => candidate.id === optionSnapshot.optionId);
    if (!option) return { lineId: line.lineId, reason: "OPTION_MISSING" };
    const choices = new Set(option.choices.map((choice) => choice.id));
    if (optionSnapshot.choices.some((choice) => !choices.has(choice.choiceId))) {
      return { lineId: line.lineId, reason: "CHOICE_MISSING" };
    }
  }
  for (const option of dish.options) {
    const count =
      line.options.find((snapshot) => snapshot.optionId === option.id)?.choices.length ?? 0;
    if (count < option.minSelections || count > option.maxSelections) {
      return { lineId: line.lineId, reason: "INVALID_SELECTION" };
    }
  }
  return null;
}

export async function loadCheckout(input: {
  user: SessionUser | null;
  cart: CartState;
  catalog: CatalogRepository;
}): Promise<CheckoutLoadResult> {
  if (!input.user || input.user.role !== "CUSTOMER") return { kind: "forbidden" };
  if (!input.user.verifiedAt) return { kind: "verification-required" };
  if (!input.cart.restaurant || input.cart.lines.length === 0) return { kind: "empty" };
  try {
    const restaurant = await input.catalog.getRestaurant(input.cart.restaurant.id);
    if (!restaurant) return { kind: "restaurant-missing" };
    const invalidLines = input.cart.lines
      .map((line) => validateLine(line, restaurant))
      .filter((line) => line !== null);
    return { kind: "ready", restaurant, address: input.user.address, invalidLines };
  } catch {
    return { kind: "error", message: "We couldn’t load checkout. Try again." };
  }
}
