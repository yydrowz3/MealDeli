import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { RequireAccess, getMealDeliRuntime } from "../app";
import { CourierDashboardPage } from "../modules/courier";
import { sessionUserAtom } from "../modules/identity";
import type { Order } from "../modules/orders";
import { OwnerDashboardPage } from "../modules/owner-insights";
import {
  OwnerOrdersAction,
  selectedOwnerRestaurantIdAtom,
  setSelectedOwnerRestaurantAtom,
  type OwnerRestaurant,
} from "../modules/owner-management";
import { ErrorState, Skeleton } from "../shared/ui";

export const Route = createFileRoute("/dashboard")({ component: DashboardRoute });

function DashboardRoute() {
  const runtime = getMealDeliRuntime();
  const user = useAtomValue(sessionUserAtom);
  return (
    <RequireAccess
      route={{ requiresAuth: true, requiresVerification: true, allowedRoles: ["OWNER", "COURIER"] }}
    >
      {user?.role === "COURIER" ? (
        <CourierDashboardPage
          onNavigateDelivery={(orderId) => window.location.assign(`/deliveries/${orderId}`)}
          repository={runtime.courierRepository}
          subscriptions={runtime.orderSubscriptions}
        />
      ) : (
        <OwnerDashboardRouteContent />
      )}
    </RequireAccess>
  );
}

function OwnerDashboardRouteContent() {
  const runtime = getMealDeliRuntime();
  const selectedRestaurantId = useAtomValue(selectedOwnerRestaurantIdAtom);
  const setSelectedRestaurant = useSetAtom(setSelectedOwnerRestaurantAtom);
  const [data, setData] = useState<Readonly<{
    restaurants: readonly OwnerRestaurant[];
    orders: readonly Order[];
  }> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    void Promise.all([runtime.ownerRepository.list(), runtime.orderRepository.list()])
      .then(([restaurants, orders]) => {
        if (active) setData({ restaurants, orders });
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [runtime]);

  if (error) return <ErrorState title="We couldn’t load your dashboard." />;
  if (!data) return <Skeleton aria-label="Loading owner dashboard" style={{ height: "32rem" }} />;
  return (
    <OwnerDashboardPage
      onCreateRestaurant={() => window.location.assign("/restaurants/new")}
      onRestaurantChange={(restaurantId) => setSelectedRestaurant(restaurantId)}
      onViewAllOrders={() => window.location.assign("/orders")}
      onViewOrder={(order) => window.location.assign(`/orders/${order.id}`)}
      orders={data.orders}
      renderOrderAction={(order) => (
        <OwnerOrdersAction
          onOrder={(next) =>
            setData((current) =>
              current
                ? {
                    ...current,
                    orders: [next, ...current.orders.filter((item) => item.id !== next.id)],
                  }
                : current,
            )
          }
          order={order}
          repository={runtime.orderRepository}
        />
      )}
      restaurants={data.restaurants}
      selectedRestaurantId={selectedRestaurantId}
    />
  );
}
