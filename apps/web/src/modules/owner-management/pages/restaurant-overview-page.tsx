import { useI18n } from "../../../shared/i18n";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import type { Order, OrderRepository } from "../../orders";
import {
  Button,
  Card,
  DateTime,
  ErrorState,
  Money,
  Skeleton,
  StatusBadge,
} from "../../../shared/ui";
import { setSelectedOwnerRestaurantAtom } from "../model/selection-atoms";
import type { OwnerRestaurant, OwnerRestaurantRepository } from "../model/types";

export type OwnerRestaurantOverviewPageProps = Readonly<{
  restaurantId: string;
  repository: OwnerRestaurantRepository;
  orderRepository: Pick<OrderRepository, "list">;
  navigate: (path: string) => void;
}>;

export function OwnerRestaurantOverviewPage({
  restaurantId,
  repository,
  orderRepository,
  navigate,
}: OwnerRestaurantOverviewPageProps) {
  const { t, text, formatNumber } = useI18n();
  const [restaurant, setRestaurant] = useState<OwnerRestaurant | null | undefined>(undefined);
  const [orders, setOrders] = useState<readonly Order[]>([]);
  const [error, setError] = useState(false);
  const select = useSetAtom(setSelectedOwnerRestaurantAtom);
  useEffect(() => {
    let active = true;
    void Promise.all([repository.get(restaurantId), orderRepository.list()])
      .then(([next, allOrders]) => {
        if (!active) return;
        setRestaurant(next);
        if (next) {
          select(next.id);
          setOrders(allOrders.filter((order) => order.restaurantId === next.id));
        }
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [orderRepository, repository, restaurantId, select]);
  if (error) return <ErrorState title={t("common.loadRestaurantFailed")} />;
  if (restaurant === undefined) return <Skeleton className="h-112" />;
  if (restaurant === null) return <ErrorState title={t("common.restaurantNotFound")} />;
  const activeOrders = orders.filter((order) => order.status !== "DELIVERED");
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const salesMinor = orders
    .filter((order) => Date.parse(order.createdAt) >= sevenDaysAgo)
    .reduce((sum, order) => sum + order.totalMinor, 0);
  const recent = [...orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);
  return (
    <section className="mx-auto grid max-w-360 gap-6 p-4 md:p-6">
      <header className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
        {restaurant.image ? (
          <img alt="" className="h-56 w-full rounded-card object-cover" src={restaurant.image} />
        ) : (
          <div
            className="h-56 w-full rounded-card bg-neutral-soft"
            aria-hidden="true"
          />
        )}
        <div>
          <p className="text-small text-muted font-bold uppercase">
            {text(restaurant.category.name)}
          </p>
          <h1>{text(restaurant.name)}</h1>
          <p>{text(restaurant.address)}</p>
        </div>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}>
          {t("owner.manageMenu")}
        </Button>
        <Button onClick={() => navigate(`/orders?restaurant=${restaurant.id}`)} variant="secondary">
          {t("owner.viewOrders")}
        </Button>
        <Button
          onClick={() => navigate(`/restaurants/${restaurant.id}/settings`)}
          variant="secondary"
        >
          {t("owner.editRestaurant")}
        </Button>
        <Button
          onClick={() => navigate(`/restaurants/${restaurant.id}/promotion`)}
          variant="tertiary"
        >
          {t("owner.promoteRestaurant")}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&_strong]:text-2xl">
        <Card>
          <p>{t("owner.dishes")}</p>
          <strong>{formatNumber(restaurant.dishes.length)}</strong>
        </Card>
        <Card>
          <p>{t("insights.activeOrders")}</p>
          <strong>{formatNumber(activeOrders.length)}</strong>
        </Card>
        <Card>
          <p>{t("insights.salesTitle")}</p>
          <strong>
            <Money minor={salesMinor} />
          </strong>
        </Card>
      </div>
      {restaurant.dishes.length === 0 ? (
        <Card>
          <h2>{t("owner.firstDish")}</h2>
          <p>{t("owner.emptyMenuHelp")}</p>
          <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}>
            {t("owner.addDish")}
          </Button>
        </Card>
      ) : null}
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2>{t("owner.recentOrders")}</h2>
        </div>
        {recent.length === 0 ? (
          <p>{t("owner.noOrders")}</p>
        ) : (
          <div className="grid gap-3">
            {recent.map((order) => (
              <Card
                className="grid gap-4 md:flex md:items-center md:justify-between"
                key={order.id}
              >
                <strong>
                  {t("common.orderNumber")}
                  {text(order.id.slice(-8).toUpperCase())}
                </strong>
                <DateTime value={order.createdAt} />
                <StatusBadge status={order.status} />
                <Money minor={order.totalMinor} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
