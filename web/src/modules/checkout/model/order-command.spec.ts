import { describe, expect, it, vi } from "vitest";

import type { Order, OrderRepository } from "../../orders";
import { cartAtom, cartStorageAtom, createCartTestStore } from "./cart-atoms";
import {
  createCheckoutCoordinator,
  createRecentOrderReconciler,
  mapCartToCreateOrderPayload,
} from "./order-command";
import { buildCart } from "../testing/fixtures";

describe("order command", () => {
  it("maps only IDs and quantity", () => {
    expect(mapCartToCreateOrderPayload(buildCart())).toEqual({
      restaurantId: "restaurant-seoul-kitchen",
      items: [
        {
          dishId: "dish-bibimbap",
          quantity: 1,
          options: [{ optionId: "option-heat", choiceIds: ["choice-spicy"] }],
        },
      ],
    });
    expect(JSON.stringify(mapCartToCreateOrderPayload(buildCart()))).not.toMatch(/price|name/i);
  });

  it("deduplicates concurrent submits and clears after success", async () => {
    const store = createCartTestStore({ initialState: buildCart() });
    let resolveCreate!: (value: { kind: "success"; orderId: string }) => void;
    const create = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const onOrderCreated = vi.fn();
    const coordinator = createCheckoutCoordinator({
      store,
      repository: { create },
      reconcile: vi.fn(),
      onOrderCreated,
    });
    const first = coordinator.submit();
    const second = coordinator.submit();
    expect(first).toBe(second);
    expect(create).toHaveBeenCalledTimes(1);
    resolveCreate({ kind: "success", orderId: "order-1" });
    await expect(first).resolves.toEqual({
      kind: "success",
      orderId: "order-1",
      reconciled: false,
    });
    expect(store.get(cartAtom).lines).toHaveLength(0);
    expect(onOrderCreated).toHaveBeenCalledWith("order-1");
  });

  it("does not call the repository for an empty cart", async () => {
    const create = vi.fn();
    const coordinator = createCheckoutCoordinator({
      store: createCartTestStore(),
      repository: { create },
      reconcile: vi.fn(),
    });
    await expect(coordinator.submit()).resolves.toEqual({ kind: "empty-cart" });
    expect(create).not.toHaveBeenCalled();
  });

  it("preserves cart after business/network errors", async () => {
    for (const result of [
      { kind: "business-error" as const, message: "Invalid dish" },
      { kind: "network-error" as const, message: "Offline" },
    ]) {
      const cart = buildCart();
      const store = createCartTestStore({ initialState: cart });
      const coordinator = createCheckoutCoordinator({
        store,
        repository: { create: vi.fn().mockResolvedValue(result) },
        reconcile: vi.fn(),
      });
      await expect(coordinator.submit()).resolves.toEqual({
        kind: "error",
        message: result.message,
      });
      expect(store.get(cartAtom)).toEqual(cart);
    }
  });

  it("coordinates timeout by querying and never automatically retries mutation", async () => {
    const cart = buildCart();
    const store = createCartTestStore({ initialState: cart });
    const create = vi.fn().mockResolvedValue({ kind: "timeout", message: "Timed out" });
    const reconcile = vi.fn().mockResolvedValue(null);
    const coordinator = createCheckoutCoordinator({
      store,
      repository: { create },
      reconcile,
      now: () => 123,
    });
    await expect(coordinator.submit()).resolves.toEqual({
      kind: "timeout-unresolved",
      message: "Timed out",
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(reconcile).toHaveBeenCalledWith(mapCartToCreateOrderPayload(cart), 123);
    expect(store.get(cartAtom)).toEqual(cart);
  });

  it("clears when timeout reconciliation finds the created order", async () => {
    const store = createCartTestStore({ initialState: buildCart() });
    const coordinator = createCheckoutCoordinator({
      store,
      repository: { create: vi.fn().mockResolvedValue({ kind: "timeout", message: "Timed out" }) },
      reconcile: vi.fn().mockResolvedValue("order-found"),
    });
    await expect(coordinator.submit()).resolves.toEqual({
      kind: "success",
      orderId: "order-found",
      reconciled: true,
    });
    expect(store.get(cartAtom).lines).toHaveLength(0);
  });

  it("preserves a cart changed while the command was pending", async () => {
    const store = createCartTestStore({ initialState: buildCart() });
    const coordinator = createCheckoutCoordinator({
      store,
      repository: {
        create: vi.fn().mockImplementation(async () => {
          store.set(
            cartStorageAtom,
            buildCart({ lines: [{ ...buildCart().lines[0], quantity: 2 }] }),
          );
          return { kind: "success" as const, orderId: "order-1" };
        }),
      },
      reconcile: vi.fn(),
    });
    await expect(coordinator.submit()).resolves.toEqual({ kind: "cart-changed" });
    expect(store.get(cartAtom).lines[0].quantity).toBe(2);
  });

  it("keeps a timed-out cart when reconciliation itself fails", async () => {
    const cart = buildCart();
    const store = createCartTestStore({ initialState: cart });
    const coordinator = createCheckoutCoordinator({
      store,
      repository: { create: vi.fn().mockResolvedValue({ kind: "timeout", message: "Timed out" }) },
      reconcile: vi.fn().mockRejectedValue(new Error("query failed")),
    });
    await expect(coordinator.submit()).resolves.toEqual({
      kind: "timeout-unresolved",
      message: "Timed out",
    });
    expect(store.get(cartAtom)).toEqual(cart);
  });

  it("matches a recent order by server snapshots", async () => {
    const payload = mapCartToCreateOrderPayload(buildCart());
    const order = {
      id: "order-1",
      customerId: "customer-1",
      courierId: null,
      restaurantId: payload.restaurantId,
      restaurant: null,
      status: "PENDING",
      totalMinor: 1_449,
      createdAt: "2026-08-17T00:00:01.000Z",
      updatedAt: "2026-08-17T00:00:01.000Z",
      items: [
        {
          id: "item-1",
          position: 0,
          dishId: "dish-bibimbap",
          dishName: "Bibimbap",
          quantity: 1,
          lineTotalMinor: 1_449,
          selectedOptions: [
            {
              optionId: "option-heat",
              name: "Heat level",
              choices: [{ choiceId: "choice-spicy", name: "Spicy", extraMinor: 150 }],
            },
          ],
        },
      ],
    } satisfies Order;
    const repository: OrderRepository = {
      list: vi.fn().mockResolvedValue([order]),
      get: vi.fn(),
      updateStatus: vi.fn(),
    };
    await expect(
      createRecentOrderReconciler(repository)(payload, Date.parse("2026-08-17T00:00:00.000Z")),
    ).resolves.toBe("order-1");
  });
});
