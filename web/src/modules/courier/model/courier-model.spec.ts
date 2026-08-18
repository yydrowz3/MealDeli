import { describe, expect, it } from "vitest";

import { buildOrder } from "../../orders/testing";
import { selectActiveDelivery } from "./active-delivery";
import { mergeAvailableOrders } from "./available-orders";
import { clampRouteProgress, createDemoRoute, stableOrderHash } from "./demo-route";
import {
  COURIER_ROUTE_STORAGE_KEY,
  advanceCourierRouteAtom,
  clearCourierRouteAtom,
  courierRouteAtom,
  createCourierRouteTestStore,
  createMemoryCourierStorage,
  createValidatedCourierStorage,
  initializeCourierRouteAtom,
} from "./route-atoms";

describe("courier available and active models", () => {
  it("filters, sorts and deduplicates authoritative and realtime orders", () => {
    const later = buildOrder({
      id: "b-order",
      status: "WAITING",
      createdAt: "2026-08-17T12:00:00.000Z",
    });
    const earlier = buildOrder({
      id: "a-order",
      status: "WAITING",
      createdAt: "2026-08-17T11:00:00.000Z",
    });
    const picked = buildOrder({ id: "picked", status: "PICKED", courierId: "courier-2" });
    const reassigned = { ...earlier, status: "PICKED" as const, courierId: "courier-3" };

    expect(mergeAvailableOrders([later, earlier], [later, picked, reassigned])).toEqual([later]);
    expect(mergeAvailableOrders([], [later, earlier, later]).map((order) => order.id)).toEqual([
      "a-order",
      "b-order",
    ]);
  });

  it("chooses the newest active order and exposes invariant violations", () => {
    const old = buildOrder({ id: "old", status: "PICKED", updatedAt: "2026-08-16T10:00:00Z" });
    const recent = buildOrder({
      id: "recent",
      status: "PICKED",
      updatedAt: "2026-08-17T10:00:00Z",
    });
    expect(selectActiveDelivery([old, recent])).toEqual({
      active: recent,
      hasInvariantError: true,
    });
  });
});

describe("demo route", () => {
  it("uses a stable hash and deterministic route", () => {
    expect(stableOrderHash("order-1")).toBe(stableOrderHash("order-1"));
    expect(createDemoRoute("order-1")).toEqual(createDemoRoute("order-1"));
    expect(createDemoRoute("order-1").path).toHaveLength(26);
    expect(
      new Set(
        ["order-1", "order-2", "order-3", "order-4"].map(
          (id) => createDemoRoute(id).restaurant.lat,
        ),
      ).size,
    ).toBeGreaterThan(1);
  });

  it("clamps invalid and overflowing progress", () => {
    expect(clampRouteProgress(-20, 26)).toBe(0);
    expect(clampRouteProgress(999, 26)).toBe(25);
    expect(clampRouteProgress(Number.NaN, 26)).toBe(0);
  });

  it("hydrates validated compact state and clears invalid versions", () => {
    const valid = createMemoryCourierStorage({
      [COURIER_ROUTE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        orderId: "hydrated",
        progressIndex: 7,
        startedAt: 100,
      }),
    });
    const invalid = createMemoryCourierStorage({
      [COURIER_ROUTE_STORAGE_KEY]: JSON.stringify({ version: 2, orderId: "old" }),
    });
    expect(
      createValidatedCourierStorage(valid).getItem(COURIER_ROUTE_STORAGE_KEY, null)?.orderId,
    ).toBe("hydrated");
    expect(
      createValidatedCourierStorage(invalid).getItem(COURIER_ROUTE_STORAGE_KEY, null),
    ).toBeNull();
    expect(invalid.getItem(COURIER_ROUTE_STORAGE_KEY)).toBeNull();
  });

  it("reconciles order mismatch, advances with clamp, clears and isolates stores", () => {
    const first = createCourierRouteTestStore({ orderId: "first", progressIndex: 25 });
    const second = createCourierRouteTestStore();
    first.set(initializeCourierRouteAtom, "second");
    expect(first.get(courierRouteAtom)?.orderId).toBe("second");
    expect(first.get(courierRouteAtom)?.progressIndex).toBe(0);
    first.set(advanceCourierRouteAtom);
    expect(first.get(courierRouteAtom)?.progressIndex).toBe(1);
    for (let index = 0; index < 40; index += 1) first.set(advanceCourierRouteAtom);
    expect(first.get(courierRouteAtom)?.progressIndex).toBe(25);
    expect(second.get(courierRouteAtom)).toBeNull();
    first.set(clearCourierRouteAtom);
    expect(first.get(courierRouteAtom)).toBeNull();
  });
});
