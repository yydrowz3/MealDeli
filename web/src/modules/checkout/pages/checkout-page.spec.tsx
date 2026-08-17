import { Provider } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CommandResult, IdentityRepository, SessionUser } from "../../identity";
import { createIdentityTestStore, sessionUserAtom } from "../../identity";
import { cartAtom, cartStorageAtom } from "../model/cart-atoms";
import { buildCart } from "../testing/fixtures";
import { CheckoutPage } from "./checkout-page";

const customer: SessionUser = {
  id: "customer-1",
  email: "customer@example.test",
  name: "Customer",
  role: "CUSTOMER",
  verifiedAt: "2026-08-17T00:00:00.000Z",
  address: null,
  image: null,
};

function commandOk<T = undefined>(value?: T): CommandResult<T> {
  return { ok: true, value: value as T };
}

function identityRepository(refreshed: SessionUser = customer): IdentityRepository {
  return {
    refreshAccessToken: vi.fn().mockResolvedValue(commandOk("access-token")),
    me: vi.fn().mockResolvedValue(commandOk(refreshed)),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    editProfile: vi.fn().mockResolvedValue(commandOk()),
  };
}

describe("CheckoutPage", () => {
  it("shows a dedicated empty cart state", () => {
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: customer });
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={identityRepository()}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={vi.fn()}
          orderRepository={{ create: vi.fn() }}
          reconcileOrder={vi.fn()}
          state={{ kind: "empty" }}
          store={store}
        />
      </Provider>,
    );
    expect(screen.getByText("Your cart is empty")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Pay & place order" })).not.toBeInTheDocument();
  });

  it("requires and saves a 1–500 character address before ordering", async () => {
    const user = userEvent.setup();
    const refreshed = { ...customer, address: "10 Main Street" };
    const repository = identityRepository(refreshed);
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: customer });
    store.set(cartStorageAtom, buildCart());
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={repository}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={vi.fn()}
          orderRepository={{ create: vi.fn() }}
          reconcileOrder={vi.fn()}
          state={{ kind: "ready", restaurant: null as never, address: null, invalidLines: [] }}
          store={store}
        />
      </Provider>,
    );
    expect(screen.getByRole("button", { name: "Pay & place order" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Save address" }));
    expect((await screen.findAllByText("Add a delivery address to continue.")).length).toBeGreaterThan(0);
    await user.type(screen.getByRole("textbox", { name: "Delivery address" }), "  10 Main Street  ");
    await user.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(repository.editProfile).toHaveBeenCalledTimes(1));
    expect(repository.editProfile).toHaveBeenCalledWith(
      "access-token",
      expect.objectContaining({ address: "10 Main Street" }),
    );
    expect(store.get(sessionUserAtom)?.address).toBe("10 Main Street");
    expect(screen.getByRole("button", { name: "Pay & place order" })).toBeEnabled();
  });

  it("blocks invalid items and removes them without creating an order", async () => {
    const user = userEvent.setup();
    const addressed = { ...customer, address: "10 Main Street" };
    const create = vi.fn();
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: addressed });
    const cart = buildCart();
    store.set(cartStorageAtom, cart);
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={identityRepository(addressed)}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={vi.fn()}
          orderRepository={{ create }}
          reconcileOrder={vi.fn()}
          state={{
            kind: "ready",
            restaurant: null as never,
            address: addressed.address,
            invalidLines: [{ lineId: cart.lines[0].lineId, reason: "DISH_MISSING" }],
          }}
          store={store}
        />
      </Provider>,
    );
    expect(screen.getByText("Some items are no longer available.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pay & place order" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Remove Bibimbap" }));
    expect(store.get(cartAtom).lines).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [{ kind: "forbidden" as const }, "Customer access is required."],
    [{ kind: "verification-required" as const }, "Verify your email before placing an order."],
    [{ kind: "restaurant-missing" as const }, "This restaurant is no longer available."],
    [{ kind: "error" as const, message: "We couldn’t load checkout. Try again." }, "We couldn’t load checkout. Try again."],
  ])("renders loader state $state.kind", (state, expected) => {
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: customer });
    store.set(cartStorageAtom, buildCart());
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={identityRepository()}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={vi.fn()}
          orderRepository={{ create: vi.fn() }}
          reconcileOrder={vi.fn()}
          state={state}
          store={store}
        />
      </Provider>,
    );
    expect(screen.getByText(expected)).toBeVisible();
  });

  it("allows editing an existing address", async () => {
    const user = userEvent.setup();
    const addressed = { ...customer, address: "10 Main Street" };
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: addressed });
    store.set(cartStorageAtom, buildCart());
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={identityRepository(addressed)}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={vi.fn()}
          orderRepository={{ create: vi.fn() }}
          reconcileOrder={vi.fn()}
          state={{ kind: "ready", restaurant: null as never, address: addressed.address, invalidLines: [] }}
          store={store}
        />
      </Provider>,
    );
    expect(screen.queryByRole("textbox", { name: "Delivery address" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox", { name: "Delivery address" })).toHaveValue("10 Main Street");
  });

  it.each([
    [
      { kind: "business-error" as const, message: "Invalid dish" },
      null,
      "We couldn’t place your order. Try again.",
    ],
    [
      { kind: "timeout" as const, message: "Timed out" },
      null,
      "We couldn’t confirm whether your order was placed. Check your orders before trying again.",
    ],
  ])("preserves the cart for $result.kind", async (result, reconciledOrderId, expected) => {
    const user = userEvent.setup();
    const addressed = { ...customer, address: "10 Main Street" };
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: addressed });
    store.set(cartStorageAtom, buildCart());
    const create = vi.fn().mockResolvedValue(result);
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={identityRepository(addressed)}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={vi.fn()}
          orderRepository={{ create }}
          reconcileOrder={vi.fn().mockResolvedValue(reconciledOrderId)}
          state={{ kind: "ready", restaurant: null as never, address: addressed.address, invalidLines: [] }}
          store={store}
        />
      </Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Pay & place order" }));
    expect(await screen.findByText(expected)).toBeVisible();
    expect(store.get(cartAtom).lines).toHaveLength(1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("clears and hands off the order after success", async () => {
    const user = userEvent.setup();
    const addressed = { ...customer, address: "10 Main Street" };
    const store = createIdentityTestStore({ status: "authenticated", accessToken: "access-token", user: addressed });
    store.set(cartStorageAtom, buildCart());
    const onOrderCreated = vi.fn();
    render(
      <Provider store={store}>
        <CheckoutPage
          identityRepository={identityRepository(addressed)}
          onBrowseRestaurants={vi.fn()}
          onOrderCreated={onOrderCreated}
          orderRepository={{ create: vi.fn().mockResolvedValue({ kind: "success", orderId: "order-1" }) }}
          reconcileOrder={vi.fn()}
          state={{ kind: "ready", restaurant: null as never, address: addressed.address, invalidLines: [] }}
          store={store}
        />
      </Provider>,
    );
    await user.click(screen.getByRole("button", { name: "Pay & place order" }));
    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledWith("order-1"));
    expect(store.get(cartAtom).lines).toHaveLength(0);
  });
});
