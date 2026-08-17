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
      <main className="owner-insights-page">
        <h1>Dashboard</h1>
        <EmptyState
          action={onCreateRestaurant ? { label: "Create restaurant", onClick: onCreateRestaurant } : undefined}
          description="Add your restaurant details, then build a menu and start receiving orders."
          title="Create your first restaurant"
        />
        <ol className="owner-insights-onboarding">
          <li>Restaurant details</li>
          <li>Add dishes</li>
          <li>Receive orders</li>
        </ol>
      </main>
    );
  }

  return (
    <main className="owner-insights-page">
      <header className="owner-insights-page__header">
        <div>
          <p className="owner-insights-eyebrow">Last 7 calendar days</p>
          <h1>Dashboard</h1>
        </div>
        <Select
          label="Restaurant"
          onChange={(event) => onRestaurantChange(event.target.value || null)}
          value={selectedRestaurantId ?? ""}
        >
          <option value="">All restaurants</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
          ))}
        </Select>
      </header>

      <section aria-label="Owner metrics" className="owner-insights-metrics">
        <MetricCard
          description="Order sales in the last 7 days"
          label="Sales"
          value={<Money minor={metrics.salesMinor} />}
        />
        <MetricCard description="Orders in the last 7 days" label="Orders" value={metrics.orderCount} />
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

      <section className="owner-insights-charts">
        <SalesChart dailySales={metrics.dailySales} />
        <TopDishesChart dishes={metrics.topDishes} />
      </section>

      <section aria-labelledby="owner-active-orders-title" className="owner-insights-active-orders">
        <div className="owner-insights-section-heading">
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
          <div className="owner-insights-orders-grid">
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
