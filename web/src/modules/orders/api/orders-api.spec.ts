import { describe, expect, it, vi } from "vitest";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { buildOrder, buildOrderItem } from "../testing/fixtures";
import {
  OrdersEditOrderDocument,
  OrdersGetOrderDocument,
  OrdersGetOrdersDocument,
} from "../../../gql/graphql";
import {
  adaptOrder,
  adaptOrderDetailOutput,
  adaptOrderRealtimeEvent,
  adaptOrders,
} from "./order-adapter";
import {
  mergeApolloOrderEvent,
  mergeOrderEvent,
  mergeOrderEventIntoList,
  replaceApolloOrderAuthoritatively,
  type ApolloOrderCachePort,
} from "./cache-updates";
import {
  createOrderRepository,
  type OrderGraphqlTransport,
} from "./order-repository";
import type { Order } from "../model/types";

describe("order adapter", () => {
  it("sorts items and lists while preserving a nullable restaurant", () => {
    const older = buildOrder({
      id: "older",
      restaurant: null,
      items: [
        buildOrderItem({ id: "second", position: 2 }),
        buildOrderItem({ id: "first", position: 0 }),
      ],
    });
    const newer = buildOrder({
      id: "newer",
      createdAt: "2026-08-17T12:00:00.000Z",
    });
    const adapted = adaptOrders([older, newer]);
    expect(adapted.map((order) => order.id)).toEqual(["newer", "older"]);
    expect(adapted[1].restaurant).toBeNull();
    expect(adapted[1].items.map((item) => item.id)).toEqual(["first", "second"]);
  });

  it("degrades an invalid option snapshot and reports diagnostics", () => {
    const diagnostic = vi.fn();
    const raw = buildOrder({
      items: [
        { ...buildOrderItem(), selectedOptions: "not-a-snapshot" as never },
      ],
    });
    const order = adaptOrder(raw, diagnostic);
    expect(order.items[0].selectedOptions).toEqual([]);
    expect(diagnostic).toHaveBeenCalledWith(
      "Invalid order option snapshot; using an empty selection.",
      { orderId: raw.id, itemId: raw.items[0].id },
    );
  });

  it("normalizes missing and forbidden detail outputs as not found", () => {
    expect(adaptOrderDetailOutput({ ok: false, error: "Permission denied" })).toEqual({
      kind: "not-found",
    });
    expect(adaptOrderDetailOutput({ ok: true })).toEqual({ kind: "not-found" });
    expect(adaptOrderDetailOutput({ ok: true, order: buildOrder() }).kind).toBe("found");
  });

  it("preserves nullable associations in realtime event adaptation", () => {
    const event = adaptOrderRealtimeEvent({
      ...buildOrder(),
      restaurant: null,
      items: null,
    });
    expect(event.restaurant).toBeNull();
    expect(event.items).toBeNull();
  });
});

describe("order repository", () => {
  it("maps operations through the narrow transport", async () => {
    const calls: unknown[] = [];
    const transport: OrderGraphqlTransport = {
      async execute<TResult, TVariables>(
        document: TypedDocumentNode<TResult, TVariables>,
        _variables: TVariables,
      ): Promise<TResult> {
        calls.push(document);
        if (Object.is(document, OrdersGetOrdersDocument)) {
          return { getOrders: { ok: true, orders: [buildOrder()] } } as TResult;
        }
        if (Object.is(document, OrdersGetOrderDocument)) {
          return { getOrder: { ok: true, order: buildOrder() } } as TResult;
        }
        return { editOrder: { ok: true } } as TResult;
      },
    };
    const repository = createOrderRepository(transport);
    expect(await repository.list("PENDING")).toHaveLength(1);
    expect((await repository.get("order-1")).kind).toBe("found");
    await repository.updateStatus("order-1", "COOKING");
    expect(calls).toEqual([
      OrdersGetOrdersDocument,
      OrdersGetOrderDocument,
      OrdersEditOrderDocument,
    ]);
  });

  it("turns failed list and mutation outputs into structured repository errors", async () => {
    const transport: OrderGraphqlTransport = {
      async execute<TResult, TVariables>(
        document: TypedDocumentNode<TResult, TVariables>,
        _variables: TVariables,
      ): Promise<TResult> {
        return (Object.is(document, OrdersGetOrdersDocument)
          ? { getOrders: { ok: false, error: "list failed" } }
          : { editOrder: { ok: false, error: "edit failed" } }) as TResult;
      },
    };
    const repository = createOrderRepository(transport);
    await expect(repository.list()).rejects.toThrow("list failed");
    await expect(repository.updateStatus("order-1", "COOKING")).rejects.toThrow("edit failed");
  });
});

describe("order event merge", () => {
  const current = buildOrder({ status: "COOKING", updatedAt: "2026-08-16T12:05:00.000Z" });

  it("applies a newer state and preserves null associations", () => {
    const result = mergeOrderEvent(current, {
      ...current,
      status: "WAITING",
      updatedAt: "2026-08-16T12:06:00.000Z",
      restaurant: null,
      items: null,
    });
    expect(result.applied).toBe(true);
    expect(result.order.status).toBe("WAITING");
    expect(result.order.restaurant).toEqual(current.restaurant);
    expect(result.order.items).toEqual(current.items);
  });

  it.each([
    ["duplicate", { ...current }],
    ["out of order", { ...current, status: "PENDING" as const, updatedAt: "2026-08-16T12:07:00.000Z" }],
    ["older same state", { ...current, updatedAt: "2026-08-16T12:04:00.000Z" }],
    ["different id", { ...current, id: "another-order", updatedAt: "2026-08-16T12:07:00.000Z" }],
  ])("ignores a %s event", (_case, event) => {
    const diagnostic = vi.fn();
    const result = mergeOrderEvent(current, event, diagnostic);
    expect(result.applied).toBe(false);
    expect(result.order).toBe(current);
    expect(diagnostic).toHaveBeenCalledOnce();
  });

  it("deduplicates list inserts", () => {
    const event = buildOrder({ id: "new-order", updatedAt: "2026-08-16T12:10:00.000Z" });
    const inserted = mergeOrderEventIntoList([current], event, { insertIfMissing: true });
    const duplicate = mergeOrderEventIntoList(inserted, event, { insertIfMissing: true });
    expect(inserted.map((order) => order.id)).toContain("new-order");
    expect(duplicate).toBe(inserted);
  });

  it("updates the cache and allows an authoritative refetch to correct status", () => {
    let order: Order | null = current;
    let list: readonly Order[] = [current];
    const cache: ApolloOrderCachePort = {
      readOrder: () => order,
      writeOrder: (next) => { order = next; },
      readOrderList: () => list,
      writeOrderList: (next) => { list = next; },
    };
    expect(
      mergeApolloOrderEvent(cache, {
        ...current,
        status: "WAITING",
        updatedAt: "2026-08-16T12:06:00.000Z",
      }),
    ).toBe(true);
    expect(order?.status).toBe("WAITING");
    expect(mergeApolloOrderEvent(cache, current)).toBe(false);

    replaceApolloOrderAuthoritatively(cache, current);
    expect(order?.status).toBe("COOKING");
    expect(list[0].status).toBe("COOKING");
  });
});
