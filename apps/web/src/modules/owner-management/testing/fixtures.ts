import { buildDish, buildRestaurantDetail } from "../../catalog";
import type { Order, OrderStatus } from "../../orders";
import type { OwnerRestaurant } from "../model/types";

const RESTAURANT_ID = "11111111-1111-4111-8111-111111111111";

export function buildOwnerRestaurant(overrides: Partial<OwnerRestaurant> = {}): OwnerRestaurant {
  const base = buildRestaurantDetail({
    id: RESTAURANT_ID,
    dishes: [buildDish({ restaurantId: RESTAURANT_ID })],
  });
  return {
    ...base,
    createdAt: "2026-08-10T10:00:00.000Z",
    updatedAt: "2026-08-11T10:00:00.000Z",
    ...overrides,
  };
}

export function buildOwnerOrder(overrides: Partial<Order> & { status?: OrderStatus } = {}): Order {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    customerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    courierId: null,
    restaurantId: RESTAURANT_ID,
    restaurant: {
      id: RESTAURANT_ID,
      name: "Noodle House",
      address: "1 Main Street",
      image: null,
    },
    status: "PENDING",
    totalMinor: 1299,
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
    items: [],
    ...overrides,
  };
}
