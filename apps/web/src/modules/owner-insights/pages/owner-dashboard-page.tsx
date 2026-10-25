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
      <main className="grid gap-6 mx-auto max-w-content p-6 [@media(max-width:47.99rem)]:p-4 [&_h1]:mt-0 [&_h2]:mt-0 [&_p]:mt-0">
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
        <ol className="grid grid-cols-3 gap-4 [@media(max-width:47.99rem)]:grid-cols-1">
          <li>{t("insights.restaurantDetails")}</li>
          <li>{t("insights.addDishes")}</li>
          <li>{t("insights.receiveOrders")}</li>
        </ol>
      </main>
    );
  }

  return (
    <main className="grid gap-6 mx-auto max-w-content p-6 [@media(max-width:47.99rem)]:p-4 [&_h1]:mt-0 [&_h2]:mt-0 [&_p]:mt-0">
      <header className="flex [align-items:end] justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch">
        <div>
          <p className="mb-2 text-jade-text text-[length:var(--text-small)] font-[750] tracking-[0.08em] uppercase">
            {t("insights.lastSevenDays")}
          </p>
          <h1>{t("common.dashboard")}</h1>
        </div>
        <div className="min-w-60 [@media(max-width:47.99rem)]:min-w-0">
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
        className="grid grid-cols-4 gap-4 [@media(max-width:63.99rem)]:grid-cols-2"
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

      <section className="grid grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] gap-4 [@media(max-width:47.99rem)]:grid-cols-1">
        <SalesChart dailySales={metrics.dailySales} />
        <TopDishesChart dishes={metrics.topDishes} />
      </section>

      <section aria-labelledby="owner-active-orders-title">
        <div className="flex [align-items:end] justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch">
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
