import { useI18n } from "../../../shared/i18n";
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
  const { t, text } = useI18n();
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
      <main className="grid gap-6 mx-auto max-w-content p-4 md:p-6">
        <h1>{t("common.dashboard")}</h1>
        <EmptyState
          action={
            onCreateRestaurant
              ? { label: t("owner.createRestaurant"), onClick: onCreateRestaurant }
              : undefined
          }
          description={t("insights.firstRestaurantHelp")}
          title={t("insights.firstRestaurant")}
        />
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <li>{t("insights.restaurantDetails")}</li>
          <li>{t("insights.addDishes")}</li>
          <li>{t("insights.receiveOrders")}</li>
        </ol>
      </main>
    );
  }

  return (
    <main className="grid gap-6 mx-auto max-w-content p-4 md:p-6">
      <header className="grid gap-4 md:flex md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-jade-text text-small font-bold uppercase">
            {t("insights.lastSevenDays")}
          </p>
          <h1>{t("common.dashboard")}</h1>
        </div>
        <div className="md:min-w-60">
          <Select
            label={t("common.restaurant")}
            onChange={(event) => onRestaurantChange(event.target.value || null)}
            value={selectedRestaurantId ?? ""}
          >
            <option value="">{t("common.allRestaurants")}</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {text(restaurant.name)}
              </option>
            ))}
          </Select>
        </div>
      </header>

      <section
        aria-label={t("insights.metrics")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          description={t("insights.salesHelp")}
          label={t("insights.sales")}
          value={<Money minor={metrics.salesMinor} />}
        />
        <MetricCard
          description={t("insights.ordersHelp")}
          label={t("common.orders")}
          value={metrics.orderCount}
        />
        <MetricCard
          description={t("insights.averageHelp")}
          label={t("insights.averageOrder")}
          value={<Money minor={metrics.averageOrderMinor} />}
        />
        <MetricCard
          description={t("insights.activeOrdersHelp")}
          label={t("insights.activeOrders")}
          value={metrics.activeOrderCount}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SalesChart dailySales={metrics.dailySales} />
        <TopDishesChart dishes={metrics.topDishes} />
      </section>

      <section aria-labelledby="owner-active-orders-title">
        <div className="grid gap-4 md:flex md:items-end md:justify-between">
          <h2 id="owner-active-orders-title">{t("insights.activeOrders")}</h2>
          {onViewAllOrders ? (
            <Button onClick={() => onViewAllOrders(selectedRestaurantId)} variant="tertiary">
              {t("insights.viewOrders")}
            </Button>
          ) : null}
        </div>
        {activeOrders.length === 0 ? (
          <EmptyState description={t("insights.emptyActiveHelp")} title={t("orders.emptyActive")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
