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
  createRealtimeSubscription,
} from "./subscription-adapter";
import type { Order, OrderRealtimeEvent } from "../model/types";

describe("realtime subscription lifecycle", () => {
  it("shares one running subscription and supports repeated disposal", async () => {
    const stream = new ControllableAsyncIterable<number>();
    const connect = vi.fn(() => stream);
    const onEvent = vi.fn();
    const refetch = vi.fn();
    const retry = vi.fn();
    const onConnectionState = vi.fn();
    const subscription = createRealtimeSubscription({
      connect,
      onEvent,
      refetch,
      retry,
      onAuthoritative: vi.fn(),
      onConnectionState,
    });
    const running = subscription.start();

    try {
      expect(subscription.start()).toBe(running);
      expect(connect).toHaveBeenCalledOnce();
      stream.push(1);
      await flushOrdersRealtime();
      expect(onEvent).toHaveBeenCalledExactlyOnceWith(1);
      expect(refetch).not.toHaveBeenCalled();

      await subscription.dispose();
      await subscription.dispose();
      await running;
      expect(stream.returnCount).toBeGreaterThan(0);
      expect(onConnectionState.mock.calls.map(([state]) => state)).toEqual([
        "connecting",
        "connected",
        "disconnected",
      ]);
      expect(subscription.start()).toBe(running);
      stream.push(2);
      await flushOrdersRealtime();
      expect(connect).toHaveBeenCalledOnce();
      expect(onEvent).toHaveBeenCalledOnce();
      expect(retry).not.toHaveBeenCalled();
    } finally {
      await subscription.dispose();
    }
  });

  it("retries an initial connection failure after the default delay", async () => {
    vi.useFakeTimers();
    const stream = new ControllableAsyncIterable<number>();
    const error = new Error("offline");
    const connect = vi
      .fn<() => AsyncIterable<number>>()
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockReturnValue(stream);
    const onEvent = vi.fn();
    const refetch = vi.fn();
    const diagnostic = vi.fn();
    const subscription = createRealtimeSubscription({
      connect,
      onEvent,
      refetch,
      onAuthoritative: vi.fn(),
      diagnostic,
    });
    const running = subscription.start();

    try {
      expect(diagnostic).toHaveBeenCalledWith("Order subscription disconnected.", {
        attempt: 1,
        error: "offline",
      });
      await vi.advanceTimersByTimeAsync(999);
      expect(connect).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      expect(connect).toHaveBeenCalledTimes(2);
      expect(refetch).not.toHaveBeenCalled();
      stream.push(42);
      await flushOrdersRealtime();
      expect(onEvent).toHaveBeenCalledExactlyOnceWith(42);
    } finally {
      await subscription.dispose();
      await running;
    }
    expect(stream.returnCount).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reconnects and refetches after a stream ends normally", async () => {
    const first = new ControllableAsyncIterable<number>();
    const second = new ControllableAsyncIterable<number>();
    const connect = vi.fn().mockReturnValueOnce(first).mockReturnValue(second);
    const refetch = vi.fn().mockResolvedValue([10]);
    const onAuthoritative = vi.fn();
    const retry = vi.fn().mockResolvedValue(undefined);
    const onEvent = vi.fn();
    const subscription = createRealtimeSubscription({
      connect,
      refetch,
      onAuthoritative,
      retry,
      onEvent,
    });
    const running = subscription.start();

    try {
      first.complete();
      await flushOrdersRealtime();
      expect(first.returnCount).toBeGreaterThan(0);
      expect(retry).toHaveBeenCalledExactlyOnceWith(1);
      expect(connect).toHaveBeenCalledTimes(2);
      expect(refetch).toHaveBeenCalledOnce();
      expect(onAuthoritative).toHaveBeenCalledExactlyOnceWith([10]);
      second.push(11);
      await flushOrdersRealtime();
      expect(onEvent).toHaveBeenCalledExactlyOnceWith(11);
    } finally {
      await subscription.dispose();
      await running;
    }
    expect(second.returnCount).toBeGreaterThan(0);
  });

  it("disposes during a pending retry without waiting for or reconnecting after it", async () => {
    const stream = new ControllableAsyncIterable<number>();
    const connect = vi.fn(() => stream);
    let resolveRetry!: () => void;
    const retry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve;
        }),
    );
    const refetch = vi.fn();
    const onEvent = vi.fn();
    const onConnectionState = vi.fn();
    const subscription = createRealtimeSubscription({
      connect,
      retry,
      refetch,
      onEvent,
      onAuthoritative: vi.fn(),
      onConnectionState,
    });
    const running = subscription.start();

    try {
      stream.fail(new Error("offline"));
      await flushOrdersRealtime();
      expect(retry).toHaveBeenCalledExactlyOnceWith(1);
      await subscription.dispose();
      await subscription.dispose();
      await running;
      expect(stream.returnCount).toBeGreaterThan(0);
      expect(onConnectionState.mock.calls.at(-1)).toEqual(["disconnected"]);

      resolveRetry();
      stream.push(99);
      await flushOrdersRealtime();
      expect(connect).toHaveBeenCalledOnce();
      expect(refetch).not.toHaveBeenCalled();
      expect(onEvent).not.toHaveBeenCalled();
    } finally {
      await subscription.dispose();
    }
  });
});

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
    const replace = vi.fn((order: Order) => {
      current = order;
    });
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
      replace: (order) => {
        current = order;
      },
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
      replace: (orders) => {
        current = orders;
      },
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
