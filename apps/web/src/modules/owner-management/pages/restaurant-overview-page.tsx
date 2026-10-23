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
  if (error) return <ErrorState title="We couldn’t load this restaurant." />;
  if (restaurant === undefined) return <Skeleton style={{ height: "28rem" }} />;
  if (restaurant === null) return <ErrorState title="Restaurant not found." />;
  const activeOrders = orders.filter((order) => order.status !== "DELIVERED");
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const salesMinor = orders
    .filter((order) => Date.parse(order.createdAt) >= sevenDaysAgo)
    .reduce((sum, order) => sum + order.totalMinor, 0);
  const recent = [...orders]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);
  return (
    <section className="owner-page">
      <header className="owner-overview-hero">
        {restaurant.image ? (
          <img alt="" src={restaurant.image} />
        ) : (
          <div className="owner-image-placeholder" aria-hidden="true" />
        )}
        <div>
          <p className="owner-page__eyebrow">{restaurant.category.name}</p>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.address}</p>
        </div>
      </header>
      <div className="owner-card-actions">
        <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}>Manage menu</Button>
        <Button onClick={() => navigate(`/orders?restaurant=${restaurant.id}`)} variant="secondary">
          View orders
        </Button>
        <Button
          onClick={() => navigate(`/restaurants/${restaurant.id}/settings`)}
          variant="secondary"
        >
          Edit restaurant
        </Button>
        <Button
          onClick={() => navigate(`/restaurants/${restaurant.id}/promotion`)}
          variant="tertiary"
        >
          Promote restaurant
        </Button>
      </div>
      <div className="owner-summary-grid">
        <Card>
          <p>Dishes</p>
          <strong>{restaurant.dishes.length}</strong>
        </Card>
        <Card>
          <p>Active orders</p>
          <strong>{activeOrders.length}</strong>
        </Card>
        <Card>
          <p>Sales · Last 7 days</p>
          <strong>
            <Money minor={salesMinor} />
          </strong>
        </Card>
      </div>
      {restaurant.dishes.length === 0 ? (
        <Card>
          <h2>Add your first dish</h2>
          <p>Add dishes so customers can place an order.</p>
          <Button onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}>Add dish</Button>
        </Card>
      ) : null}
      <section>
        <div className="owner-section-heading">
          <h2>Recent orders</h2>
        </div>
        {recent.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="owner-recent-orders">
            {recent.map((order) => (
              <Card key={order.id}>
                <strong>Order #{order.id.slice(-8).toUpperCase()}</strong>
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
