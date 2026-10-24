import { describe, expect, it, vi } from "vitest";

import { buildOrder } from "../../orders/testing";
import { createCourierGraphqlCommandPort, createCourierRepository } from "./courier-repository";

const rawOrder = {
  __typename: "Order" as const,
  id: "available-1",
  customerId: "customer-1",
  courierId: null,
  restaurantId: "restaurant-1",
  status: "WAITING" as const,
  totalMinor: 2600,
  createdAt: "2026-08-17T10:00:00Z",
  updatedAt: "2026-08-17T10:00:00Z",
  restaurant: {
    __typename: "Restaurant" as const,
    id: "restaurant-1",
    name: "Jade Kitchen",
    address: "100 Market Street",
    image: null,
  },
  items: [],
};

describe("courier GraphQL adapter", () => {
  it("adapts available orders and maps take-order business conflicts", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({
        availableOrders: { ok: true, error: null, orders: [rawOrder] },
      })
      .mockResolvedValueOnce({
        takeOrder: { ok: false, error: "Order is no longer available." },
      })
      .mockResolvedValueOnce({
        takeOrder: { ok: false, error: "You already have an active delivery." },
      });
    const commands = createCourierGraphqlCommandPort(
      { execute },
      { get: vi.fn().mockResolvedValue({ kind: "not-found" }), updateStatus: vi.fn() },
    );
    await expect(commands.availableOrders()).resolves.toEqual([
      expect.objectContaining({
        id: "available-1",
        status: "WAITING",
        restaurant: expect.objectContaining({ name: "Jade Kitchen" }),
      }),
    ]);
    await expect(commands.takeOrder("available-1")).resolves.toEqual({
      kind: "no-longer-available",
    });
    await expect(commands.takeOrder("available-1")).resolves.toEqual({ kind: "already-active" });
  });

  it("classifies timeouts without retrying mutations and maps complete branches", async () => {
    const execute = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
    const updateStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error("This order is not assigned to this courier."))
      .mockRejectedValueOnce(new Error("Invalid order status transition."));
    const delivered = buildOrder({ status: "DELIVERED", courierId: "courier-1" });
    const get = vi
      .fn()
      .mockResolvedValueOnce({ kind: "found", order: buildOrder({ status: "PICKED" }) })
      .mockResolvedValueOnce({ kind: "found", order: buildOrder({ status: "PICKED" }) })
      .mockResolvedValueOnce({ kind: "found", order: delivered });
    const commands = createCourierGraphqlCommandPort({ execute }, { get, updateStatus });
    await expect(commands.takeOrder("available-1")).resolves.toEqual({ kind: "timeout" });
    expect(execute).toHaveBeenCalledTimes(1);
    await expect(commands.completeOrder("active-1")).resolves.toEqual({ kind: "assignment-lost" });
    await expect(commands.completeOrder("active-1")).resolves.toEqual({
      kind: "already-delivered",
    });
  });

  it("composes Courier commands with the shared Orders read model", async () => {
    const order = buildOrder({ status: "PICKED", courierId: "courier-1" });
    const commands = {
      availableOrders: vi.fn().mockResolvedValue([]),
      takeOrder: vi.fn().mockResolvedValue({ kind: "success" as const }),
      completeOrder: vi.fn().mockResolvedValue({ kind: "success" as const }),
    };
    const repository = createCourierRepository(commands, {
      list: vi.fn().mockResolvedValue([order]),
      get: vi.fn().mockResolvedValue({ kind: "found", order }),
    });
    await expect(repository.listOrders("PICKED")).resolves.toEqual([order]);
    await expect(repository.getOrder(order.id)).resolves.toEqual({ kind: "found", order });
    await expect(repository.availableOrders()).resolves.toEqual([]);
    await expect(repository.takeOrder(order.id)).resolves.toEqual({ kind: "success" });
    await expect(repository.completeOrder(order.id)).resolves.toEqual({ kind: "success" });
  });

  it("covers available defaults and take-order success/error branches", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ availableOrders: { ok: true, error: null, orders: null } })
      .mockResolvedValueOnce({ availableOrders: { ok: false, error: null, orders: null } })
      .mockResolvedValueOnce({ takeOrder: { ok: true, error: null } })
      .mockResolvedValueOnce({ takeOrder: { ok: false, error: "Unexpected" } })
      .mockRejectedValueOnce("offline");
    const commands = createCourierGraphqlCommandPort(
      { execute },
      { get: vi.fn(), updateStatus: vi.fn() },
    );
    await expect(commands.availableOrders()).resolves.toEqual([]);
    await expect(commands.availableOrders()).rejects.toThrow("Could not get available orders.");
    await expect(commands.takeOrder("order-1")).resolves.toEqual({ kind: "success" });
    await expect(commands.takeOrder("order-1")).resolves.toEqual({ kind: "error" });
    await expect(commands.takeOrder("order-1")).resolves.toEqual({ kind: "error" });
  });

  it("covers all complete-order reconciliation branches", async () => {
    const picked = buildOrder({ status: "PICKED", courierId: "courier-1" });
    const delivered = buildOrder({ status: "DELIVERED", courierId: "courier-1" });
    const get = vi
      .fn()
      .mockResolvedValueOnce({ kind: "not-found" })
      .mockResolvedValueOnce({ kind: "found", order: delivered })
      .mockResolvedValueOnce({ kind: "found", order: picked })
      .mockResolvedValueOnce({ kind: "found", order: picked })
      .mockResolvedValueOnce({ kind: "found", order: picked })
      .mockResolvedValueOnce({ kind: "not-found" })
      .mockResolvedValueOnce({ kind: "found", order: picked })
      .mockResolvedValueOnce({ kind: "found", order: picked })
      .mockResolvedValueOnce({ kind: "found", order: picked });
    const updateStatus = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockRejectedValueOnce(new Error("Invalid order status transition."))
      .mockRejectedValueOnce(new Error("Invalid order status transition."))
      .mockRejectedValueOnce(42);
    const commands = createCourierGraphqlCommandPort({ execute: vi.fn() }, { get, updateStatus });
    await expect(commands.completeOrder("missing")).resolves.toEqual({ kind: "assignment-lost" });
    await expect(commands.completeOrder("done")).resolves.toEqual({ kind: "already-delivered" });
    await expect(commands.completeOrder("active")).resolves.toEqual({ kind: "success" });
    await expect(commands.completeOrder("timeout")).resolves.toEqual({ kind: "timeout" });
    await expect(commands.completeOrder("lost")).resolves.toEqual({ kind: "assignment-lost" });
    await expect(commands.completeOrder("invalid")).resolves.toEqual({ kind: "error" });
    await expect(commands.completeOrder("unknown")).resolves.toEqual({ kind: "error" });
  });
});
