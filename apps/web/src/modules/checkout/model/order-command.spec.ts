import { describe, expect, it, vi } from "vitest";

import type { Order, OrderRepository } from "../../orders";
import { buildOrder, buildOrderItem } from "../../orders/testing/fixtures";
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

  it.each(["business-error", "network-error", "rejection"] as const)(
    "releases the submit lock after %s and allows an explicit retry",
    async (failure) => {
      const cart = buildCart();
      const store = createCartTestStore({ initialState: cart });
      const create = vi.fn();
      const error = new Error("offline");
      if (failure === "rejection") create.mockRejectedValueOnce(error);
      else create.mockResolvedValueOnce({ kind: failure, message: "failed" });
      create.mockResolvedValueOnce({ kind: "success", orderId: "retry-order" });
      const onOrderCreated = vi.fn();
      const reconcile = vi.fn();
      const coordinator = createCheckoutCoordinator({
        store,
        repository: { create },
        reconcile,
        onOrderCreated,
      });

      const first = coordinator.submit();
      expect(coordinator.isSubmitting).toBe(true);
      if (failure === "rejection") await expect(first).rejects.toBe(error);
      else await expect(first).resolves.toEqual({ kind: "error", message: "failed" });

      expect(coordinator.isSubmitting).toBe(false);
      expect(store.get(cartAtom)).toEqual(cart);
      expect(create).toHaveBeenCalledOnce();
      expect(onOrderCreated).not.toHaveBeenCalled();
      expect(reconcile).not.toHaveBeenCalled();

      await expect(coordinator.submit()).resolves.toEqual({
        kind: "success",
        orderId: "retry-order",
        reconciled: false,
      });
      expect(create).toHaveBeenCalledTimes(2);
      expect(coordinator.isSubmitting).toBe(false);
      expect(store.get(cartAtom).lines).toHaveLength(0);
      expect(onOrderCreated).toHaveBeenCalledExactlyOnceWith("retry-order");
    },
  );

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

describe("recent order reconciliation", () => {
  const submittedAt = Date.parse("2026-08-17T00:00:00.000Z");
  const cart = buildCart();
  const payload = mapCartToCreateOrderPayload(cart);
  const item = buildOrderItem({
    dishId: "dish-bibimbap",
    quantity: 1,
    selectedOptions: cart.lines[0].options,
  });
  const order = buildOrder({
    restaurantId: "restaurant-seoul-kitchen",
    createdAt: new Date(submittedAt).toISOString(),
    items: [item],
  });

  function repositoryWith(orders: Order[]): OrderRepository {
    return { list: vi.fn().mockResolvedValue(orders), get: vi.fn(), updateStatus: vi.fn() };
  }

  it.each([
    ["restaurant", { restaurantId: "another-restaurant" }],
    ["dish", { items: [{ ...item, dishId: "another-dish" }] }],
    ["quantity", { items: [{ ...item, quantity: 2 }] }],
    [
      "option",
      {
        items: [
          {
            ...item,
            selectedOptions: [
              {
                ...item.selectedOptions[0],
                optionId: "another-option",
              },
            ],
          },
        ],
      },
    ],
    [
      "choice",
      {
        items: [
          {
            ...item,
            selectedOptions: [
              {
                ...item.selectedOptions[0],
                choices: [{ choiceId: "another-choice", name: "Mild", extraMinor: 0 }],
              },
            ],
          },
        ],
      },
    ],
    ["missing items", { items: [] }],
    ["extra items", { items: [item, buildOrderItem({ id: "extra", position: 1 })] }],
  ] satisfies Array<[string, Partial<Order>]>)(
    "rejects mismatched %s",
    async (_label, overrides) => {
      const repository = repositoryWith([{ ...order, ...overrides }]);
      await expect(
        createRecentOrderReconciler(repository)(payload, submittedAt),
      ).resolves.toBeNull();
      expect(repository.list).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ["at the tolerance boundary", -5_000, true],
    ["just before the tolerance boundary", -5_001, false],
    ["at submission", 0, true],
    ["after submission", 1_000, true],
  ] as const)("matches timestamps %s", async (_label, offset, matches) => {
    const repository = repositoryWith([
      { ...order, createdAt: new Date(submittedAt + offset).toISOString() },
    ]);
    await expect(createRecentOrderReconciler(repository)(payload, submittedAt)).resolves.toBe(
      matches ? order.id : null,
    );
  });

  it("does not match an invalid timestamp or an empty order list", async () => {
    for (const orders of [[], [{ ...order, createdAt: "invalid" }]]) {
      await expect(
        createRecentOrderReconciler(repositoryWith(orders))(payload, submittedAt),
      ).resolves.toBeNull();
    }
  });

  it("finds the matching order after unrelated orders", async () => {
    const repository = repositoryWith([
      { ...order, id: "unrelated", restaurantId: "another-restaurant" },
      order,
    ]);
    await expect(createRecentOrderReconciler(repository)(payload, submittedAt)).resolves.toBe(
      order.id,
    );
  });

  it("matches option and choice IDs regardless of their order and display snapshots", async () => {
    const customizedPayload = {
      restaurantId: payload.restaurantId,
      items: [
        {
          dishId: "dish-bibimbap",
          quantity: 1,
          options: [
            { optionId: "heat", choiceIds: ["mild", "spicy"] },
            { optionId: "side", choiceIds: ["rice"] },
          ],
        },
      ],
    };
    const customizedOrder = {
      ...order,
      items: [
        {
          ...item,
          dishName: "Renamed dish",
          lineTotalMinor: 9_999,
          selectedOptions: [
            {
              optionId: "side",
              name: "Side",
              choices: [{ choiceId: "rice", name: "Rice", extraMinor: 10 }],
            },
            {
              optionId: "heat",
              name: "Heat",
              choices: [
                { choiceId: "spicy", name: "Spicy", extraMinor: 20 },
                { choiceId: "mild", name: "Mild", extraMinor: 30 },
              ],
            },
          ],
        },
      ],
    };
    await expect(
      createRecentOrderReconciler(repositoryWith([customizedOrder]))(
        customizedPayload,
        submittedAt,
      ),
    ).resolves.toBe(order.id);
  });
});
