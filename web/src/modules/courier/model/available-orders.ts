import type { Order, OrderRealtimeEvent } from "../../orders";

export type AvailableOrder = Order;

export function isAvailableOrder(order: Pick<Order, "status" | "courierId">): boolean {
  return order.status === "WAITING" && order.courierId === null;
}

export function sortAvailableOrders(orders: readonly AvailableOrder[]): readonly AvailableOrder[] {
  return [...orders].sort(
    (left, right) =>
      Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.id.localeCompare(right.id),
  );
}

export function mergeAvailableOrders(
  current: readonly AvailableOrder[],
  incoming: readonly AvailableOrder[],
): readonly AvailableOrder[] {
  const byId = new Map<string, AvailableOrder>();
  for (const order of [...current, ...incoming]) {
    if (isAvailableOrder(order)) {
      const previous = byId.get(order.id);
      if (!previous || Date.parse(order.updatedAt) >= Date.parse(previous.updatedAt)) {
        byId.set(order.id, order);
      }
    } else {
      byId.delete(order.id);
    }
  }
  return sortAvailableOrders([...byId.values()]);
}

export function removeAvailableOrder(
  orders: readonly AvailableOrder[],
  id: string,
): readonly AvailableOrder[] {
  return orders.filter((order) => order.id !== id);
}

export function isCompleteAvailableEvent(event: OrderRealtimeEvent): event is Order {
  return event.restaurant !== undefined && event.items !== undefined;
}
