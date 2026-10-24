import { useMemo, type ReactNode } from "react";

import type { Order } from "../../orders";
import { OrderCard, sortOrdersNewestFirst } from "../../orders";
import type { OwnerRestaurant } from "../../owner-management";
import { Button, EmptyState, Money, Select } from "../../../shared/ui";
import { MetricCard } from "../components/metric-card";
import { SalesChart } from "../components/sales-chart";
import { TopDishesChart } from "../components/top-dishes-chart";
import { computeOwnerMetrics, type OwnerAnalyticsDiagnostic } from "../model/analytics";

const systemClock = () => new Date();

export type OwnerDashboardPageProps = Readonly<{
  restaurants: readonly OwnerRestaurant[];
  orders: readonly Order[];
  selectedRestaurantId: string | null;
  onRestaurantChange: (restaurantId: string | null) => void;
  onCreateRestaurant?: () => void;
  onViewOrder?: (order: Order) => void;
  onViewAllOrders?: (restaurantId: string | null) => void;
  renderOrderAction?: (order: Order) => ReactNode;
  clock?: () => Date;
  diagnostic?: OwnerAnalyticsDiagnostic;
}>;

export function OwnerDashboardPage({
  restaurants,
  orders,
  selectedRestaurantId,
  onRestaurantChange,
  onCreateRestaurant,
  onViewOrder,
  onViewAllOrders,
  renderOrderAction,
  clock = systemClock,
  diagnostic,
}: OwnerDashboardPageProps) {
  const now = clock();
  const metrics = computeOwnerMetrics({
    orders,
    now,
    restaurantId: selectedRestaurantId ?? undefined,
    diagnostic,
  });
  const activeOrders = useMemo(
    () =>
      sortOrdersNewestFirst(
        orders.filter(
          (order) =>
            order.status !== "DELIVERED" &&
            (!selectedRestaurantId || order.restaurantId === selectedRestaurantId),
        ),
      ).slice(0, 8),
    [orders, selectedRestaurantId],
  );

  if (restaurants.length === 0) {
    return (
      <main className="grid gap-6 mx-auto max-w-content p-6 [@media(max-width:47.99rem)]:p-4 [&_h1]:mt-0 [&_h2]:mt-0 [&_p]:mt-0">
        <h1>Dashboard</h1>
        <EmptyState
          action={
            onCreateRestaurant
              ? { label: "Create restaurant", onClick: onCreateRestaurant }
              : undefined
          }
          description="Add your restaurant details, then build a menu and start receiving orders."
          title="Create your first restaurant"
        />
        <ol className="grid grid-cols-3 gap-4 [@media(max-width:47.99rem)]:grid-cols-1">
          <li>Restaurant details</li>
          <li>Add dishes</li>
          <li>Receive orders</li>
        </ol>
      </main>
    );
  }

  return (
    <main className="grid gap-6 mx-auto max-w-content p-6 [@media(max-width:47.99rem)]:p-4 [&_h1]:mt-0 [&_h2]:mt-0 [&_p]:mt-0">
      <header className="flex [align-items:end] justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch">
        <div>
          <p className="mb-2 text-jade-text text-[length:var(--text-small)] font-[750] tracking-[0.08em] uppercase">
            Last 7 calendar days
          </p>
          <h1>Dashboard</h1>
        </div>
        <div className="min-w-60 [@media(max-width:47.99rem)]:min-w-0">
          <Select
            label="Restaurant"
            onChange={(event) => onRestaurantChange(event.target.value || null)}
            value={selectedRestaurantId ?? ""}
          >
            <option value="">All restaurants</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </Select>
        </div>
      </header>

      <section
        aria-label="Owner metrics"
        className="grid grid-cols-4 gap-4 [@media(max-width:63.99rem)]:grid-cols-2"
      >
        <MetricCard
          description="Order sales in the last 7 days"
          label="Sales"
          value={<Money minor={metrics.salesMinor} />}
        />
        <MetricCard
          description="Orders in the last 7 days"
          label="Orders"
          value={metrics.orderCount}
        />
        <MetricCard
          description="Rounded to the nearest cent"
          label="Average order"
          value={<Money minor={metrics.averageOrderMinor} />}
        />
        <MetricCard
          description="All current non-delivered orders"
          label="Active orders"
          value={metrics.activeOrderCount}
        />
      </section>

      <section className="grid grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] gap-4 [@media(max-width:47.99rem)]:grid-cols-1">
        <SalesChart dailySales={metrics.dailySales} />
        <TopDishesChart dishes={metrics.topDishes} />
      </section>

      <section aria-labelledby="owner-active-orders-title">
        <div className="flex [align-items:end] justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch">
          <h2 id="owner-active-orders-title">Active orders</h2>
          {onViewAllOrders ? (
            <Button onClick={() => onViewAllOrders(selectedRestaurantId)} variant="tertiary">
              View all orders
            </Button>
          ) : null}
        </div>
        {activeOrders.length === 0 ? (
          <EmptyState
            description="New orders and in-progress deliveries will appear here."
            title="No active orders"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 [@media(max-width:47.99rem)]:grid-cols-1">
            {activeOrders.map((order) => (
              <OrderCard
                action={renderOrderAction?.(order)}
                key={order.id}
                onView={onViewOrder}
                order={order}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
