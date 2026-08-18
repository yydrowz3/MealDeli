import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { describe, expect, it, vi } from "vitest";

import { cartAtom, createCartTestStore } from "../model/cart-atoms";
import { buildCart } from "../testing/fixtures";
import { CartDrawer } from "./cart-drawer";

describe("CartDrawer", () => {
  it("shows the empty action", async () => {
    const user = userEvent.setup();
    const browse = vi.fn();
    const store = createCartTestStore();
    render(
      <Provider store={store}>
        <CartDrawer
          open
          onBrowseRestaurants={browse}
          onCheckout={vi.fn()}
          onClose={vi.fn()}
          store={store}
        />
      </Provider>,
    );
    expect(screen.getByText("Your cart is empty")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Browse restaurants" }));
    expect(browse).toHaveBeenCalledTimes(1);
  });

  it("edits lines, formats USD, and confirms decrement from one", async () => {
    const user = userEvent.setup();
    const store = createCartTestStore({ initialState: buildCart() });
    render(
      <Provider store={store}>
        <CartDrawer
          open
          onBrowseRestaurants={vi.fn()}
          onCheckout={vi.fn()}
          onClose={vi.fn()}
          store={store}
        />
      </Provider>,
    );
    expect(screen.getAllByText("$14.49").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Decrease Bibimbap quantity" }));
    expect(screen.getByRole("dialog", { name: "Remove item?" })).toBeVisible();
    expect(store.get(cartAtom).lines).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Remove item" }));
    expect(store.get(cartAtom).lines).toHaveLength(0);
  });

  it("increments a line and continues to checkout", async () => {
    const user = userEvent.setup();
    const checkout = vi.fn();
    const store = createCartTestStore({ initialState: buildCart() });
    render(
      <Provider store={store}>
        <CartDrawer
          open
          onBrowseRestaurants={vi.fn()}
          onCheckout={checkout}
          onClose={vi.fn()}
          store={store}
        />
      </Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Increase Bibimbap quantity" }));
    expect(store.get(cartAtom).lines[0].quantity).toBe(2);
    await user.click(screen.getByRole("button", { name: "Go to checkout" }));
    expect(checkout).toHaveBeenCalledTimes(1);
  });
});
