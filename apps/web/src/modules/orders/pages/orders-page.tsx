import { errorMessage, message as localizedMessage, useI18n } from "../../../shared/i18n";
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
  current: [localizedMessage("orders.emptyActive"), localizedMessage("orders.emptyActiveHelp")],
  past: [localizedMessage("orders.emptyPast"), localizedMessage("orders.emptyPastHelp")],
  active: [localizedMessage("orders.emptyDelivery"), localizedMessage("orders.emptyDeliveryHelp")],
  completed: [
    localizedMessage("orders.emptyCompleted"),
    localizedMessage("orders.emptyCompletedHelp"),
  ],
  all: [localizedMessage("orders.emptyAll"), localizedMessage("orders.emptyAllHelp")],
} as const;

export function OrdersPage({
  role,
  state,
  restaurants = [],
  onRetry,
  onViewOrder,
  renderAction,
}: OrdersPageProps) {
  const { t, text } = useI18n();
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
  const activeSection = sections.find((section) => section.id === selectedSection) ?? sections[0];
  const title =
    role === "CUSTOMER"
      ? t("orders.yourOrders")
      : role === "COURIER"
        ? t("orders.deliveryHistory")
        : t("common.orders");

  return (
    <main className="mx-auto grid w-full max-w-content gap-6 p-4 text-charcoal md:p-6">
      <header>
        <h1 className="text-page">{text(title)}</h1>
      </header>

      {state.kind === "loading" ? (
        <div aria-label={t("orders.loading")} className="grid gap-4">
          <Skeleton className="min-h-40!" />
          <Skeleton className="min-h-40!" />
          <Skeleton className="min-h-40!" />
        </div>
      ) : null}

      {state.kind === "error" ? (
        <ErrorState
          action={onRetry ? { label: t("common.tryAgain"), onClick: onRetry } : undefined}
          description={text(errorMessage(state.message, "common.connectionRetry"))}
          title={t("orders.loadFailed")}
        />
      ) : null}

      {state.kind === "ready" && role === "OWNER" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label={t("common.restaurant")}
            onChange={(event) => setRestaurantId(event.target.value)}
            value={restaurantId}
          >
            <option value="">{t("common.allRestaurants")}</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {text(restaurant.name)}
              </option>
            ))}
          </Select>
          <Select
            label={t("orders.status")}
            onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
            value={status}
          >
            <option value="">{t("orders.allStatuses")}</option>
            {ORDER_STATUSES.map((orderStatus) => (
              <option key={orderStatus} value={orderStatus}>
                {text(ORDER_STATUS_LABELS[orderStatus])}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {state.kind === "ready" && role !== "OWNER" ? (
        <div aria-label={t("orders.sections")} className="flex gap-2" role="tablist">
          {sections.map((section) => (
            <Button
              aria-selected={activeSection?.id === section.id}
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              role="tab"
              variant={activeSection?.id === section.id ? "primary" : "secondary"}
            >
              {text(section.label)}
            </Button>
          ))}
        </div>
      ) : null}

      {state.kind === "ready" && activeSection ? (
        activeSection.orders.length === 0 ? (
          <EmptyState
            description={text(emptyCopy[activeSection.id][1])}
            title={text(emptyCopy[activeSection.id][0])}
          />
        ) : role === "OWNER" ? (
          <OrderTable
            orders={activeSection.orders}
            onView={onViewOrder}
            renderAction={renderAction}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeSection.orders.map((order) => (
              <OrderCard
                action={renderAction?.(order)}
                key={order.id}
                onView={onViewOrder}
                order={order}
                viewLabel={text(
                  role === "COURIER" && order.status === "PICKED"
                    ? t("courier.continueDelivery")
                    : order.status === "DELIVERED"
                      ? t("common.viewOrder")
                      : t("orders.track"),
                )}
              />
            ))}
          </div>
        )
      ) : null}
    </main>
  );
}
