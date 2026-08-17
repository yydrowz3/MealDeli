import type { CartLine, CartState } from "../model/types";

export function buildCartLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    lineId: "line-bibimbap",
    dishId: "dish-bibimbap",
    dishName: "Bibimbap",
    basePriceMinor: 1_299,
    image: null,
    options: [
      {
        optionId: "option-heat",
        name: "Heat level",
        choices: [{ choiceId: "choice-spicy", name: "Spicy", extraMinor: 150 }],
      },
    ],
    quantity: 1,
    ...overrides,
  };
}

export function buildCart(overrides: Partial<CartState> = {}): CartState {
  return {
    version: 1,
    restaurant: { id: "restaurant-seoul-kitchen", name: "Seoul Kitchen" },
    lines: [buildCartLine()],
    ...overrides,
  };
}
