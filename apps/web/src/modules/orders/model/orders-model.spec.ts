import { describe, expect, it, vi } from "vitest";

import { buildOrder, buildOrdersByStatus } from "../testing/fixtures";
import { createCustomerOrderStatusNotifier } from "./customer-notifier";
import { projectOrdersForRole } from "./role-projection";
import {
  buildOrderTimeline,
  canRoleTransitionOrder,
  getNextOrderStatus,
  getOrderStatusRank,
  isAdjacentOrderTransition,
} from "./status-machine";
import { ORDER_STATUSES } from "./types";

describe("order status machine", () => {
  it("keeps one canonical five-state rank and adjacent transition", () => {
    expect(ORDER_STATUSES.map(getOrderStatusRank)).toEqual([0, 1, 2, 3, 4]);
    expect(getNextOrderStatus("PENDING")).toBe("COOKING");
    expect(getNextOrderStatus("DELIVERED")).toBeNull();
    expect(isAdjacentOrderTransition("COOKING", "WAITING")).toBe(true);
    expect(isAdjacentOrderTransition("COOKING", "PICKED")).toBe(false);
    expect(isAdjacentOrderTransition("PICKED", "WAITING")).toBe(false);
  });

  it("applies role policy without weakening adjacency", () => {
    expect(canRoleTransitionOrder("OWNER", "PENDING", "COOKING")).toBe(true);
    expect(canRoleTransitionOrder("OWNER", "COOKING", "WAITING")).toBe(true);
    expect(canRoleTransitionOrder("OWNER", "WAITING", "PICKED")).toBe(false);
    expect(canRoleTransitionOrder("COURIER", "WAITING", "PICKED")).toBe(true);
    expect(canRoleTransitionOrder("COURIER", "PICKED", "DELIVERED")).toBe(true);
    expect(canRoleTransitionOrder("CUSTOMER", "PENDING", "COOKING")).toBe(false);
  });

  it("builds all timeline stages around the current state", () => {
    const timeline = buildOrderTimeline("WAITING");
    expect(timeline).toHaveLength(5);
    expect(timeline.map((step) => step.state)).toEqual([
      "complete",
      "complete",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });
});

describe("role projection", () => {
  const orders = buildOrdersByStatus();

  it("splits Customer current and past orders", () => {
    const [current, past] = projectOrdersForRole(orders, "CUSTOMER");
    expect(current.orders.map((order) => order.status)).toEqual([
      "PICKED",
      "WAITING",
      "COOKING",
      "PENDING",
    ]);
    expect(past.orders.map((order) => order.status)).toEqual(["DELIVERED"]);
  });

  it("filters Owner orders by restaurant and status", () => {
    const ownerOrders = [
      buildOrder({ id: "first", restaurantId: "a", status: "PENDING" }),
      buildOrder({ id: "second", restaurantId: "b", status: "PENDING" }),
      buildOrder({ id: "third", restaurantId: "a", status: "COOKING" }),
    ];
    expect(
      projectOrdersForRole(ownerOrders, "OWNER", {
        restaurantId: "a",
        status: "PENDING",
      })[0].orders.map((order) => order.id),
    ).toEqual(["first"]);
  });

  it("keeps only assigned active and completed Courier orders", () => {
    const [active, completed] = projectOrdersForRole(orders, "COURIER");
    expect(active.orders.map((order) => order.status)).toEqual(["PICKED"]);
    expect(completed.orders.map((order) => order.status)).toEqual(["DELIVERED"]);
  });
});

it("notifies a Customer only once per accepted order state", () => {
  const notify = vi.fn();
  const onStatus = createCustomerOrderStatusNotifier(notify);
  const order = buildOrder({ status: "WAITING" });
  onStatus(order);
  onStatus(order);
  onStatus(buildOrder({ status: "PICKED" }));
  expect(notify).toHaveBeenCalledTimes(2);
  expect(notify).toHaveBeenLastCalledWith({
    title: "On the way",
    description: "Your order is on the way.",
  });
});
