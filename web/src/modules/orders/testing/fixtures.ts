import type { Order, OrderItem, OrderStatus } from "../model/types";

export function buildOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-1",
    position: 0,
    dishId: "dish-1",
    dishName: "Garden bowl",
    quantity: 2,
    selectedOptions: [
      {
        optionId: "option-1",
        name: "Dressing",
        choices: [{ choiceId: "choice-1", name: "Tahini", extraMinor: 100 }],
      },
    ],
    lineTotalMinor: 2_600,
    ...overrides,
  };
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-00000001",
    customerId: "customer-1",
    courierId: null,
    restaurantId: "restaurant-1",
    restaurant: {
      id: "restaurant-1",
      name: "Jade Kitchen",
      address: "100 Market Street",
      image: null,
    },
    status: "PENDING",
    totalMinor: 2_600,
    createdAt: "2026-08-16T12:00:00.000Z",
    updatedAt: "2026-08-16T12:00:00.000Z",
    items: [buildOrderItem()],
    ...overrides,
  };
}

export function buildOrdersByStatus(): readonly Order[] {
  const statuses: readonly OrderStatus[] = ["PENDING", "COOKING", "WAITING", "PICKED", "DELIVERED"];
  return statuses.map((status, index) =>
    buildOrder({
      id: `order-0000000${index + 1}`,
      status,
      courierId: status === "PICKED" || status === "DELIVERED" ? "courier-1" : null,
      createdAt: `2026-08-${String(12 + index).padStart(2, "0")}T12:00:00.000Z`,
      updatedAt: `2026-08-${String(12 + index).padStart(2, "0")}T12:00:00.000Z`,
    }),
  );
}
