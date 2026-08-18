import { getOrderStatusRank } from "../model/status-machine";
import { sortOrdersNewestFirst } from "../model/role-projection";
import type { Order, OrderRealtimeEvent, OrdersDiagnostic } from "../model/types";

export type OrderMergeReason = "applied" | "different-order" | "older-status" | "stale-event";

export type OrderMergeResult = Readonly<{
  applied: boolean;
  order: Order;
  reason: OrderMergeReason;
}>;

function ignored(
  current: Order,
  reason: Exclude<OrderMergeReason, "applied">,
  diagnostic?: OrdersDiagnostic,
): OrderMergeResult {
  diagnostic?.("Ignored an order realtime event.", { orderId: current.id, reason });
  return { applied: false, order: current, reason };
}

export function mergeOrderEvent(
  current: Order,
  event: OrderRealtimeEvent,
  diagnostic?: OrdersDiagnostic,
): OrderMergeResult {
  if (current.id !== event.id) {
    return ignored(current, "different-order", diagnostic);
  }

  const currentRank = getOrderStatusRank(current.status);
  const eventRank = getOrderStatusRank(event.status);
  if (eventRank < currentRank) {
    return ignored(current, "older-status", diagnostic);
  }
  if (eventRank === currentRank && Date.parse(event.updatedAt) <= Date.parse(current.updatedAt)) {
    return ignored(current, "stale-event", diagnostic);
  }

  return {
    applied: true,
    reason: "applied",
    order: {
      ...current,
      ...event,
      restaurant: event.restaurant ?? current.restaurant,
      items: event.items ?? current.items,
    },
  };
}

export function mergeOrderEventIntoList(
  current: readonly Order[],
  event: OrderRealtimeEvent,
  options: Readonly<{ insertIfMissing?: boolean; diagnostic?: OrdersDiagnostic }> = {},
): readonly Order[] {
  const index = current.findIndex((order) => order.id === event.id);
  if (index < 0) {
    if (!options.insertIfMissing || event.restaurant === undefined || event.items === undefined) {
      options.diagnostic?.("Ignored an order event that was not present in the list.", {
        orderId: event.id,
      });
      return current;
    }
    return sortOrdersNewestFirst([
      ...current,
      { ...event, restaurant: event.restaurant, items: event.items ?? [] },
    ]);
  }

  const result = mergeOrderEvent(current[index], event, options.diagnostic);
  if (!result.applied) {
    return current;
  }
  return sortOrdersNewestFirst(
    current.map((order, orderIndex) => (orderIndex === index ? result.order : order)),
  );
}

export interface ApolloOrderCachePort {
  readOrder(id: string): Order | null;
  writeOrder(order: Order): void;
  readOrderList(): readonly Order[];
  writeOrderList(orders: readonly Order[]): void;
}

export function mergeApolloOrderEvent(
  cache: ApolloOrderCachePort,
  event: OrderRealtimeEvent,
  options: Readonly<{ insertIfMissing?: boolean; diagnostic?: OrdersDiagnostic }> = {},
): boolean {
  const current = cache.readOrder(event.id);
  if (current) {
    const result = mergeOrderEvent(current, event, options.diagnostic);
    if (!result.applied) {
      return false;
    }
    cache.writeOrder(result.order);
    cache.writeOrderList(
      mergeOrderEventIntoList(cache.readOrderList(), event, {
        ...options,
        insertIfMissing: false,
      }),
    );
    return true;
  }

  const currentList = cache.readOrderList();
  const nextList = mergeOrderEventIntoList(currentList, event, options);
  if (nextList === currentList) {
    return false;
  }
  const inserted = nextList.find((order) => order.id === event.id);
  if (inserted) {
    cache.writeOrder(inserted);
  }
  cache.writeOrderList(nextList);
  return true;
}

export function replaceApolloOrderAuthoritatively(cache: ApolloOrderCachePort, order: Order): void {
  cache.writeOrder(order);
  const existing = cache.readOrderList();
  const withoutCurrent = existing.filter((candidate) => candidate.id !== order.id);
  cache.writeOrderList(sortOrdersNewestFirst([...withoutCurrent, order]));
}
