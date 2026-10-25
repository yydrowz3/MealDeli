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
    <section className="mx-auto grid max-w-360 gap-6 p-6 [@media(max-width:47.99rem)]:p-4">
      <header className="grid grid-cols-[minmax(12rem,22rem)_1fr] items-center gap-6 [@media(max-width:47.99rem)]:items-stretch [@media(max-width:47.99rem)]:grid-cols-[1fr]">
        {restaurant.image ? (
          <img
            alt=""
            className="h-56 w-full rounded-[var(--radius-lg)] object-cover"
            src={restaurant.image}
          />
        ) : (
          <div
            className="h-56 min-h-24 w-full rounded-[var(--radius-lg)] object-cover [background:linear-gradient(135deg,var(--color-surface-muted),var(--color-border))]"
            aria-hidden="true"
          />
        )}
        <div>
          <p className="m-0 [color:var(--color-text-muted)] [font-size:var(--font-size-sm)] font-bold tracking-[0.08em] uppercase">
            {text(restaurant.category.name)}
          </p>
          <h1 className="m-0">{text(restaurant.name)}</h1>
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
      <div className="grid grid-cols-[repeat(3,1fr)] gap-4 [@media(max-width:47.99rem)]:grid-cols-2 [&_strong]:[font-size:var(--font-size-2xl)]">
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
                className="flex items-center justify-between gap-4 [@media(max-width:47.99rem)]:grid [@media(max-width:47.99rem)]:items-stretch [@media(max-width:47.99rem)]:grid-cols-[1fr]"
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
