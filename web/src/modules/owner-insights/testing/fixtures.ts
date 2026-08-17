import type { Order, OrderItem } from "../../orders";
import type { PromotionData, PromotionPayment, PromotionRestaurant } from "../model/promotion";

export function buildInsightsOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-insights-1",
    position: 0,
    dishId: "dish-insights-1",
    dishName: "Garden bowl",
    quantity: 1,
    selectedOptions: [],
    lineTotalMinor: 1_200,
    ...overrides,
  };
}

export function buildInsightsOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-insights-0001",
    customerId: "customer-insights-1",
    courierId: null,
    restaurantId: "restaurant-insights-1",
    restaurant: {
      id: "restaurant-insights-1",
      name: "Jade Kitchen",
      address: "100 Market Street",
      image: null,
    },
    status: "PENDING",
    totalMinor: 1_200,
    createdAt: "2026-08-17T12:00:00.000Z",
    updatedAt: "2026-08-17T12:00:00.000Z",
    items: [buildInsightsOrderItem()],
    ...overrides,
  };
}

export function buildPromotionRestaurant(
  overrides: Partial<PromotionRestaurant> = {},
): PromotionRestaurant {
  return {
    id: "00000000-0000-7000-8000-000000000001",
    name: "Jade Kitchen",
    promotedUntil: null,
    ...overrides,
  };
}

export function buildPromotionPayment(
  overrides: Partial<PromotionPayment> = {},
): PromotionPayment {
  return {
    id: "payment-1",
    transactionId: "demo_00000000-0000-7000-8000-000000000009",
    restaurantId: "00000000-0000-7000-8000-000000000001",
    restaurantName: "Jade Kitchen",
    createdAt: "2026-08-16T12:00:00.000Z",
    ...overrides,
  };
}

export function buildPromotionData(overrides: Partial<PromotionData> = {}): PromotionData {
  return {
    restaurant: buildPromotionRestaurant(),
    payments: [],
    ...overrides,
  };
}
