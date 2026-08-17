import { describe, expect, it, vi } from "vitest";

import {
  ControllableAsyncIterable,
  buildOrder,
  createFakeOrderSubscriptions,
  flushOrdersRealtime,
} from "../../orders/testing";
import type { Order, OrderRealtimeEvent } from "../../orders";
import { createCourierAvailableRealtimeAdapter } from "./realtime";

describe("courier available realtime", () => {
  it("retains known data, deduplicates events and authoritatively refetches after reconnect", async () => {
    const first = new ControllableAsyncIterable<OrderRealtimeEvent>();
    const second = new ControllableAsyncIterable<OrderRealtimeEvent>();
    const old = buildOrder({ id: "old", status: "WAITING" });
    const fresh = buildOrder({ id: "fresh", status: "WAITING" });
    let current: readonly Order[] = [old];
    const states: string[] = [];
    const refetch = vi.fn().mockResolvedValue([old, fresh]);
    const realtime = createCourierAvailableRealtimeAdapter({
      subscriptions: createFakeOrderSubscriptions({ cooked: [first, second] }),
      refetch,
      getCurrent: () => current,
      replace: (orders) => {
        current = orders;
      },
      onConnectionState: (state) => states.push(state),
      retry: async () => undefined,
    });
    void realtime.start();
    await flushOrdersRealtime();
    first.push(old);
    await flushOrdersRealtime();
    expect(current).toHaveLength(1);
    first.fail(new Error("socket closed"));
    await flushOrdersRealtime();
    expect(refetch).toHaveBeenCalledOnce();
    expect(current.map((order) => order.id)).toEqual(["fresh", "old"]);
    expect(states).toContain("reconnecting");
    await realtime.dispose();
    expect(second.returnCount).toBeGreaterThan(0);
  });
});

