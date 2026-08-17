import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button, EmptyState, ErrorState, Select, Skeleton } from "../../../shared/ui";

import { OrderCard } from "../components/order-card";
import { OrderTable } from "../components/order-table";
import { projectOrdersForRole } from "../model/role-projection";
import { ORDER_STATUS_LABELS } from "../model/status-machine";
import { ORDER_STATUSES, type Order, type OrderRole, type OrderStatus } from "../model/types";

export type OrdersPageState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "error"; message?: string }>
  | Readonly<{ kind: "ready"; orders: readonly Order[] }>;

export type OrdersPageProps = Readonly<{
  role: OrderRole;
  state: OrdersPageState;
  restaurants?: readonly Readonly<{ id: string; name: string }>[];
  onRetry?: () => void;
  onViewOrder?: (order: Order) => void;
  renderAction?: (order: Order) => ReactNode;
}>;

const emptyCopy = {
  current: ["No active orders", "When you place an order, its live status will appear here."],
  past: ["No past orders yet", "Completed orders will appear here."],
  active: ["No active delivery", "Accepted deliveries will appear here."],
  completed: ["No completed deliveries yet", "Completed deliveries will appear here."],
  all: ["No orders found", "Try changing the restaurant or status filter."],
} as const;

export function OrdersPage({
  role,
  state,
  restaurants = [],
  onRetry,
  onViewOrder,
  renderAction,
}: OrdersPageProps) {
  const [selectedSection, setSelectedSection] = useState(role === "COURIER" ? "active" : "current");
  const [restaurantId, setRestaurantId] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");

  useEffect(() => {
    setSelectedSection(role === "COURIER" ? "active" : "current");
  }, [role]);

  const sections = useMemo(
    () =>
      state.kind === "ready"
        ? projectOrdersForRole(state.orders, role, {
            restaurantId: restaurantId || undefined,
            status: status || undefined,
          })
        : [],
    [restaurantId, role, state, status],
  );
  const activeSection =
    sections.find((section) => section.id === selectedSection) ?? sections[0];
  const title = role === "CUSTOMER" ? "Your orders" : role === "COURIER" ? "Delivery history" : "Orders";

  return (
    <main className="orders-page">
      <header className="orders-page__header">
        <h1>{title}</h1>
      </header>

      {state.kind === "loading" ? (
        <div aria-label="Loading orders" className="orders-loading">
          <Skeleton /><Skeleton /><Skeleton />
        </div>
      ) : null}

      {state.kind === "error" ? (
        <ErrorState
          action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
          description={state.message}
          title="We couldn’t load your orders."
        />
      ) : null}

      {state.kind === "ready" && role === "OWNER" ? (
        <div className="orders-filters">
          <Select label="Restaurant" onChange={(event) => setRestaurantId(event.target.value)} value={restaurantId}>
            <option value="">All restaurants</option>
            {restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
          </Select>
          <Select label="Status" onChange={(event) => setStatus(event.target.value as OrderStatus | "")} value={status}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((orderStatus) => <option key={orderStatus} value={orderStatus}>{ORDER_STATUS_LABELS[orderStatus]}</option>)}
          </Select>
        </div>
      ) : null}

      {state.kind === "ready" && role !== "OWNER" ? (
        <div aria-label="Order sections" className="orders-tabs" role="tablist">
          {sections.map((section) => (
            <Button
              aria-selected={activeSection?.id === section.id}
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              role="tab"
              variant={activeSection?.id === section.id ? "primary" : "secondary"}
            >
              {section.label}
            </Button>
          ))}
        </div>
      ) : null}

      {state.kind === "ready" && activeSection ? (
        activeSection.orders.length === 0 ? (
          <EmptyState
            description={emptyCopy[activeSection.id][1]}
            title={emptyCopy[activeSection.id][0]}
          />
        ) : role === "OWNER" ? (
          <OrderTable orders={activeSection.orders} onView={onViewOrder} renderAction={renderAction} />
        ) : (
          <div className="orders-grid">
            {activeSection.orders.map((order) => (
              <OrderCard
                action={renderAction?.(order)}
                key={order.id}
                onView={onViewOrder}
                order={order}
                viewLabel={role === "COURIER" && order.status === "PICKED" ? "Continue delivery" : order.status === "DELIVERED" ? "View order" : "Track order"}
              />
            ))}
          </div>
        )
      ) : null}
    </main>
  );
}
