import { Provider } from "jotai";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { buildDish } from "../../catalog";
import { cartAtom, createCartTestStore } from "../model/cart-atoms";
import { buildCart } from "../testing/fixtures";
import { CartDishCustomizer } from "./cart-dish-customizer";

describe("CartDishCustomizer", () => {
  it("does not replace another restaurant until explicit confirmation", async () => {
    const user = userEvent.setup();
    const original = buildCart();
    const store = createCartTestStore({ initialState: original });
    render(
      <Provider store={store}>
        <CartDishCustomizer
          dish={buildDish({ restaurantId: "restaurant-next" })}
          restaurant={{ id: "restaurant-next", name: "Next Kitchen" }}
          uuid={() => "fixed"}
        />
      </Provider>,
    );
    await user.click(screen.getByRole("radio", { name: /Spicy/ }));
    await user.click(screen.getByRole("button", { name: /Add 1 to cart/ }));
    expect(await screen.findByRole("dialog", { name: "Start a new cart?" })).toBeVisible();
    expect(store.get(cartAtom)).toEqual(original);
    await user.click(screen.getByRole("button", { name: "Keep current cart" }));
    expect(store.get(cartAtom)).toEqual(original);

    await user.click(screen.getByRole("button", { name: /Add 1 to cart/ }));
    await user.click(await screen.findByRole("button", { name: "Start new cart" }));
    expect(store.get(cartAtom).restaurant).toEqual({ id: "restaurant-next", name: "Next Kitchen" });
    expect(store.get(cartAtom).lines[0].dishId).toBe("dish-bibimbap");
  });

  it("adds to the current restaurant and reports completion", async () => {
    const user = userEvent.setup();
    let added = 0;
    const store = createCartTestStore({ initialState: buildCart() });
    render(
      <Provider store={store}>
        <CartDishCustomizer
          dish={buildDish()}
          onAdded={() => {
            added += 1;
          }}
          restaurant={{ id: "restaurant-seoul-kitchen", name: "Seoul Kitchen" }}
          uuid={() => "fixed"}
        />
      </Provider>,
    );
    await user.click(screen.getByRole("radio", { name: /Spicy/ }));
    await user.click(screen.getByRole("button", { name: /Add 1 to cart/ }));
    expect(added).toBe(1);
    expect(store.get(cartAtom).lines[0].quantity).toBe(2);
    expect(screen.queryByRole("dialog", { name: "Start a new cart?" })).not.toBeInTheDocument();
  });
});
