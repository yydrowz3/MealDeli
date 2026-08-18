import type { Order } from "../../orders";

import { buildLocalDateBuckets } from "./date-buckets";

export type DailySales = Readonly<{ date: string; salesMinor: number }>;
export type TopDish = Readonly<{ dishName: string; quantity: number }>;

export type OwnerMetrics = Readonly<{
  salesMinor: number;
  orderCount: number;
  averageOrderMinor: number;
  activeOrderCount: number;
  dailySales: readonly DailySales[];
  topDishes: readonly TopDish[];
}>;

export type OwnerAnalyticsDiagnostic = (
  message: string,
  details?: Readonly<Record<string, unknown>>,
) => void;

const ACTIVE_STATUSES = new Set<Order["status"]>(["PENDING", "COOKING", "WAITING", "PICKED"]);

export function computeOwnerMetrics(
  input: Readonly<{
    orders: readonly Order[];
    now: Date;
    restaurantId?: string;
    diagnostic?: OwnerAnalyticsDiagnostic;
  }>,
): OwnerMetrics {
  const buckets = buildLocalDateBuckets(input.now);
  const rangeStart = buckets[0].start.getTime();
  const rangeEnd = buckets[buckets.length - 1].end.getTime();
  const selectedOrders = input.restaurantId
    ? input.orders.filter((order) => order.restaurantId === input.restaurantId)
    : input.orders;
  const activeOrderCount = selectedOrders.filter((order) =>
    ACTIVE_STATUSES.has(order.status),
  ).length;
  const salesByDate = new Map(buckets.map((bucket) => [bucket.date, 0]));
  const dishQuantities = new Map<string, number>();
  let salesMinor = 0;
  let orderCount = 0;

  for (const order of selectedOrders) {
    const createdAt = new Date(order.createdAt);
    const timestamp = createdAt.getTime();
    if (Number.isNaN(timestamp)) {
      input.diagnostic?.("Owner analytics ignored an order with an invalid createdAt.", {
        orderId: order.id,
      });
      continue;
    }
    if (timestamp < rangeStart || timestamp >= rangeEnd) continue;

    salesMinor += order.totalMinor;
    orderCount += 1;
    const bucket = buckets.find(
      (candidate) => timestamp >= candidate.start.getTime() && timestamp < candidate.end.getTime(),
    );
    if (bucket)
      salesByDate.set(bucket.date, (salesByDate.get(bucket.date) ?? 0) + order.totalMinor);

    const items = order.items as Order["items"] | null | undefined;
    if (!items) {
      input.diagnostic?.("Owner analytics could not aggregate missing order items.", {
        orderId: order.id,
      });
      continue;
    }
    for (const item of items) {
      dishQuantities.set(item.dishName, (dishQuantities.get(item.dishName) ?? 0) + item.quantity);
    }
  }

  return {
    salesMinor,
    orderCount,
    averageOrderMinor: orderCount === 0 ? 0 : Math.round(salesMinor / orderCount),
    activeOrderCount,
    dailySales: buckets.map((bucket) => ({
      date: bucket.date,
      salesMinor: salesByDate.get(bucket.date) ?? 0,
    })),
    topDishes: [...dishQuantities]
      .map(([dishName, quantity]) => ({ dishName, quantity }))
      .sort(
        (left, right) =>
          right.quantity - left.quantity || left.dishName.localeCompare(right.dishName),
      )
      .slice(0, 5),
  };
}
