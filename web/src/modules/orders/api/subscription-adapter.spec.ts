import { describe, expect, it, vi } from "vitest";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { buildOrder } from "../testing/fixtures";
import { OrdersOrderUpdatesDocument } from "../../../gql/graphql";
import {
  ControllableAsyncIterable,
  createFakeOrderSubscriptions,
  flushOrdersRealtime,
} from "../testing/fake-subscriptions";
import {
  createOrderRealtimeAdapter,
  createOrderSubscriptionPort,
  createOwnerPendingRealtimeAdapter,
} from "./subscription-adapter";
import type { Order, OrderRealtimeEvent } from "../model/types";

describe("subscription transport adapter", () => {
  it("adapts wrapped operation payloads without a real WebSocket", async () => {
    const raw = new ControllableAsyncIterable<unknown>();
    const port = createOrderSubscriptionPort({
      subscribe<TResult, TVariables>(
        document: TypedDocumentNode<TResult, TVariables>,
        variables: TVariables,
      ) {
        expect(document).toBe(OrdersOrderUpdatesDocument);
        expect(variables).toEqual({ input: { id: "order-1" } });
        return raw as AsyncIterable<TResult | Readonly<{ data?: TResult }>>;
      },
    });
    const iterator = port.orderUpdates("order-1")[Symbol.asyncIterator]();
    raw.push({ data: { orderUpdates: buildOrder({ id: "order-1" }) } });
    await expect(iterator.next()).resolves.toEqual(
      expect.objectContaining({ done: false, value: expect.objectContaining({ id: "order-1" }) }),
    );
    await iterator.return?.();
  });
});

describe("order realtime adapter", () => {
  it("keeps data on disconnect, reconnects, refetches authoritatively and disposes", async () => {
    const first = new ControllableAsyncIterable<OrderRealtimeEvent>();
    const second = new ControllableAsyncIterable<OrderRealtimeEvent>();
    const subscriptions = createFakeOrderSubscriptions({ updates: [first, second] });
    let current = buildOrder();
    const replace = vi.fn((order: Order) => { current = order; });
    const states: string[] = [];
    const refetched = buildOrder({
      status: "COOKING",
      updatedAt: "2026-08-16T12:10:00.000Z",
    });
    const repository = { get: vi.fn().mockResolvedValue({ kind: "found", order: refetched }) };
    const onAcceptedEvent = vi.fn();
    const adapter = createOrderRealtimeAdapter({
      orderId: current.id,
      subscriptions,
      repository,
      getCurrent: () => current,
      replace,
      onAcceptedEvent,
      onConnectionState: (state) => states.push(state),
      retry: () => Promise.resolve(),
    });

    const running = adapter.start();
    await flushOrdersRealtime();
    first.push(buildOrder({ status: "COOKING", updatedAt: "2026-08-16T12:05:00.000Z" }));
    await flushOrdersRealtime();
    expect(current.status).toBe("COOKING");
    expect(onAcceptedEvent).toHaveBeenCalledOnce();

    first.fail(new Error("offline"));
    await flushOrdersRealtime();
    expect(repository.get).toHaveBeenCalledOnce();
    expect(current).toEqual(refetched);
    expect(states).toEqual(["connecting", "connected", "reconnecting", "connected"]);

    second.push(buildOrder({ status: "WAITING", updatedAt: "2026-08-16T12:11:00.000Z" }));
    await flushOrdersRealtime();
    expect(current.status).toBe("WAITING");

    await adapter.dispose();
    await running;
    expect(states.at(-1)).toBe("disconnected");
    expect(second.returnCount).toBeGreaterThan(0);
  });

  it("ignores duplicate, out-of-order and null-association events", async () => {
    const stream = new ControllableAsyncIterable<OrderRealtimeEvent>();
    let current = buildOrder({ status: "WAITING", updatedAt: "2026-08-16T12:10:00.000Z" });
    const originalRestaurant = current.restaurant;
    const originalItems = current.items;
    const accepted = vi.fn();
    const adapter = createOrderRealtimeAdapter({
      orderId: current.id,
      subscriptions: createFakeOrderSubscriptions({ updates: [stream] }),
      repository: { get: vi.fn() },
      getCurrent: () => current,
      replace: (order) => { current = order; },
      onAcceptedEvent: accepted,
    });
    const running = adapter.start();
    await flushOrdersRealtime();
    stream.push(current);
    stream.push(buildOrder({ status: "COOKING", updatedAt: "2026-08-16T12:11:00.000Z" }));
    stream.push({
      ...current,
      status: "PICKED",
      courierId: "courier-1",
      restaurant: null,
      items: null,
      updatedAt: "2026-08-16T12:12:00.000Z",
    });
    await flushOrdersRealtime();
    expect(current.status).toBe("PICKED");
    expect(current.restaurant).toBe(originalRestaurant);
    expect(current.items).toBe(originalItems);
    expect(accepted).toHaveBeenCalledOnce();
    await adapter.dispose();
    await running;
  });
});

describe("Owner pending realtime adapter", () => {
  it("inserts once and uses the query as the reconnect source of truth", async () => {
    const first = new ControllableAsyncIterable<OrderRealtimeEvent>();
    const second = new ControllableAsyncIterable<OrderRealtimeEvent>();
    let current: readonly Order[] = [];
    const pending = buildOrder();
    const authoritative = [buildOrder({ id: "server-order" })];
    const repository = { list: vi.fn().mockResolvedValue(authoritative) };
    const onNewOrder = vi.fn();
    const adapter = createOwnerPendingRealtimeAdapter({
      subscriptions: createFakeOrderSubscriptions({ pending: [first, second] }),
      repository,
      getCurrent: () => current,
      replace: (orders) => { current = orders; },
      onNewOrder,
      retry: () => Promise.resolve(),
    });
    const running = adapter.start();
    await flushOrdersRealtime();
    first.push(pending);
    first.push(pending);
    await flushOrdersRealtime();
    expect(current).toHaveLength(1);
    expect(onNewOrder).toHaveBeenCalledOnce();

    first.fail(new Error("offline"));
    await flushOrdersRealtime();
    expect(repository.list).toHaveBeenCalledOnce();
    expect(current).toEqual(authoritative);
    await adapter.dispose();
    await running;
  });
});
